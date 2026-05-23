import { useClientContext } from '@/UI/components/single/useClientContext';
import { useRoomStore } from '@/client/client';
import type { BattleRoom } from '@/client/room/battleRoom';
import { cn } from '@/lib/utils';
import type { Protocol } from '@pkmn/protocol';
import { ChoiceBuilder } from '@pkmn/view';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@pkmn/img';
// Dex is provided via window.Dex after vendor modules are loaded by Battle.tsx

const TYPE_COLORS: Record<string, string> = {
    Normal: 'bg-stone-200 text-stone-900',
    Fighting: 'bg-orange-700 text-white',
    Flying: 'bg-indigo-300 text-gray-800',
    Poison: 'bg-purple-500 text-white',
    Ground: 'bg-amber-600 text-white',
    Rock: 'bg-yellow-700 text-white',
    Bug: 'bg-lime-600 text-white',
    Ghost: 'bg-purple-800 text-white',
    Steel: 'bg-slate-400 text-gray-800',
    Fire: 'bg-orange-500 text-white',
    Water: 'bg-blue-500 text-white',
    Grass: 'bg-green-500 text-white',
    Electric: 'bg-yellow-400 text-gray-800',
    Psychic: 'bg-pink-500 text-white',
    Ice: 'bg-cyan-300 text-gray-800',
    Dragon: 'bg-indigo-600 text-white',
    Dark: 'bg-gray-700 text-white',
    Fairy: 'bg-pink-300 text-gray-800',
    Stellar: 'bg-teal-400 text-gray-800',
    '???': 'bg-gray-400 text-gray-800',
};

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
    const Dex = window.Dex as any;
    const moveData = move.id && move.id !== 'recharge' && Dex ? Dex.moves.get(move.id) : null;
    const type = moveData?.type || '???';
    const typeColor = TYPE_COLORS[type] || TYPE_COLORS['???'];
    const category = moveData?.category || 'Status';
    const basePower = moveData?.basePower ?? '—';
    const accuracy = moveData?.accuracy === true ? '—' : (moveData?.accuracy ?? '—');
    const currentPP = 'pp' in move ? move.pp : undefined;
    const maxPP = 'maxpp' in move ? move.maxpp : undefined;
    const isDisabled = 'disabled' in move && move.disabled;

    return <motion.button
        type="button"
        className={cn(
            'relative p-1.5 rounded-md transition-colors text-left overflow-hidden flex flex-col justify-between',
            isDisabled ?
                'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700' :
                'hover:brightness-95 dark:hover:brightness-110 bg-gray-100 dark:bg-gray-800'
        )}
        style={{ borderLeft: `4px solid ${getTypeBorderColor(type)}` }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
            type: 'spring',
            stiffness: 400,
            damping: 20,
            delay: index * 0.05,
        }}
        whileHover={isDisabled ? undefined : { scale: 1.03 }}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        onClick={onClick}
        disabled={isDisabled}
    >
        <div className="flex items-center justify-between gap-1">
            <span className={cn('text-[10px] font-bold px-1 py-0.5 rounded uppercase leading-none', typeColor)}>
                {type}
            </span>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase leading-none">{category}</span>
        </div>
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight mt-0.5">
            {move.name}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-none">
            {currentPP !== undefined && maxPP !== undefined && (
                <span>PP {currentPP}/{maxPP}</span>
            )}
            <span>Pow {basePower}</span>
            <span>Acc {accuracy}{typeof accuracy === 'number' ? '%' : ''}</span>
        </div>
    </motion.button>;
}

function getTypeBorderColor(type: string): string {
    const colors: Record<string, string> = {
        Normal: '#9CA3AF',
        Fighting: '#C2410C',
        Flying: '#818CF8',
        Poison: '#A855F7',
        Ground: '#D97706',
        Rock: '#A16207',
        Bug: '#65A30D',
        Ghost: '#6B21A8',
        Steel: '#94A3B8',
        Fire: '#F97316',
        Water: '#3B82F6',
        Grass: '#22C55E',
        Electric: '#EAB308',
        Psychic: '#EC4899',
        Ice: '#67E8F9',
        Dragon: '#4F46E5',
        Dark: '#374151',
        Fairy: '#F9A8D4',
        Stellar: '#2DD4BF',
        '???': '#9CA3AF',
    };
    return colors[type] || colors['???'];
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
    const dexLoaded = useRoomStore(state => state.dexLoaded);
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

    if (!active[0]) {
        return null;
    }

    if (!dexLoaded) {
        return (
            <div className='flex flex-col items-center justify-center w-full h-full p-2'>
                <span className='text-gray-500 dark:text-gray-400 text-sm'>Loading move data…</span>
            </div>
        );
    }

    const sideIndex = battle.perspective === 'p1' ? 0 : 1;
    const pokemonName = 'sides' in battle.battle ? battle.battle.sides[sideIndex]?.active[0]?.name : undefined;

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
        <div className='flex flex-col'>
            <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 italic'>Attack</h3>
            <div className='grid grid-cols-2 grid-rows-2 gap-1.5'>
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
