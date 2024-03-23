import { Battle } from '@pkmn/client';
import { LogFormatter } from '@pkmn/view';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Protocol } from '@pkmn/protocol';

import { Room, RoomType } from './room';
import newMessage from '../message';
import { assert } from '@/lib/utils';


export class BattleRoom extends Room {
    battle: Battle | null = null;
    formatter: LogFormatter | null = null;
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
        this.formatter = new LogFormatter('p1', this.battle); // TODO: dont use p1
    }

    /**
     * Returns whether a new message was added to the battle.
     */
    feedBattle(line: string): boolean {
        assert(this.battle);
        const { args, kwArgs } = Protocol.parseBattleLine(line);

        const html = this.formatter!.formatHTML(args, kwArgs); // fix type...
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

        if (html) {
            this.addMessage(
                newMessage({
                    type: 'rawHTML',
                    name: '',
                    content: html,
                    notify: false,
                    hld: false,
                }),
                { selected: true, selfSent: false },
            );
            return true;
        }
        return false;
    }
}
