import { Client } from './src/client/client';

declare module 'namecolour';

// add "client" to the "window" object
declare global {
    interface Window {
        client: Client;
        toggleDarkMode: () => void;
    }
}

// PS Client globals
type AnyObject = { [k: string]: any };
declare const BattleText: { [id: string]: { [templateName: string]: string } };
declare const BattleFormats: { [id: string]: any };
declare const BattlePokedex: { [id: string]: AnyObject };
declare const BattleMovedex: { [id: string]: AnyObject };
declare const BattleAbilities: { [id: string]: AnyObject };
declare const BattleItems: { [id: string]: AnyObject };
declare const BattleAliases: { [id: string]: string };
declare const BattleStatuses: { [id: string]: AnyObject };
declare const BattlePokemonSprites: { [id: string]: AnyObject };
declare const BattlePokemonSpritesBW: { [id: string]: AnyObject };
declare const NonBattleGames: { [id: string]: string };

