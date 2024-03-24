import { BattleRoom } from '@/client/room/battleRoom';
import { Protocol } from '@pkmn/protocol';

export function WaitRequest({ req, battle }: Readonly<{ req: Protocol.WaitRequest; battle: BattleRoom }>) {
    return <div>Waiting...</div>;
}
