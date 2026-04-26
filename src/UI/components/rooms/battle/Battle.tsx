import React, { useEffect, useRef, useState, type HTMLAttributes } from 'react';
// showdown-globals must be imported before vendor modules to set window.Config etc.
import '../../../../utils/showdown-globals';
import { Dex, toID } from '@/vendor/pokemon-showdown/battle-dex';
import { Battle as VisualBattle } from '@/vendor/pokemon-showdown/battle';
import $ from 'jquery';
import { useRoomStore } from '@/client/client';
import type { BattleRoom } from '@/client/room/battleRoom';
import { useRoomID } from '@/UI/components/RoomContext';
import { cn } from '@/lib/utils';
import './battle-tooltips.css';

// Set window.Dex after vendor modules are loaded (for IIFEs that check it)
window.Dex = Dex;
window.toID = toID;

// Helper to check if PS globals are loaded
const checkGlobals = () => {
    const ready = !!(window.BattlePokedex && window.BattleMovedex && window.BattleTeambuilderTable);
    if (!ready) {
        console.log('Waiting for globals...', {
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
    const [battleInstance, setBattleInstance] = useState<VisualBattle | null>(null);
    const logIndexRef = useRef(0);
    const [isReady, setIsReady] = useState(() => checkGlobals());

    // Poll for globals if not ready
    useEffect(() => {
        if (isReady) return;
        const interval = setInterval(() => {
            if (checkGlobals()) {
                setIsReady(true);
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isReady]);

    // Initialize Battle
    useEffect(() => {
        if (!hostRef.current || !isReady) return;

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
            const battleId = (room.ID || 'battle-view') as any; // Cast to expected ID type

            console.log('Initializing VisualBattle for room', battleId);

            const battle = new VisualBattle({
                id: battleId,
                $frame: $battle,
                $logFrame: $log,
            });

            setBattleInstance(battle);

            // Set perspective if room has one
            if (perspective) {
                console.log('Setting viewpoint to', perspective);
                battle.setViewpoint(perspective);
            }

            // Feed initial log
            if (room.log && room.log.length > 0) {
                console.log('Feeding initial log', room.log.length, 'lines');
                room.log.forEach(line => battle.add(line));
                battle.seekTurn(Infinity);
                logIndexRef.current = room.log.length;
            }
        };

        init();

        return () => {
            cancelled = true;
            console.log('Destroying VisualBattle');
            const battleDiv = shadow!.querySelector('.battle');
            const logDiv = shadow!.querySelector('.battle-log');
            if (battleDiv) $(battleDiv).empty();
            if (logDiv) $(logDiv).empty();
            setBattleInstance(null);
        };
    }, [isReady, room.ID]);

    // Update perspective
    useEffect(() => {
        if (battleInstance && perspective) {
            console.log('Updating viewpoint to', perspective);
            battleInstance.setViewpoint(perspective);
        }
    }, [battleInstance, perspective]);

    // Update log
    useEffect(() => {
        if (!battleInstance) return;

        // Catch up on any missed lines (race condition handling)
        if (room.log.length > logIndexRef.current) {
            const newLines = room.log.slice(logIndexRef.current);
            console.log('Catching up logs', newLines.length);
            newLines.forEach(line => battleInstance.add(line));
            battleInstance.seekTurn(Infinity);
            logIndexRef.current = room.log.length;
        }

        // Subscribe to new lines
        room.onLogUpdate = (line) => {
            // console.log("Live log line:", line);
            battleInstance.add(line);
            // battleInstance.seekTurn(Infinity);
            logIndexRef.current = room.log.length;
        };

        return () => {
            room.onLogUpdate = null;
        };
    }, [battleInstance, room]);

    if (!isReady) {
        return <div className={cn(props.className, 'flex items-center justify-center')}>Loading Battle Engine...</div>;
    }

    return (
        <div className={cn(props.className, 'w-full aspect-video bg-gray-125 relative')}>
            <div ref={hostRef} className="w-full h-full" />
        </div>
    );
}
