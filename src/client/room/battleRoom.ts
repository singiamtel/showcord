import { Battle } from '@pkmn/client';
import { LogFormatter } from '@pkmn/view';
import { Generations } from '@pkmn/data';
import { Dex, type SideID } from '@pkmn/dex';
import { Protocol } from '@pkmn/protocol';

import { Room, type RoomType } from './room';
import newMessage from '../message';
import { useMessageStore } from '../stores/messageStore';


export class BattleRoom extends Room {
    battle: Battle;
    log: string[] = [];
    onLogUpdate: ((line: string) => void) | null = null;
    formatter: LogFormatter | null = null;
    perspective: SideID = 'p1';
    isPlayer = false;
    battleEnded = false;
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

    /**
     * Returns whether a new message was added to the battle.
     */
    feedBattle(line: string): boolean {
        this.log.push(line);
        if (this.onLogUpdate) this.onLogUpdate(line);

        const { args, kwArgs } = Protocol.parseBattleLine(line);

        try {
            // pre handler
            //   add(pre, key, args, kwArgs);
            this.battle.add(args, kwArgs);
            // post handler
            //   add(post, key, args, kwArgs);
        } catch (e) {
            console.error('this.battle.add error', line, e);
        }

        if (this.battle.request) {
            this.battle.update(this.battle.request);
        }

        if (this.formatter) {
            const html = this.formatter.formatHTML(args, kwArgs);
            if (html) {
                const message = newMessage({
                    type: 'rawHTML',
                    name: '',
                    content: html,
                    hld: false,
                });
                this.addMessage(
                    message,
                    { selected: true, selfSent: false },
                );
                useMessageStore.getState().newMessage(this.ID, message);
                return true;
            }
        }
        return false;
    }
}
