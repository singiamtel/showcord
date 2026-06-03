import { useEffect, useState } from 'react';
import { useRoomStore } from '@/client/client';
import type { BattleRoom } from '@/client/room/battleRoom';
import { useRoomID } from '@/UI/components/RoomContext';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TimerDisplay() {
    const roomID = useRoomID();
    const room = useRoomStore(state => state.rooms.get(roomID)) as BattleRoom;
    const [timerState, setTimerState] = useState<{
        startValue: number; total: number; active: boolean; startedAt: number;
    }>({
        startValue: room?.timerStartValue ?? 0,
        total: room?.timerTotal ?? 300,
        active: room?.timerActive ?? false,
        startedAt: room?.timerStartedAt ?? 0,
    });
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!room) return;
        room.onTimerUpdate = (data) => {
            setTimerState({ ...data, startedAt: Date.now() });
        };
        return () => { room.onTimerUpdate = null; };
    }, [room]);

    useEffect(() => {
        if (!timerState.active) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [timerState.active]);

    if (!timerState.active) return null;

    const elapsed = (now - timerState.startedAt) / 1000;
    const displayTime = Math.max(0, timerState.startValue - elapsed);
    const pct = timerState.total > 0 ? displayTime / timerState.total : 0;

    let barColor = 'bg-green-500';
    if (pct < 0.15) barColor = 'bg-red-500';
    else if (pct < 0.3) barColor = 'bg-yellow-500';

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Timer
            </span>
            <div className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden min-w-[60px]">
                <div
                    className={cn('h-full rounded-full transition-all duration-1000', barColor)}
                    style={{ width: `${Math.max(0, pct * 100)}%` }}
                />
            </div>
            <span className={cn(
                'text-xs font-mono font-bold tabular-nums',
                pct < 0.15 ? 'text-red-500' : pct < 0.3 ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-200',
            )}>
                {formatTime(displayTime)}
            </span>
        </div>
    );
}
