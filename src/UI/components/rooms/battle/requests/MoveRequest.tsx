import { useClientContext } from '@/UI/components/single/ClientContext';
import type { BattleRoom } from '@/client/room/battleRoom';
import type { Protocol } from '@pkmn/protocol';
import { ChoiceBuilder } from '@pkmn/view';
import { type HTMLAttributes, useEffect, useState } from 'react';

function MoveButton(props: Readonly<HTMLAttributes<HTMLButtonElement> & { move: Protocol.Request.ActivePokemon['moves'][number]; }>) {
    return <button
        className='bg-blue-pastel hover:bg-blue-100 dark:bg-blue-dark hover:dark:bg-blue-darkest p-4 rounded-md'
        {...props}
    >{props.move.name}</button>;
}

export function MoveRequest({ req, battle }: Readonly<{ req: Protocol.MoveRequest; battle: BattleRoom }>) {
    const active = req.active;
    const { client } = useClientContext();
    const [builder, setBuilder] = useState(new ChoiceBuilder(req));
    const [selected, setSelected] = useState<string | null>(null);
    const [undo, setUndo] = useState(false);

    useEffect(() => {
        if (selected) {
            client.send(`/${builder.toString()}|${req.rqid}`, battle.ID);
            setUndo(true);
        } else if (undo) {
            client.send(`/undo`, battle.ID);
            builder.choices.length = 0;
            setUndo(false);
        }
    }, [selected]);

    useEffect(() => {
        setSelected(null);
        builder.choices.length = 0;
        setUndo(false);
    }, [active]);

    if (!active[0]) {
        return null;
    }

    return selected ? <div className='flex flex-col gap-4'>
        {battle.battle?.sides[0]?.active[0]?.name} will use {selected}
        <button
            className='bg-red-pastel hover:bg-red-100 dark:bg-red-dark hover:dark:bg-red-darkest p-4 rounded-md'
            onClick={() => setSelected(null)}>
            Cancel</button>
    </div> : <div
        className='grid grid-cols-2 grid-rows-2 w-full h-full place-items-center'
    >{active[0].moves.map((move, idx: number) => <MoveButton key={idx} move={move}
            onClick={() => {
                builder.addChoice(`move ${idx + 1}`);
                setSelected(move.name);
            }}
        />)}</div>;
}
