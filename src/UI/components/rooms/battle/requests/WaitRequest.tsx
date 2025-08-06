import type { BattleRoom } from '@/client/room/battleRoom';
import type { Protocol } from '@pkmn/protocol';

export function WaitRequest({ req, battle }: Readonly<{ req: Protocol.WaitRequest; battle: BattleRoom }>) {
    return <div>Waiting...</div>;
}
