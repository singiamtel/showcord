import { escape } from 'html-escaper';
import { toID } from '@/utils/generic';
import newMessage, { type Message } from '../message';

export interface RankCommandCallbacks {
    getSelectedRoom: () => string;
    getUsername: () => string;
    addMessageToRoom: (roomID: string, message: Message) => void;
    formatName: (formatID: string) => { name: string; gen: string } | undefined;
}

interface LadderRow {
    formatid: string;
    elo: number | string;
    gxe: number | string;
    rpr: number | string;
    rprd: number | string;
    w: number | string;
    l: number | string;
    t: number | string;
}

// Ranking data lives on the loginserver, not the sim server, and is only ever
// served from the official play.pokemonshowdown.com deployment.
const ACTION_PHP_URL = 'https://play.pokemonshowdown.com/~~showdown/action.php';
const RANK_ALIASES = new Set(['rank', 'ranking', 'rating', 'ladder']);

function log(room: string, content: string, callbacks: RankCommandCallbacks): void {
    callbacks.addMessageToRoom(room, newMessage({ user: '', name: '', type: 'log', content }));
}

function renderLadderTable(
    userLabel: string,
    rows: LadderRow[],
    formatFilter: Set<string>,
    callbacks: RankCommandCallbacks,
): string {
    if (!rows.length) {
        return `<div class="ladder"><table><tr><td colspan="6">User: <strong>${escape(userLabel)}</strong></td></tr>` +
            '<tr><td colspan="6"><em>This user has not played any ladder games yet.</em></td></tr></table></div>';
    }

    const shown = formatFilter.size ? rows.filter((row) => formatFilter.has(toID(row.formatid))) : rows;

    let buffer = `<div class="ladder"><table><tr><td colspan="6">User: <strong>${escape(userLabel)}</strong></td></tr>`;
    buffer += '<tr><th>Format</th><th>Elo</th><th>GXE</th><th>Glicko-1</th><th>W</th><th>L</th><th>Total</th></tr>';
    for (const row of shown) {
        const formatID = toID(row.formatid);
        const fmt = callbacks.formatName(formatID);
        const formatLabel = fmt ? `[Gen ${fmt.gen}] ${fmt.name}` : row.formatid;
        const elo = Math.round(Number(row.elo));
        const rprd = Number(row.rprd);
        const w = Number(row.w);
        const l = Number(row.l);
        const t = Number(row.t);

        buffer += `<tr><td>${escape(formatLabel)}</td><td><strong>${elo}</strong></td>`;
        if (rprd > 100) {
            buffer += `<td>&ndash;</td><td><em>${Math.round(Number(row.rpr))}` +
                `<small> &#177; ${Math.round(rprd)}</small></em> <small>(provisional)</small></td>`;
        } else {
            const gxe = Math.round(Number(row.gxe) * 10);
            buffer += `<td>${Math.floor(gxe / 10)}<small>.${gxe % 10}%</small></td>`;
            buffer += `<td><em>${Math.round(Number(row.rpr))}<small> &#177; ${Math.round(rprd)}</small></em></td>`;
        }
        buffer += `<td>${w}</td><td>${l}</td><td>${w + l + t}</td></tr>`;
    }
    buffer += '</table></div>';
    return buffer;
}

export function parseRankCommand(message: string, callbacks: RankCommandCallbacks): boolean {
    if (!message.startsWith('/')) {
        return false;
    }
    const splitted = message.split(' ');
    const cmd = splitted[0].slice(1);
    if (!RANK_ALIASES.has(cmd)) {
        return false;
    }

    const parts = splitted.slice(1).join(' ').split(',').map((p) => p.trim()).filter(Boolean);
    const userLabel = parts[0] || callbacks.getUsername();
    const userid = toID(userLabel);
    const formatFilter = new Set(parts.slice(1).map((f) => toID(f)));
    const room = callbacks.getSelectedRoom();

    if (!userid) {
        log(room, 'Usage: /rank [user], [format]. If no user is given, it defaults to you.', callbacks);
        return true;
    }

    void (async () => {
        try {
            const res = await fetch(`${ACTION_PHP_URL}?act=ladderget&user=${userid}`);
            const text = await res.text();
            const rows = JSON.parse(text.startsWith(']') ? text.slice(1) : text) as unknown;
            if (!Array.isArray(rows)) {
                throw new Error('corrupted ranking data');
            }
            callbacks.addMessageToRoom(room, newMessage({
                user: '',
                type: 'rawHTML',
                content: renderLadderTable(userLabel, rows as LadderRow[], formatFilter, callbacks),
            }));
        } catch {
            log(room, `Error fetching ranking data for '${userLabel}'.`, callbacks);
        }
    })();

    return true;
}
