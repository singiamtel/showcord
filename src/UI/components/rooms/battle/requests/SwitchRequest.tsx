import { useClientContext } from '@/UI/components/single/ClientContext';
import { BattleRoom } from '@/client/room/battleRoom';
import { cn } from '@/lib/utils';
import { Protocol } from '@pkmn/protocol';
import { ChoiceBuilder } from '@pkmn/view';
import { HTMLAttributes, useEffect, useState } from 'react';

function SwitchButton(props: Readonly<HTMLAttributes<HTMLButtonElement> & { pokemon: Protocol.Request.Pokemon; }>) {
    return <button
        className={cn(` p-4 rounded-md`,
            props.pokemon.fainted ? 'opacity-50 bg-gray-100 dark:bg-gray-dark' : 'bg-blue-pastel hover:bg-blue-100 dark:bg-blue-dark hover:dark:bg-blue-darkest')}
        {...props}
    >{props.pokemon.name}</button>;
}
export function SwitchRequest({ req, battle }: Readonly<{ req: Protocol.SwitchRequest; battle: BattleRoom }>) {
    const side = req.side;

    const { client } = useClientContext();
    const [builder] = useState(new ChoiceBuilder(req));
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        if (selected) {
            // req.send();
            console.log('builder.toString()', builder.toString());
            client.send(`/${builder.toString()}|${req.rqid}`, battle.ID);
        }
    }, [selected]);

    return <div
        className='grid grid-cols-3 grid-rows-2 w-full h-full place-items-center'
    >
        {side.pokemon.map((mon, idx) => <SwitchButton key={mon.name} pokemon={mon}

            onClick={() => {
                builder.addChoice(`switch ${idx + 1}`);
                console.log('builder.choices', builder.choices);
                setSelected(mon.name);
            }}
        />)}
    </div>;
}
