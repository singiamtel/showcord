export const rankOrder = {
    '~': 9,
    '&': 9,
    '#': 8,
    '\u00a7': 7,
    '@': 6,
    '%': 5,
    '*': 4,
    '+': 3,
    '^': 2,
    ' ': 1,
    '‽': 0,
} as const;

export type RankSymbol = keyof typeof rankOrder;

export const rankNames: Record<RankSymbol, string> = {
    '~': 'Owner',
    '&': 'Leader',
    '#': 'Admin',
    '\u00a7': 'Section Leader',
    '@': 'Moderator',
    '%': 'Driver',
    '*': 'Bot',
    '+': 'Voice',
    '^': 'Prized',
    ' ': 'Regular',
    '‽': 'Locked',
} as const;

export function isStaff(username: string): boolean {
    const rank = username.charAt(0) as RankSymbol;
    return rankOrder[rank] >= rankOrder['%'];
}

export class User {
    name: string;
    ID: string;
    status?: string;
    gauth?: string;
    constructor(
        { name, ID, status }: { name: string; ID: string; status?: string },
    ) {
        this.name = name;
        this.ID = ID;
        this.status = status;
    }
}
