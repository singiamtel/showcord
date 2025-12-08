import type { BattleRoom } from '@/client/room/battleRoom';
import type { Protocol } from '@pkmn/protocol';

export function WaitRequest(_props: Readonly<{ req: Protocol.WaitRequest; battle: BattleRoom }>) {
    return <div className='w-full h-full flex items-center justify-center text-gray-500'>
        Waiting for opponent...
    </div>;
}
