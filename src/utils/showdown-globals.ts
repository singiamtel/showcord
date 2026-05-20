import $ from 'jquery';

interface ShowdownConfig {
    server: { id: string; protocol: string; host: string; port: number; prefix: string };
    routes: { root: string; client: string; dex: string; replays: string; users: string; teams: string };
    whitelist: string[];
    customcolors: Record<string, unknown>;
    testclient: boolean;
}

declare global {
    interface Window {
        $: JQueryStatic;
        jQuery: JQueryStatic;
        Config: ShowdownConfig;
        Dex: unknown;
        toID: (text: unknown) => string;
        BattleTeambuilderTable: Record<string, unknown>;
        BattlePokedex: Record<string, unknown>;
        BattleMovedex: Record<string, unknown>;
        BattleAbilities: Record<string, unknown>;
        BattleItems: Record<string, unknown>;
        BattleAliases: Record<string, string>;
        BattleStatuses: Record<string, unknown>;
        BattleTypeChart: Record<string, unknown>;
        BattlePokemonSprites: Record<string, unknown>;
        BattlePokemonSpritesBW: Record<string, unknown>;
        BattlePokemonIconIndexes: Record<string, unknown>;
        BattlePokemonIconIndexesLeft: Record<string, unknown>;
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
    sanitizeName(name: unknown) {
        if (!name) return '';
        return ('' + name)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .slice(0, 50);
    },
};
