import { assert } from '@/lib/utils';
import { HTMLAttributes, useEffect, useState } from 'react';
import { useClientContext } from '../../single/ClientContext';
import { MoveRequest } from './requests/MoveRequest';
import { WaitRequest } from './requests/WaitRequest';
import { TeamRequest } from './requests/TeamRequest';
import { SwitchRequest } from './requests/SwitchRequest';
import { useClientStore } from '@/client/client';
import { BattleRoom } from '@/client/room/battleRoom';

export default function BattleControls(_props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const { client } = useClientContext();
    const battle = useClientStore(state => state.currentRoom) as BattleRoom;
    assert(battle?.type === 'battle', 'Trying to render BattleWindow in a room that is not a BattleRoom');
    const [req, setReq] = useState(battle.battle.request);
    useEffect(() => {
        const listener = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setReq({ ...detail });
        };

        client.events.addEventListener('request', listener);
        return () => {
            client.events.removeEventListener('request', listener);
        };
    }, [battle]);

    if (!req) {
        return <div>Loading...</div>;
    }

    const requestType = req.requestType;
    if (!requestType) { return <WaitRequest req={req} battle={battle} />; }
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

