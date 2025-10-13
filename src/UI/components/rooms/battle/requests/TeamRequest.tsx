import type { BattleRoom } from '@/client/room/battleRoom';
import type { Protocol } from '@pkmn/protocol';

export function TeamRequest({ req }: Readonly<{ req: Protocol.TeamRequest; battle: BattleRoom }>) {
    return <div>Team request, max team size: {req.maxTeamSize}
    </div>;
}
