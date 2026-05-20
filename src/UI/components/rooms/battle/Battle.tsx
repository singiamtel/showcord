import React, { useEffect, useRef, type HTMLAttributes } from 'react';
// showdown-globals must be imported before vendor modules to set window.Config etc.
import '../../../../utils/showdown-globals';
import { Dex, toID, type ID } from '@/vendor/pokemon-showdown/battle-dex';
import { Battle as VisualBattle, type PokemonDetails, type PokemonHealth } from '@/vendor/pokemon-showdown/battle';
import { BattleTooltips } from '@/vendor/pokemon-showdown/battle-tooltips';
import $ from 'jquery';
import { useRoomStore } from '@/client/client';
import type { BattleRoom } from '@/client/room/battleRoom';
import { useRoomID } from '@/UI/components/RoomContext';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
import './battle-tooltips.css';

// Guard against tooltip crash when side.pokemon[index] is undefined
// (vendored showPokemonTooltip assumes at least one arg is non-null but doesn't check)
const origShowPokemonTooltip = BattleTooltips.prototype.showPokemonTooltip;
BattleTooltips.prototype.showPokemonTooltip = function (...args) {
    if (!args[0] && !args[1]) return '';
    return origShowPokemonTooltip.apply(this, args);
};

function updateMyPokemonFromRequest(battle: VisualBattle, line: string) {
    if (!line.startsWith('|request|')) return;
    try {
        const json = line.slice('|request|'.length);
        const request = JSON.parse(json);
        if (!request.side?.pokemon) return;

        type RequestPokemon = {
            ident: string;
            details: string;
            condition: string;
            active: boolean;
            reviving?: boolean;
            stats: Record<string, number>;
            moves: unknown[];
            baseAbility: string;
            ability: string;
            item: string;
            pokeball: string;
            teraType: string;
            terastallized: string;
        };
        type ParsedPokemon = Partial<PokemonDetails & PokemonHealth> & Record<string, unknown>;
        battle.myPokemon = request.side.pokemon.map((p: RequestPokemon) => {
            const output: ParsedPokemon = {};
            const identParts = p.ident.split(': ');
            const pokemonid = p.ident;
            const name = identParts.slice(1).join(': ') || identParts[0];

            battle.parseDetails(name, pokemonid, p.details, output as PokemonDetails);
            battle.parseHealth(p.condition, output as PokemonHealth);

            output.active = p.active;
            output.reviving = p.reviving || false;
            output.stats = p.stats;
            output.moves = p.moves;
            output.baseAbility = p.baseAbility;
            output.ability = p.ability;
            output.item = p.item;
            output.pokeball = p.pokeball;
            output.teraType = p.teraType;
            output.terastallized = p.terastallized;

            return output as unknown as NonNullable<typeof battle['myPokemon']>[number];
        });
    } catch (e) {
        logger.error('Failed to parse request for myPokemon', e);
    }
}

// Set window.Dex after vendor modules are loaded (for IIFEs that check it)
window.Dex = Dex;
window.toID = toID;

// Helper to check if PS globals are loaded
const checkGlobals = () => {
    const ready = !!(window.BattlePokedex && window.BattleMovedex && window.BattleTeambuilderTable);
    if (!ready) {
        logger.debug('Waiting for globals...', {
            BattlePokedex: !!window.BattlePokedex,
            BattleMovedex: !!window.BattleMovedex,
            BattleTeambuilderTable: !!window.BattleTeambuilderTable,
        });
    }
    return ready;
};

const BATTLE_CSS = '//play.pokemonshowdown.com/style/battle.css';
const TYPES_CSS = '//play.pokemonshowdown.com/style/sim-types.css';

function loadStyleInShadow(shadow: ShadowRoot, href: string): Promise<void> {
    const existing = shadow.querySelector(`link[href="${href}"]`) as HTMLLinkElement | null;
    if (existing) {
        return new Promise((resolve, reject) => {
            if (existing.sheet) {
                resolve();
                return;
            }
            existing.onload = () => resolve();
            existing.onerror = () => reject(new Error(`Failed to load ${href}`));
        });
    }
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load ${href}`));
        shadow.appendChild(link);
    });
}

export default function BattleWindow(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const roomID = useRoomID();
    const room = useRoomStore(state => state.rooms.get(roomID)) as BattleRoom;
    const perspective = useRoomStore(state => (state.rooms.get(roomID) as BattleRoom | undefined)?.perspective);
    const hostRef = useRef<HTMLDivElement>(null);
    const battleInstanceRef = useRef<VisualBattle | null>(null);
    const logIndexRef = useRef(0);
    const isReadyRef = useRef(checkGlobals());

    // Poll for globals if not ready
    useEffect(() => {
        if (isReadyRef.current) return;
        const interval = setInterval(() => {
            if (checkGlobals()) {
                isReadyRef.current = true;
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Initialize Battle
    useEffect(() => {
        if (!hostRef.current || !isReadyRef.current) return;

        const host = hostRef.current;
        let shadow = host.shadowRoot;
        if (!shadow) {
            shadow = host.attachShadow({ mode: 'open' });
        }

        let cancelled = false;

        const init = async () => {
            await Promise.all([
                loadStyleInShadow(shadow!, BATTLE_CSS),
                loadStyleInShadow(shadow!, TYPES_CSS),
            ]);
            if (cancelled) return;

            let battleDiv = shadow!.querySelector('.battle') as HTMLDivElement | null;
            let logDiv = shadow!.querySelector('.battle-log') as HTMLDivElement | null;

            if (!battleDiv) {
                battleDiv = document.createElement('div');
                battleDiv.className = 'battle';
                shadow!.appendChild(battleDiv);
            }
            if (!logDiv) {
                logDiv = document.createElement('div');
                logDiv.className = 'battle-log';
                logDiv.style.display = 'none';
                shadow!.appendChild(logDiv);
            }

            const $battle = $(battleDiv);
            const $log = $(logDiv);
            const battleId = (room.ID || 'battle-view') as ID;

            logger.debug('Initializing VisualBattle for room', battleId);

            const battle = new VisualBattle({
                id: battleId,
                $frame: $battle,
                $logFrame: $log,
            });

            battleInstanceRef.current = battle;

            // Set perspective if room has one
            if (perspective) {
                logger.debug('Setting viewpoint to', perspective);
                battle.setViewpoint(perspective);
            }

            // Feed initial log
            if (room.log && room.log.length > 0) {
                logger.debug('Feeding initial log', { length: room.log.length });
                room.log.forEach(line => {
                    updateMyPokemonFromRequest(battle, line);
                    battle.add(line);
                });
                battle.seekTurn(Infinity);
                logIndexRef.current = room.log.length;
            }
        };

        init();

        const unsubPerspective = useRoomStore.subscribe((state) => {
            const p = (state.rooms.get(roomID) as BattleRoom | undefined)?.perspective;
            if (p && battleInstanceRef.current) {
                battleInstanceRef.current.setViewpoint(p);
            }
        });

        return () => {
            cancelled = true;
            unsubPerspective();
            logger.debug('Destroying VisualBattle');
            const battleDiv = shadow!.querySelector('.battle');
            const logDiv = shadow!.querySelector('.battle-log');
            if (battleDiv) $(battleDiv).empty();
            if (logDiv) $(logDiv).empty();
            battleInstanceRef.current = null;
        };
    }, [room.ID]);

    // Update log
    useEffect(() => {
        const battle = battleInstanceRef.current;
        if (!battle) return;

        // Catch up on any missed lines (race condition handling)
        if (room.log.length > logIndexRef.current) {
            const newLines = room.log.slice(logIndexRef.current);
            logger.debug('Catching up logs', newLines.length);
            newLines.forEach(line => {
                updateMyPokemonFromRequest(battle, line);
                battle.add(line);
            });
            battle.seekTurn(Infinity);
            logIndexRef.current = room.log.length;
        }

        // Subscribe to new lines
        room.onLogUpdate = (line) => {
            // console.log("Live log line:", line);
            updateMyPokemonFromRequest(battle, line);
            battle.add(line);
            // battle.seekTurn(Infinity);
            logIndexRef.current = room.log.length;
        };

        return () => {
            room.onLogUpdate = null;
        };
    }, [room]);

    if (!isReadyRef.current) {
        return <div className={cn(props.className, 'flex items-center justify-center')}>Loading Battle Engine…</div>;
    }

    return (
        <div className={cn(props.className, 'w-full aspect-video bg-gray-125 relative')}>
            <div ref={hostRef} className="w-full h-full" />
        </div>
    );
}
