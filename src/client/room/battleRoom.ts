import { Battle } from '@pkmn/client';
import { LogFormatter } from '@pkmn/view';
import { Generations } from '@pkmn/data';
import { Dex, SideID } from '@pkmn/dex';
import { Protocol } from '@pkmn/protocol';

import { Room, RoomType } from './room';
import newMessage from '../message';


export class BattleRoom extends Room {
    battle: Battle;
    formatter: LogFormatter | null = null;
    perspective: SideID = 'p1';
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
    }

    setFormatter(perspective: SideID) {
        if (this.formatter) {
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

        this.battle.update();

        if (this.formatter) {
            const html = this.formatter.formatHTML(args, kwArgs);
            if (html) {
                this.addMessage(
                    newMessage({
                        type: 'rawHTML',
                        name: '',
                        content: html,
                        hld: false,
                    }),
                    { selected: true, selfSent: false },
                );
                return true;
            }
        }
        return false;
    }
}
