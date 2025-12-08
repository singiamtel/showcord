import { useClientContext } from '@/UI/components/single/useClientContext';
import type { BattleRoom } from '@/client/room/battleRoom';
import { cn } from '@/lib/utils';
import type { Protocol } from '@pkmn/protocol';
import { ChoiceBuilder } from '@pkmn/view';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@pkmn/img';

const STATUS_COLORS: Record<string, string> = {
    brn: 'bg-orange-500',
    par: 'bg-yellow-500',
    slp: 'bg-gray-500',
    frz: 'bg-cyan-400',
    psn: 'bg-purple-500',
    tox: 'bg-purple-700',
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

function HpBar({ hp, maxhp }: Readonly<{ hp: number; maxhp: number }>) {
    const percent = Math.round((hp / maxhp) * 100);
    const barColor = percent > 50 ? 'bg-green-500' : percent > 20 ? 'bg-yellow-500' : 'bg-red-500';

    return <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
            className={cn('h-full transition-all', barColor)}
            style={{ width: `${percent}%` }}
        />
    </div>;
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
    const colorClass = STATUS_COLORS[status] || 'bg-gray-500';
    return <span className={cn('text-[10px] font-bold text-white px-1 py-0.5 rounded uppercase', colorClass)}>
        {status}
    </span>;
}

function SwitchButton({ pokemon, index, onClick }: Readonly<{ pokemon: Protocol.Request.Pokemon; index: number; onClick: () => void; }>) {
    const isDisabled = pokemon.fainted || pokemon.active;
    return <motion.button
        type="button"
        className={cn(`p-2 rounded-md transition-colors text-gray-700 dark:text-white w-full flex items-center gap-2`,
            isDisabled ? 'opacity-50 bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-pastel hover:bg-blue-100 dark:bg-blue-dark hover:dark:bg-blue-darkest')}
        onClick={onClick}
        disabled={isDisabled}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: isDisabled ? 0.5 : 1, scale: 1, y: 0 }}
        transition={{
            type: 'spring',
            stiffness: 400,
            damping: 20,
            delay: index * 0.05,
        }}
        whileHover={isDisabled ? undefined : { scale: 1.05, y: -2 }}
        whileTap={isDisabled ? undefined : { scale: 0.95 }}
    >
        <PokemonIcon species={pokemon.speciesForme} fainted={pokemon.fainted} />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-1">
                <span className="truncate text-sm font-medium">{pokemon.name}</span>
                {pokemon.status && <StatusBadge status={pokemon.status} />}
            </div>
            {!pokemon.fainted && <HpBar hp={pokemon.hp} maxhp={pokemon.maxhp} />}
        </div>
    </motion.button>;
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
