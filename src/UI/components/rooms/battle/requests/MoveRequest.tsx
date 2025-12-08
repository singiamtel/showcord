import { useClientContext } from '@/UI/components/single/useClientContext';
import type { BattleRoom } from '@/client/room/battleRoom';
import { cn } from '@/lib/utils';
import type { Protocol } from '@pkmn/protocol';
import { ChoiceBuilder } from '@pkmn/view';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@pkmn/img';

function PokemonIcon({ species, fainted }: Readonly<{ species: string; fainted?: boolean }>) {
    const icon = Icons.getPokemon(species, { fainted });
    return <span
        style={{
            ...icon.css,
            display: 'inline-block',
            width: 40,
            height: 30,
            imageRendering: 'pixelated',
        }}
    />;
}

function MoveButton({ move, index, onClick }: Readonly<{ move: Protocol.Request.ActivePokemon['moves'][number]; index: number; onClick: () => void; }>) {
    return <motion.button
        type="button"
        className='bg-blue-pastel hover:bg-blue-100 dark:bg-blue-dark hover:dark:bg-blue-darkest p-2 rounded-md transition-colors text-gray-700 dark:text-white text-sm'
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


function SwitchButton({ pokemon, index, onClick, trapped }: Readonly<{ pokemon: Protocol.Request.Pokemon; index: number; onClick: () => void; trapped?: boolean }>) {
    const isDisabled = pokemon.fainted || pokemon.active || trapped;
    return <motion.button
        type="button"
        className={cn(`py-0.5 px-1 rounded transition-colors flex items-center gap-1`,
            isDisabled ?
                'opacity-40 bg-gray-100 dark:bg-gray-700 cursor-not-allowed' :
                'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-700 dark:text-white')}
        onClick={onClick}
        disabled={isDisabled}
        initial={{ opacity: 0, x: 5 }}
        animate={{ opacity: isDisabled ? 0.4 : 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
    >
        <PokemonIcon species={pokemon.speciesForme} fainted={pokemon.fainted} />
        <span className="truncate text-xs">{pokemon.name}</span>
    </motion.button>;
}

export function MoveRequest({ req, battle }: Readonly<{ req: Protocol.MoveRequest; battle: BattleRoom }>) {
    const active = req.active;
    const side = req.side;
    const { client } = useClientContext();
    const builder = useMemo(() => new ChoiceBuilder(req), [req]);
    const [selected, setSelected] = useState<string | null>(null);

    const isTrapped = active[0]?.trapped || active[0]?.maybeTrapped;

    const handleMoveSelect = (move: Protocol.Request.ActivePokemon['moves'][number], idx: number) => {
        builder.addChoice(`move ${idx + 1}`);
        setSelected(move.name);
        client.send(`/${builder.toString()}|${req.rqid}`, battle.ID);
    };

    const handleSwitch = (idx: number) => {
        builder.addChoice(`switch ${idx + 1}`);
        setSelected(`switch to ${side.pokemon[idx].name}`);
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

    if (selected) {
        return <div className='flex flex-col items-center justify-center gap-2 w-full h-full p-2'>
            <span className="text-gray-700 dark:text-white">{pokemonName} will {selected}</span>
            <motion.button
                type="button"
                className='bg-red-pastel hover:bg-red-400 dark:bg-red-dark hover:dark:bg-red-darkest px-6 py-2 rounded-md text-gray-700 dark:text-white'
                onClick={handleUndo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                Cancel
            </motion.button>
        </div>;
    }

    return <div className='flex flex-col gap-2 w-full h-full p-2'>
        {/* Moves section */}
        <div className='flex-1 flex flex-col'>
            <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 italic'>Attack</h3>
            <div className='grid grid-cols-2 grid-rows-2 gap-1.5 flex-1'>
                {active[0].moves.map((move, idx: number) => (
                    <MoveButton
                        key={move.id || `move-${idx}`}
                        move={move}
                        index={idx}
                        onClick={() => handleMoveSelect(move, idx)}
                    />
                ))}
            </div>
        </div>

        {/* Switch section */}
        <div>
            <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 italic'>
                Switch {isTrapped && <span className='text-red-500'>(trapped)</span>}
            </h3>
            <div className='grid grid-cols-3 gap-1'>
                {side.pokemon.map((mon, idx) => (
                    <SwitchButton
                        key={mon.ident}
                        pokemon={mon}
                        index={idx}
                        onClick={() => handleSwitch(idx)}
                        trapped={isTrapped}
                    />
                ))}
            </div>
        </div>
    </div>;
}
