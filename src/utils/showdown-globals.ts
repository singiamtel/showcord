import $ from 'jquery';

declare global {
    interface Window {
        $: JQueryStatic;
        jQuery: JQueryStatic;
        Config: any;
        Dex: any;
        toID: any;
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

// These must be set BEFORE importing vendor modules, as they run IIFEs on load
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
    whitelist: [
        'pokemonshowdown.com',
        'psim.us',
        'smogon.com',
        'pkmn.cc',
    ],
    customcolors: {},
    testclient: true,
};

// Stub window.Dex with methods needed during vendor module initialization.
// This will be replaced with the real Dex object after vendor modules load.
const protocol = (window.document?.location?.protocol !== 'http:') ? 'https:' : '';
const clientHost = window.Config.routes.client;
window.Dex = {
    resourcePrefix: `${protocol}//${clientHost}/`,
    fxPrefix: `${protocol}//${clientHost}/fx/`,
    // sanitizeName is called by battle-dex-data.ts constructors
    sanitizeName(name: any) {
        if (!name) return '';
        return ('' + name)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .slice(0, 50);
    },
};
