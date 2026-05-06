import { assert } from '@/lib/utils';
import { type HTMLAttributes } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { MoveRequest } from './requests/MoveRequest';
import { WaitRequest } from './requests/WaitRequest';
import { TeamRequest } from './requests/TeamRequest';
import { SwitchRequest } from './requests/SwitchRequest';
import { useRoomStore } from '@/client/client';
import { useClientContext } from '@/UI/components/single/useClientContext';
import type { BattleRoom } from '@/client/room/battleRoom';
import { useRoomID } from '@/UI/components/RoomContext';
import { TimerDisplay } from './TimerDisplay';

export default function BattleControls(_props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const roomID = useRoomID();
    const battle = useRoomStore(state => state.rooms.get(roomID)) as BattleRoom;
    const battleRequest = useRoomStore(state => state.battleRequest);
    const { client } = useClientContext();
    assert(battle?.type === 'battle', 'Trying to render BattleWindow in a room that is not a BattleRoom');

    const req = (battleRequest?.roomID === battle.ID && battleRequest.request) ?
        battleRequest.request :
        battle.battle.request;

    const handleToggleTimer = () => {
        const command = battle.timerActive ? '/timer off' : '/timer on';
        client.send(command, battle.ID);
    };

    const renderRequest = () => {
        if (!req) {
            return null;
        }

        const requestType = req.requestType;
        if (!requestType) { return null; }
        switch (requestType) {
        case 'move':
            return <MoveRequest req={req} battle={battle} />;
        case 'switch':
            return <SwitchRequest req={req} battle={battle} />;
        case 'team':
            return <TeamRequest req={req} battle={battle} />;
        case 'wait':
            return <WaitRequest req={req} battle={battle} />;
        default:
            console.error('Bug in BattleControls, unexpected request type', requestType);
            return null;
        }
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center gap-2 px-2 py-1">
                <TimerDisplay />
                <button
                    type="button"
                    onClick={handleToggleTimer}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    title="Toggle timer"
                >
                    <FontAwesomeIcon icon={faClock} size="sm" />
                </button>
            </div>
            <div className="flex-1 overflow-hidden">
                {req ? renderRequest() : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        Loading...
                    </div>
                )}
            </div>
        </div>
    );
}

