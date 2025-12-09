

// if (format.team) displayCode |= 1;
// if (format.searchShow) displayCode |= 2;
// if (format.challengeShow) displayCode |= 4;
// if (format.tournamentShow) displayCode |= 8;
// const ruleTable = Dex.formats.getRuleTable(format);
// const level = ruleTable.adjustLevel || ruleTable.adjustLevelDown || ruleTable.maxLevel;
// if (level === 50) displayCode |= 16;
//  // 32 was previously used for Multi Battles
// if (format.bestOfDefault) displayCode |= 64;

import { toID } from '@/utils/generic';

export type FormatSettings = {
    team: boolean;
    searchShow: boolean;
    challengeShow: boolean;
    tournamentShow: boolean;
    bestOfDefault: boolean;
}
export function parseFormatBitmask(bitmask: number): FormatSettings {
    const format = {
        team: false,
        searchShow: false,
        challengeShow: false,
        tournamentShow: false,
        bestOfDefault: false,
        maxLevel50: false,
    };
    if (bitmask & 1) format.team = true;
    if (bitmask & 2) format.searchShow = true;
    if (bitmask & 4) format.challengeShow = true;
    if (bitmask & 8) format.tournamentShow = true;
    if (bitmask & 16) format.maxLevel50 = true;
    if (bitmask & 64) format.bestOfDefault = true;
    return format;
}

// ,LL|,1|S/V Singles|[Gen 9] Random Battle,f|[Gen 9] Unrated Random Battle,b|[Gen 9] Free-For-All Random Battle,7|[Gen 9] Random Battle (Blitz),f|[Gen 9] Multi Random Battle,5|[Gen 9] OU,e|[Gen 9] Ubers,e|[Gen 9] UU,e|[Gen 9] RU,e|[Gen 9] NU,e|[Gen 9] PU,e|[Gen 9] LC,e|[Gen 9] Monotype,e|[Gen 9] CAP,e|[Gen 9] BSS Reg F,5e|[Gen 9] Custom Game,c|,1|S/V Doubles|[Gen 9] Random Doubles Battle,f|[Gen 9] Doubles OU,e|[Gen 9] Doubles Ubers,e|[Gen 9] Doubles UU,e|[Gen 9] Doubles LC,c|[Gen 9] VGC 2023 Reg D,5c|[Gen 9] VGC 2024 Reg F,5e|[Gen 9] VGC 2024 Reg F (Bo3),1a|[Gen 9] Doubles Custom Game,c|,1|Unofficial Metagames|[Gen 9] 1v1,e|[Gen 9] 2v2 Doubles,e|[Gen 9] Anything Goes,e|[Gen 9] Ubers UU,e|[Gen 9] ZU,e|[Gen 9] Free-For-All,6|[Gen 9] LC UU,c|[Gen 9] NFE,c|,1|Pet Mods|[Gen 9] VaporeMons,e|[Gen 1] Modern Gen 1,e|[Gen 6] NEXT OU,8|,1|Draft|[Gen 9] Draft,c|[Gen 9] Tera Preview Draft,c|[Gen 9] 6v6 Doubles Draft,c|[Gen 9] 4v4 Doubles Draft,5c|[Gen 9] NatDex Draft,c|[Gen 9] Tera Preview NatDex Draft,c|[Gen 9] NatDex 6v6 Doubles Draft,c|[Gen 9] NatDex LC Draft,c|[Gen 8] Galar Dex Draft,c|[Gen 8] NatDex Draft,c|[Gen 8] NatDex 4v4 Doubles Draft,1c|[Gen 7] Draft,c|[Gen 6] Draft,c|,2|OM of the Month|[Gen 9] Foresighters,e|[Gen 9] Balanced Hackmons UU,e|[Gen 9] Partners in Crime,e|,2|Other Metagames|[Gen 9] Almost Any Ability,e|[Gen 9] Balanced Hackmons,e|[Gen 9] Godly Gift,e|[Gen 9] Inheritance,e|[Gen 9] Mix and Mega,e|[Gen 9] Shared Power,e|[Gen 9] STABmons,e|[Gen 7] Pure Hackmons,e|,2|Challengeable OMs|[Gen 9] Camomons,c|[Gen 9] Convergence,c|[Gen 9] Cross Evolution,c|[Gen 9] Fortemons,c|[Gen 9] Frantic Fusions,c|[Gen 9] Full Potential,c|[Gen 9] Pokebilities,c|[Gen 9] Pure Hackmons,c|[Gen 9] Revelationmons,c|[Gen 9] Sharing is Caring,c|[Gen 9] Tera Donation,c|[Gen 9] The Card Game,c|[Gen 9] The Loser's Game,c|[Gen 9] Trademarked,c|[Gen 6] Pure Hackmons,c|,2|National Dex|[Gen 9] National Dex,e|[Gen 9] National Dex Ubers,e|[Gen 9] National Dex UU,e|[Gen 9] National Dex RU,c|[Gen 9] National Dex Monotype,e|[Gen 9] National Dex Doubles,e|[Gen 9] National Dex AAA,e|[Gen 9] National Dex AG,c|[Gen 9] National Dex BH,c|[Gen 8] National Dex,e|[Gen 8] National Dex UU,c|[Gen 8] National Dex Monotype,c|,2|S/V DLC 1|[Gen 9 DLC 1] OU,c|[Gen 9 DLC 1] Ubers,c|[Gen 9 DLC 1] UU,c|[Gen 9 DLC 1] RU,c|[Gen 9 DLC 1] NU,c|[Gen 9 DLC 1] PU,c|[Gen 9 DLC 1] LC,c|[Gen 9 DLC 1] Monotype,c|[Gen 9 DLC 1] Doubles OU,c|[Gen 9 DLC 1] Doubles UU,c|[Gen 9 DLC 1] Doubles LC,c|[Gen 9 DLC 1] 1v1,c|[Gen 9 DLC 1] Anything Goes,c|[Gen 9 DLC 1] ZU,c|[Gen 9 DLC 1] National Dex,c|[Gen 9 DLC 1] National Dex Monotype,c|[Gen 9 DLC 1] National Dex Doubles,c|[Gen 9 DLC 1] Draft,c|[Gen 9 DLC 1] Tera Preview Draft,c|,3|Randomized Format Spotlight|[Gen 9] Doubles Broken Cup,f|[Gen 9] Random Roulette,d|,3|Randomized Metas|[Gen 9] Monotype Random Battle,f|[Gen 9] Random Battle Mayhem,f|[Gen 9] Computer-Generated Teams,f|[Gen 9] Hackmons Cup,f|[Gen 9] Doubles Hackmons Cup,d|[Gen 9] Broken Cup,d|[Gen 9] Challenge Cup 1v1,f|[Gen 9] Challenge Cup 2v2,f|[Gen 9] Challenge Cup 6v6,d|[Gen 9] Metronome Battle,e|[Gen 8] Random Battle,f|[Gen 8] Random Doubles Battle,f|[Gen 8] Free-For-All Random Battle,7|[Gen 8] Multi Random Battle,5|[Gen 8] Battle Factory,f|[Gen 8] BSS Factory,1d|[Gen 8] Super Staff Bros 4,f|[Gen 8] Hackmons Cup,f|[Gen 8] Metronome Battle,c|[Gen 8] CAP 1v1,d|[Gen 8 BDSP] Random Battle,d|[Gen 7] Random Battle,f|[Gen 7] Random Doubles Battle,9|[Gen 7] Battle Factory,f|[Gen 7] BSS Factory,1d|[Gen 7] Hackmons Cup,d|[Gen 7 Let's Go] Random Battle,d|[Gen 6] Random Battle,f|[Gen 6] Battle Factory,9|[Gen 5] Random Battle,f|[Gen 4] Random Battle,f|[Gen 3] Random Battle,f|[Gen 2] Random Battle,f|[Gen 1] Random Battle,f|[Gen 1] Challenge Cup,9|[Gen 1] Hackmons Cup,9|,4|RoA Spotlight|[Gen 4] UU,e|[Gen 5] RU,e|[Gen 5] Doubles OU,e|,4|Past Gens OU|[Gen 8] OU,e|[Gen 7] OU,e|[Gen 6] OU,e|[Gen 5] OU,e|[Gen 4] OU,e|[Gen 3] OU,e|[Gen 2] OU,e|[Gen 1] OU,e|,4|Past Gens Doubles OU|[Gen 8] Doubles OU,e|[Gen 7] Doubles OU,e|[Gen 6] Doubles OU,e|[Gen 4] Doubles OU,c|[Gen 3] Doubles OU,c|,4|Sw/Sh Singles|[Gen 8] Ubers,c|[Gen 8] UU,c|[Gen 8] RU,c|[Gen 8] NU,c|[Gen 8] PU,c|[Gen 8] LC,c|[Gen 8] Monotype,c|[Gen 8] 1v1,c|[Gen 8] Anything Goes,c|[Gen 8] ZU,c|[Gen 8] CAP,c|[Gen 8] Battle Stadium Singles,5c|[Gen 8 BDSP] OU,c|[Gen 8] Custom Game,c|,4|Sw/Sh Doubles|[Gen 8] Doubles Ubers,c|[Gen 8] Doubles UU,c|[Gen 8] VGC 2022,5c|[Gen 8] VGC 2021,5c|[Gen 8] VGC 2020,5c|[Gen 8 BDSP] Doubles OU,c|[Gen 8 BDSP] Battle Festival Doubles,1c|[Gen 8] Doubles Custom Game,c|,4|US/UM Singles|[Gen 7] Ubers,c|[Gen 7] UU,c|[Gen 7] RU,c|[Gen 7] NU,c|[Gen 7] PU,c|[Gen 7] LC,c|[Gen 7] Monotype,c|[Gen 7] 1v1,c|[Gen 7] Anything Goes,c|[Gen 7] ZU,c|[Gen 7] CAP,c|[Gen 7] Battle Spot Singles,5c|[Gen 7 Let's Go] OU,1c|[Gen 7] Custom Game,c|,4|US/UM Doubles|[Gen 7] Doubles UU,c|[Gen 7] VGC 2019,5c|[Gen 7] VGC 2018,5c|[Gen 7] VGC 2017,5c|[Gen 7] Battle Spot Doubles,5c|[Gen 7 Let's Go] Doubles OU,c|[Gen 7] Doubles Custom Game,c|,4|OR/AS Singles|[Gen 6] UU,c|[Gen 6] Ubers,c|[Gen 6] RU,c|[Gen 6] NU,c|[Gen 6] PU,c|[Gen 6] LC,c|[Gen 6] Monotype,c|[Gen 6] 1v1,c|[Gen 6] Anything Goes,c|[Gen 6] ZU,c|[Gen 6] CAP,c|[Gen 6] Battle Spot Singles,5c|[Gen 6] Custom Game,c|,4|OR/AS Doubles/Triples|[Gen 6] VGC 2016,5c|[Gen 6] VGC 2015,5c|[Gen 6] VGC 2014,5c|[Gen 6] Battle Spot Doubles,5c|[Gen 6] Doubles Custom Game,c|[Gen 6] Battle Spot Triples,1c|[Gen 6] Triples Custom Game,c|,4|B2/W2 Singles|[Gen 5] Ubers,c|[Gen 5] UU,c|[Gen 5] NU,c|[Gen 5] PU,c|[Gen 5] LC,c|[Gen 5] Monotype,c|[Gen 5] 1v1,c|[Gen 5] ZU,c|[Gen 5] CAP,c|[Gen 5] GBU Singles,5c|[Gen 5] Custom Game,c|,4|B2/W2 Doubles|[Gen 5] VGC 2013,5c|[Gen 5] VGC 2012,5c|[Gen 5] VGC 2011,5c|[Gen 5] Doubles Custom Game,c|[Gen 5] Triples Custom Game,c|,4|DPP Singles|[Gen 4] Ubers,c|[Gen 4] NU,c|[Gen 4] PU,c|[Gen 4] LC,c|[Gen 4] Anything Goes,c|[Gen 4] 1v1,c|[Gen 4] ZU,c|[Gen 4] CAP,c|[Gen 4] Custom Game,c|,4|DPP Doubles|[Gen 4] VGC 2010,1c|[Gen 4] VGC 2009,1c|[Gen 4] Doubles Custom Game,c|,4|Past Generations|[Gen 3] Ubers,c|[Gen 3] UU,c|[Gen 3] NU,c|[Gen 3] PU,c|[Gen 3] ZU,c|[Gen 3] LC,c|[Gen 3] 1v1,c|[Gen 3] Custom Game,c|[Gen 3] Doubles Custom Game,c|[Gen 2] Ubers,c|[Gen 2] UU,c|[Gen 2] NU,c|[Gen 2] PU,c|[Gen 2] 1v1,c|[Gen 2] NC 2000,c|[Gen 2] Stadium OU,c|[Gen 2] Custom Game,c|[Gen 1] Ubers,c|[Gen 1] UU,c|[Gen 1] NU,c|[Gen 1] PU,c|[Gen 1] 1v1,c|[Gen 1] Japanese OU,c|[Gen 1] Stadium OU,c|[Gen 1] Tradebacks OU,c|[Gen 1] NC 1997,c|[Gen 1] Custom Game,c

export type Formats = {
    categories: {
        name: string;
        column: number;
        formats: {
            gen: string;
            name: string;
            ID: string;
            settings: FormatSettings;
        }[];
    }[];
};

export default function formatParser(formats: string[]) {
    const result: Formats = {
        categories: [],
    };
    let nextIsCategory = false;
    const currentCategory = {
        name: '',
        column: 1,
    };
    for (const format of formats) {
        if (nextIsCategory) {
            currentCategory.name = format;
            result.categories.push({
                name: currentCategory.name,
                column: currentCategory.column,
                formats: [],
            });
            nextIsCategory = false;
        } else if (format.startsWith(',LL')) {
            // TODO: wtf is ,LL?
            continue;
        } else if (format.startsWith(',')) {
            // new category
            nextIsCategory = true;
            currentCategory.column = Number(format.split(',')[1]);
            continue;
        } else if (format.startsWith('[')) {
            // new format
            const [_gen, _name] = format.split(']');
            const gen = _gen.slice(1).split(' ')[1];
            const [name, bitmask] = _name.split(',');
            const formatSettings = parseFormatBitmask(parseInt(bitmask, 16));
            result.categories[result.categories.length - 1].formats.push({
                gen,
                name: name.trim(),
                ID: toID(`gen${gen}${name}`),
                settings: formatSettings,
            });
        } else {
            throw new Error(`Unknown format: ${format}`);
        }
    }
    return result;
}

