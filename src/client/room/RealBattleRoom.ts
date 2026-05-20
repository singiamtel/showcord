import { Battle } from '@pkmn/client';
import { LogFormatter } from '@pkmn/view';
import { Generations } from '@pkmn/data';
import { Dex, type SideID } from '@pkmn/dex';
import { Protocol } from '@pkmn/protocol';

import { logger } from '../../utils/logger';
import { Room, type RoomType } from './room';
import newMessage, { type Message } from '../message';
import { toast } from '@/components/ui/use-toast';


export class RealBattleRoom extends Room {
    battle: Battle;
    log: string[] = [];
    onLogUpdate: ((line: string) => void) | null = null;
    formatter: LogFormatter | null = null;
    perspective: SideID = 'p1';
    isPlayer = false;
    battleEnded = false;

    timerActive = false;
    timerStartValue = 0;
    timerTotal = 300;
    timerStartedAt = 0;
    onTimerUpdate: ((data: { startValue: number; total: number; active: boolean }) => void) | null = null;
    constructor(
        { ID, name, type, connected, open }: {
            ID: string;
            name: string;
            type: RoomType;
            connected: boolean;
            open: boolean;
        },
    ) {
        super({ ID, name, type, connected, open });

        this.battle = new Battle(new Generations(Dex));
        this.formatter = new LogFormatter(this.perspective, this.battle);
    }

    setFormatter(perspective: SideID) {
        if (this.perspective === perspective && this.formatter) {
            return;
        }
        this.perspective = perspective;
        this.formatter = new LogFormatter(perspective, this.battle);
    }

    get currentPokemon() {
        return this.battle.getPokemon(this.perspective);
    }

    private parseTimer(line: string) {
        if (line.startsWith('|inactive|')) {
            const data = line.slice('|inactive|'.length);
            if (data.startsWith('Time left: ')) {
                const parts = data.split(' | ');
                const timeMatch = parts[0].match(/\d+/);
                const totalMatch = parts[1]?.match(/\d+/);
                const time = timeMatch ? parseInt(timeMatch[0], 10) : 0;
                const totalTime = totalMatch ? parseInt(totalMatch[0], 10) : 600;
                this.timerStartValue = time || 0;
                this.timerTotal = totalTime || 300;
                this.timerActive = true;
                this.timerStartedAt = Date.now();
                this.onTimerUpdate?.({
                    startValue: this.timerStartValue,
                    total: this.timerTotal,
                    active: true,
                });
            } else if (data.includes(' has ') && data.includes(' seconds left')) {
                const match = data.match(/(\d+)\s*seconds\s*left/);
                if (match) {
                    const time = parseInt(match[1], 10);
                    this.timerStartValue = time || 0;
                    this.timerActive = true;
                    this.timerStartedAt = Date.now();
                    this.onTimerUpdate?.({
                        startValue: this.timerStartValue,
                        total: this.timerTotal,
                        active: true,
                    });
                }
            }
        } else if (line.startsWith('|inactiveoff')) {
            this.timerActive = false;
            this.timerStartValue = 0;
            this.onTimerUpdate?.({ startValue: 0, total: 0, active: false });
            const reason = line.slice('|inactiveoff'.length);
            if (reason.startsWith('|')) {
                const msg = reason.slice(1);
                if (msg && msg !== 'Battle timer is now OFF.') {
                    toast({ title: 'Timer', description: msg });
                }
            }
        }
    }

    feedBattle(line: string): Message | null {
        this.log.push(line);
        this.parseTimer(line);
        if (this.onLogUpdate) this.onLogUpdate(line);

        const { args, kwArgs } = Protocol.parseBattleLine(line);

        try {
            this.battle.add(args, kwArgs);
        } catch (e) {
            logger.error('this.battle.add error', line, e);
        }

        if (this.battle.request) {
            this.battle.update(this.battle.request);
        }

        if (this.formatter) {
            const html = this.formatter.formatHTML(args, kwArgs);
            if (html) {
                return newMessage({
                    type: 'rawHTML',
                    name: '',
                    content: html,
                    hld: false,
                });
            }
        }
        return null;
    }
}
