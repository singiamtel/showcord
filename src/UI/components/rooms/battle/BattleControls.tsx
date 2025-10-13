import { assert } from '@/lib/utils';
import { type HTMLAttributes, useEffect, useState } from 'react';
import { MoveRequest } from './requests/MoveRequest';
import { WaitRequest } from './requests/WaitRequest';
import { TeamRequest } from './requests/TeamRequest';
import { SwitchRequest } from './requests/SwitchRequest';
import { useRoomStore } from '@/client/client';
import type { BattleRoom } from '@/client/room/battleRoom';

export default function BattleControls(_props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const battle = useRoomStore(state => state.currentRoom) as BattleRoom;
    const battleRequest = useRoomStore(state => state.battleRequest);
    assert(battle?.type === 'battle', 'Trying to render BattleWindow in a room that is not a BattleRoom');
    const [req, setReq] = useState(battle.battle.request);

    useEffect(() => {
        if (battleRequest && battleRequest.roomID === battle.ID) {
            setReq({ ...battleRequest.request });
        }
    }, [battleRequest, battle.ID]);

    if (!req) {
        return <div>Loading...</div>;
    }

    const requestType = req.requestType;
    if (!requestType) { return <div>Loading...</div>; }
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
        requestType satisfies never;
        console.error('Bug in BattleControls, unexpected request type', requestType);
        return null;
    }
}

