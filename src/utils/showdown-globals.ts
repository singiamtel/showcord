import $ from 'jquery';

declare global {
    interface Window {
        $: JQueryStatic;
        jQuery: JQueryStatic;
        Config: any;
        BattleTeambuilderTable: any;
        BattlePokedex: any;
        BattleMovedex: any;
        BattleAbilities: any;
        BattleItems: any;
        BattleAliases: any;
        BattleStatuses: any;
        BattleTypeChart: any;
        BattlePokemonSprites: any;
        BattlePokemonSpritesBW: any;
        BattlePokemonIconIndexes: any;
        BattlePokemonIconIndexesLeft: any;
    }
}

window.$ = window.jQuery = $;

window.Config = {
    server: {
        id: 'showdown',
        protocol: 'https',
        host: 'sim.smogon.com',
        port: 443,
        prefix: 'showdown',
    },
    routes: {
        root: 'https://pokemonshowdown.com',
        client: 'play.pokemonshowdown.com',
        dex: 'https://dex.pokemonshowdown.com',
        replays: 'https://replay.pokemonshowdown.com',
        users: 'https://pokemonshowdown.com/users',
        teams: 'https://teams.pokemonshowdown.com',
    },
    customcolors: {},
    testclient: true,
};
