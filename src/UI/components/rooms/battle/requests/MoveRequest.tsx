import { useClientContext } from '@/UI/components/single/useClientContext';
import type { BattleRoom } from '@/client/room/battleRoom';
import type { Protocol } from '@pkmn/protocol';
import { ChoiceBuilder } from '@pkmn/view';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

function MoveButton({ move, index, onClick }: Readonly<{ move: Protocol.Request.ActivePokemon['moves'][number]; index: number; onClick: () => void; }>) {
    return <motion.button
        type="button"
        className='bg-blue-pastel hover:bg-blue-100 dark:bg-blue-dark hover:dark:bg-blue-darkest p-4 rounded-md transition-colors'
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
            type: 'spring',
            stiffness: 400,
            damping: 20,
            delay: index * 0.05,
        }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
    >{move.name}</motion.button>;
}

export function MoveRequest({ req, battle }: Readonly<{ req: Protocol.MoveRequest; battle: BattleRoom }>) {
    const active = req.active;
    const { client } = useClientContext();
    const builder = useMemo(() => new ChoiceBuilder(req), [req]);
    const [selected, setSelected] = useState<string | null>(null);

    const handleMoveSelect = (move: Protocol.Request.ActivePokemon['moves'][number], idx: number) => {
        builder.addChoice(`move ${idx + 1}`);
        setSelected(move.name);
        client.send(`/${builder.toString()}|${req.rqid}`, battle.ID);
    };

    const handleUndo = () => {
        client.send(`/undo`, battle.ID);
        builder.choices.length = 0;
        setSelected(null);
    };

    useEffect(() => {
        builder.choices.length = 0;
        setSelected(null);
    }, [active, builder]);

    if (!active[0]) {
        return null;
    }

    const sideIndex = battle.perspective === 'p1' ? 0 : 1;
    const pokemonName = battle.battle?.sides[sideIndex]?.active[0]?.name;

    return <div className='grid grid-cols-2 grid-rows-2 gap-2 w-full h-full place-items-center p-2'>
        {selected ? (
            <div className='col-span-2 row-span-2 flex flex-col items-center justify-center gap-2'>
                <span>{pokemonName} will use {selected}</span>
                <motion.button
                    type="button"
                    className='bg-red-pastel hover:bg-red-100 dark:bg-red-dark hover:dark:bg-red-darkest px-6 py-2 rounded-md'
                    onClick={handleUndo}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Cancel
                </motion.button>
            </div>
        ) : (
            active[0].moves.map((move, idx: number) => (
                <MoveButton
                    key={move.id || `move-${idx}`}
                    move={move}
                    index={idx}
                    onClick={() => handleMoveSelect(move, idx)}
                />
            ))
        )}
    </div>;
}
