import { assert, cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';
import { useClientContext } from '../../single/ClientContext';
import { BattleRoom } from '@/client/room/battleRoom';
import { Icons, Sprites } from '@pkmn/img';
import type { Pokemon as PokemonType } from '@pkmn/client';
import { Username } from '../../Username';

function Pokemon({ pokemon, sprite = false, side }: Readonly<{
    pokemon: PokemonType | null,
    sprite: true,
    side?: undefined
} | {
    pokemon: PokemonType | null,
    sprite: false,
    side: 'p1' | 'p2'
}>) {
    if (!pokemon) return null;
    if (sprite) {
        const data = Icons.getPokemon(pokemon.speciesForme, { protocol: 'https', domain: 'cdn.crob.at' });
        return (
            <span
                style={{
                    background:
                  `transparent url("${data.url}") no-repeat scroll ${data.left}px ${data.top}px`,
                    width: '40px',
                    height: '30px',
                    border: 0,
                    display: 'inline-block',
                    imageRendering: 'pixelated',
                    verticalAlign: '-7px',
                }}
            >
            </span>
        );
    }
    const data = Sprites.getPokemon(pokemon.speciesForme, { side }); // TODO: Mirror sprites and use cdn.crob.at too
    return <img src={data.url} width={data.w} height={data.h} data-name={pokemon.name} />;
}

export default function BattleWindow(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const { currentRoom: battle } = useClientContext() as {currentRoom: BattleRoom | undefined};
    assert(battle?.type === 'battle', 'Trying to render BattleWindow in a room that is not a BattleRoom');
    return <div className={cn(props.className, 'h-full w-full bg-gray-125 grid grid-cols-12')}>
        <div className='col-span-2 flex flex-col items-center' id="side-1">
            <div className='text-center w-full'>
                <Username bold user={' ' + battle.battle.p1.name} />
            </div>
            <img src={Sprites.getAvatar(battle.battle.p1.avatar)} />
            <div className='w-[120px] grid grid-cols-3'>
                {battle.battle.p1.team.map((pokemon, idx) => pokemon && <Pokemon key={idx} pokemon={pokemon} sprite />)}
            </div>
        </div>
        <div className='col-span-8 h-full bg-gray-100 flex justify-around items-center' id="battle">
            {battle.battle.p1.active.map((pokemon, idx) => pokemon && <Pokemon sprite={false} key={idx} pokemon={pokemon} side='p1' />)}
            {battle.battle.p2.active.map((pokemon, idx) => pokemon && <Pokemon sprite={false} key={idx} pokemon={pokemon} side='p2' />)}

        </div>
        <div className='col-span-2 flex flex-col items-center' id="side-2">
            <div className='text-center w-full'>
                <Username bold user={' ' + battle.battle.p2.name} />
            </div>
            <img src={Sprites.getAvatar(battle.battle.p2.avatar)} />
            <div className='w-[120px] grid grid-cols-3'>
                {battle.battle.p2.team.map((pokemon, idx) => pokemon && <Pokemon key={idx} pokemon={pokemon} sprite />)}
            </div>
        </div>
    </div>;
}

