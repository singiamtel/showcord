import React, { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { Battle as VisualBattle } from '@pkmn-client/battle';
import $ from 'jquery';
import '../../../../utils/showdown-globals';
import { useRoomStore } from '@/client/client';
import type { BattleRoom } from '@/client/room/battleRoom';
import { cn } from '@/lib/utils';

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

export default function BattleWindow(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const room = useRoomStore(state => state.currentRoom) as BattleRoom;
    const battleRef = useRef<HTMLDivElement>(null);
    const logRef = useRef<HTMLDivElement>(null);
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
        if (!battleRef.current || !logRef.current || !isReady) return;

        const $battle = $(battleRef.current);
        const $log = $(logRef.current);
        const battleId = (room.ID || 'battle-view') as any; // Cast to expected ID type

        console.log('Initializing VisualBattle for room', battleId);

        const battle = new VisualBattle({
            id: battleId,
            $frame: $battle,
            $logFrame: $log,
        });

        setBattleInstance(battle);

        // Set perspective if room has one
        if (room.perspective) {
            console.log('Setting viewpoint to', room.perspective);
            battle.setViewpoint(room.perspective);
        }

        // Feed initial log
        if (room.log && room.log.length > 0) {
            console.log('Feeding initial log', room.log.length, 'lines');
            room.log.forEach(line => battle.add(line));
            battle.seekTurn(Infinity);
            logIndexRef.current = room.log.length;
        }
        return () => {
            console.log('Destroying VisualBattle');
            // Clean up DOM if needed, though VisualBattle usually handles its own frame
            $battle.empty();
            // battle.destroy() if available
        };
    }, [isReady, room.ID]);

    // Update perspective
    useEffect(() => {
        if (battleInstance && room.perspective) {
            console.log('Updating viewpoint to', room.perspective);
            battleInstance.setViewpoint(room.perspective);
        }
    }, [battleInstance, room.perspective]);

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
            <div className="battle" ref={battleRef} style={{ width: '100%', height: '100%' }}></div>
            <div className="battle-log" ref={logRef} style={{ display: 'none' }}></div>
        </div>
    );
}
