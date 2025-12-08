import { useClientContext } from '@/UI/components/single/useClientContext';
import type { BattleRoom } from '@/client/room/battleRoom';
import { cn } from '@/lib/utils';
import type { Protocol } from '@pkmn/protocol';
import { ChoiceBuilder } from '@pkmn/view';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

function SwitchButton({ pokemon, index, onClick }: Readonly<{ pokemon: Protocol.Request.Pokemon; index: number; onClick: () => void; }>) {
    const isFainted = pokemon.fainted;
    return <motion.button
        type="button"
        className={cn(`p-4 rounded-md transition-colors`,
            isFainted ? 'opacity-50 bg-gray-100 dark:bg-gray-dark cursor-not-allowed' : 'bg-blue-pastel hover:bg-blue-100 dark:bg-blue-dark hover:dark:bg-blue-darkest')}
        onClick={onClick}
        disabled={isFainted}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: isFainted ? 0.5 : 1, scale: 1, y: 0 }}
        transition={{
            type: 'spring',
            stiffness: 400,
            damping: 20,
            delay: index * 0.05,
        }}
        whileHover={isFainted ? undefined : { scale: 1.05, y: -2 }}
        whileTap={isFainted ? undefined : { scale: 0.95 }}
    >{pokemon.name}</motion.button>;
}
export function SwitchRequest({ req, battle }: Readonly<{ req: Protocol.SwitchRequest; battle: BattleRoom }>) {
    const side = req.side;

    const { client } = useClientContext();
    const builder = useMemo(() => new ChoiceBuilder(req), [req]);

    const handleSwitch = (mon: Protocol.Request.Pokemon, idx: number) => {
        builder.addChoice(`switch ${idx + 1}`);
        client.send(`/${builder.toString()}|${req.rqid}`, battle.ID);
    };

    return <div
        className='grid grid-cols-3 grid-rows-2 gap-2 w-full h-full place-items-center p-2'
    >
        {side.pokemon.map((mon, idx) => <SwitchButton key={mon.name} pokemon={mon} index={idx}
            onClick={() => handleSwitch(mon, idx)}
        />)}
    </div>;
}
