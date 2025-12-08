import type { BattleRoom } from '@/client/room/battleRoom';
import type { Protocol } from '@pkmn/protocol';

export function TeamRequest({ req }: Readonly<{ req: Protocol.TeamRequest; battle: BattleRoom }>) {
    return <div className='w-full h-full flex items-center justify-center text-gray-700 dark:text-gray-300'>
        Team request, max team size: {req.maxTeamSize}
    </div>;
}
