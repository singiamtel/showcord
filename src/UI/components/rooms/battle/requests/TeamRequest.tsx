import { BattleRoom } from '@/client/room/battleRoom';
import { Protocol } from '@pkmn/protocol';

export function TeamRequest({ req, battle }: Readonly<{ req: Protocol.TeamRequest; battle: BattleRoom }>) {
    return <div>Team request, max team size: {req.maxTeamSize}
    </div>;
}
