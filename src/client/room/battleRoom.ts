import type { Battle } from '@pkmn/client';
import type { LogFormatter } from '@pkmn/view';
import type { SideID } from '@pkmn/dex';
import type { Message } from '../message';
import { Room, type RoomType } from './room';
import type { RealBattleRoom } from './RealBattleRoom';

export interface BattleRoomStub {
    request: unknown;
    getPokemon: (name: string) => unknown;
    add: (...args: unknown[]) => void;
    update: (request: unknown) => void;
}

// Defines a proxy that loads the heavy BattleRoom implementation lazily.
export class BattleRoom extends Room {
    // Stub properties to match RealBattleRoom interface
    battle: BattleRoomStub | Battle;
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

    private realRoom: RealBattleRoom | null = null;
    private queue: Array<() => void> = [];

    constructor(
        args: {
            ID: string;
            name: string;
            type: RoomType;
            connected: boolean;
            open: boolean;
        },
    ) {
        super(args);

        // Stub battle object to prevent crashes on 'battle.request' access before load
        this.battle = {
            request: null,
            getPokemon: () => null,
            add: () => {},
            update: () => {},
        };

        // Load the real room dynamically
        (async () => {
            try {
                const { RealBattleRoom } = await import('./RealBattleRoom');

                // Create the heavy instance
                this.realRoom = new RealBattleRoom(args);

                // Sync mutable properties that might have changed before load
                this.realRoom.perspective = this.perspective;
                this.realRoom.isPlayer = this.isPlayer;
                this.realRoom.battleEnded = this.battleEnded;

                // Replace stubs with real objects
                this.battle = this.realRoom.battle;
                this.formatter = this.realRoom.formatter;

                // Sync pending callbacks to the real room
                this.realRoom.onTimerUpdate = this.onTimerUpdate;

                // Replay any queued actions
                this.queue.forEach(fn => fn());
                this.queue = [];
            } catch (err) {
                console.error('Failed to load RealBattleRoom', err);
            }
        })();
    }

    setFormatter(perspective: SideID) {
        this.perspective = perspective;
        if (this.realRoom) {
            this.realRoom.setFormatter(perspective);
        } else {
            this.queue.push(() => {
                if (this.realRoom) this.realRoom.setFormatter(perspective);
            });
        }
    }

    get currentPokemon() {
        if (this.realRoom) return this.realRoom.currentPokemon;
        return null;
    }

    /**
     * Returns whether a new message was added to the battle.
     */
    feedBattle(line: string): Message | null {
        this.log.push(line);
        if (this.onLogUpdate) this.onLogUpdate(line);

        if (this.realRoom) {
            this.realRoom.onTimerUpdate = this.onTimerUpdate;
            const result = this.realRoom.feedBattle(line);
            this.timerActive = this.realRoom.timerActive;
            this.timerStartValue = this.realRoom.timerStartValue;
            this.timerTotal = this.realRoom.timerTotal;
            this.timerStartedAt = this.realRoom.timerStartedAt;
            return result;
        } else {
            this.queue.push(() => {
                if (this.realRoom) this.realRoom.feedBattle(line);
            });
            return null;
        }
    }
}
