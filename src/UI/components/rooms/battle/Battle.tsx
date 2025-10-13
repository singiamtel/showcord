import { assert, cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import type { BattleRoom } from '@/client/room/battleRoom';
import { Icons, Sprites } from '@pkmn/img';
import type { Pokemon as PokemonType, Side } from '@pkmn/client';
import { Username } from '../../Username';
import { useRoomStore } from '@/client/client';


function PokeballIcon() {
    const item = Icons.getPokeball('pokeball')!;
    return (
        <span
            style={{
                background:
                  `transparent url("${item.url}") no-repeat scroll ${item.left}px ${item.top}px`,
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

function PokemonIcon({ pokemon }: Readonly<{
    pokemon: PokemonType | null,
}>) {
    if (!pokemon) return null;
    const data = Icons.getPokemon(pokemon.speciesForme, { protocol: 'https', domain: 'cdn.crob.at' });
    return (
        <span
            title={pokemon.name}
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

function PokemonSprite({ pokemon, side }: Readonly<{
    pokemon: PokemonType | null,
    side: 'p1' | 'p2'
}>) {
    if (!pokemon) return null;
    const data = Sprites.getPokemon(pokemon.speciesForme, { side }); // TODO: Mirror sprites and use cdn.crob.at too
    return <img src={data.url} width={data.w} height={data.h} data-name={pokemon.name} alt={`${pokemon.name} sprite`} title={pokemon.name} />;
}

function RenderTeam({ player }: Readonly<{ player: Side }>) {
    console.log(player);
    return <div className='w-[120px] grid grid-cols-2 md:grid-cols-3 p-2'>
        {player.team.map((pokemon) => pokemon && <PokemonIcon key={pokemon.name} pokemon={pokemon} />)}
        {/* eslint-disable-next-line @eslint-react/no-array-index-key */}
        {player.team.length < player.totalPokemon && [...Array(player.totalPokemon - player.team.length)].map((_, idx) => <PokeballIcon key={`pokeball-${player.name}-${idx}`} />)}
        {/* {player.active.map((pokemon, idx) => pokemon && <PokemonSprite key={idx} pokemon={pokemon} />)} */}
    </div>;
}

export default function BattleWindow(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const battle = useRoomStore(state => state.currentRoom) as BattleRoom;
    assert(battle?.type === 'battle', 'Trying to render BattleWindow in a room that is not a BattleRoom');
    return <div className={cn(props.className, 'h-full w-full bg-gray-125 flex flex-row')}>
        <div className=' flex flex-col items-center' id="side-1">
            <div className='text-center w-full'>
                <Username bold user={' ' + battle.battle.p1.name} />
            </div>
            <img src={Sprites.getAvatar(battle.battle.p1.avatar)} alt={`${battle.battle.p1.name}'s avatar`}/>
            <div className='w-full'>
                <RenderTeam player={battle.battle.p1} />
            </div>
        </div>
        <div className='h-full w-full bg-gray-100 flex justify-around items-center' id="battle">
            {battle.battle.p1.active.map((pokemon) => pokemon && <PokemonSprite key={`p1-${pokemon.name}`} pokemon={pokemon} side='p1'/>)}
            {battle.battle.p2.active.map((pokemon) => pokemon && <PokemonSprite key={`p2-${pokemon.name}`} pokemon={pokemon} side='p2'/>)}
        </div>
        <div className='flex flex-col items-center' id="side-2">
            <div className='text-center w-full'>
                <Username bold user={' ' + battle.battle.p2.name} />
            </div>
            <img src={Sprites.getAvatar(battle.battle.p2.avatar)} />
            <div className='w-full'>
                <RenderTeam player={battle.battle.p2} />
            </div>
        </div>
    </div>;
}

