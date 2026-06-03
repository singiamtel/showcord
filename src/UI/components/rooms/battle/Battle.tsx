import React, { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import $ from 'jquery';
import { useRoomStore } from '@/client/client';
import type { BattleRoom } from '@/client/room/battleRoom';
import { useRoomID } from '@/UI/components/RoomContext';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
import './battle-tooltips.css';

function updateMyPokemonFromRequest(battle: any, line: string) {
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
        battle.myPokemon = request.side.pokemon.map((p: RequestPokemon) => {
            const output: Record<string, unknown> = {};
            const identParts = p.ident.split(': ');
            const pokemonid = p.ident;
            const name = identParts.slice(1).join(': ') || identParts[0];

            battle.parseDetails(name, pokemonid, p.details, output);
            battle.parseHealth(p.condition, output);

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

            return output;
        });
    } catch (e) {
        logger.error('Failed to parse request for myPokemon', e);
    }
}

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
    const battleInstanceRef = useRef<any>(null);
    const logIndexRef = useRef(0);
    const [vendorLoaded, setVendorLoaded] = useState(false);
    const vendorRef = useRef<{
        VisualBattle: any;
    } | null>(null);

    // Dynamically load vendor modules
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            await import('../../../../utils/showdown-globals');
            if (cancelled) return;

            const [dexMod, battleMod, tipsMod] = await Promise.all([
                import('@/vendor/pokemon-showdown/battle-dex'),
                import('@/vendor/pokemon-showdown/battle'),
                import('@/vendor/pokemon-showdown/battle-tooltips'),
            ]);
            if (cancelled) return;

            const { Dex, toID } = dexMod;
            const VisualBattle = battleMod.Battle;
            const BattleTooltips = tipsMod.BattleTooltips;

            // Set globals that vendor IIFEs and MoveRequest depend on
            window.Dex = Dex;
            window.toID = toID;
            useRoomStore.getState().markDexLoaded();

            // Guard against tooltip crash when side.pokemon[index] is undefined
            const origShowPokemonTooltip = BattleTooltips.prototype.showPokemonTooltip;
            BattleTooltips.prototype.showPokemonTooltip = function (...args: [any, any]) {
                if (!args[0] && !args[1]) return '';
                return origShowPokemonTooltip.apply(this, args);
            };

            vendorRef.current = { VisualBattle };
            setVendorLoaded(true);
        };

        load();
        return () => { cancelled = true; };
    }, []);

    // Initialize Battle
    useEffect(() => {
        if (!hostRef.current || !vendorLoaded || !vendorRef.current) return;

        const host = hostRef.current;
        let shadow = host.shadowRoot;
        if (!shadow) {
            shadow = host.attachShadow({ mode: 'open' });
        }

        let cancelled = false;
        const { VisualBattle } = vendorRef.current;

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
            const battleId = (room.ID || 'battle-view');

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

            // Subscribe to new log lines BEFORE feeding initial log,
            // to avoid missing lines that arrive during async init
            room.onLogUpdate = (line) => {
                updateMyPokemonFromRequest(battle, line);
                battle.add(line);
                logIndexRef.current = room.log.length;
            };

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
            room.onLogUpdate = null;
            const battleDiv = shadow!.querySelector('.battle');
            const logDiv = shadow!.querySelector('.battle-log');
            if (battleDiv) $(battleDiv).empty();
            if (logDiv) $(logDiv).empty();
            battleInstanceRef.current = null;
        };
    }, [room.ID, vendorLoaded, perspective, room, roomID]);

    if (!vendorLoaded) {
        return <div className={cn(props.className, 'flex items-center justify-center')}>Loading Battle Engine…</div>;
    }

    return (
        <div className={cn(props.className, 'w-full max-h-full aspect-video bg-gray-125 relative')}>
            <div ref={hostRef} className="w-full h-full" />
        </div>
    );
}
