import { assert, assertNever } from '@/lib/utils';
import { HTMLAttributes, useEffect, useState } from 'react';
import { useClientContext } from '../../single/ClientContext';
import { BattleRoom } from '@/client/room/battleRoom';
import { MoveRequest } from './requests/MoveRequest';
import { WaitRequest } from './requests/WaitRequest';
import { TeamRequest } from './requests/TeamRequest';
import { SwitchRequest } from './requests/SwitchRequest';
import { Client } from '@/client/client';

export default function BattleControls(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const { client, currentRoom: battle } = useClientContext() as {client: Client, currentRoom: BattleRoom | undefined};
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

    switch (req.requestType) {
        case 'move':
            return <MoveRequest req={req} battle={battle} />;
        case 'switch':
            return <SwitchRequest req={req} battle={battle} />;
        case 'team':
            return <TeamRequest req={req} battle={battle} />;
        case 'wait':
            return <WaitRequest req={req} battle={battle} />;
        default:
            assertNever(req);
            return null;
    }
}

