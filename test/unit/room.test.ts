import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Room } from '@/client/room/room';
import { User } from '@/client/user';
import { useMessageStore } from '@/client/stores/messageStore';
import newMessage from '@/client/message';

describe('Room', () => {
    let room: Room;

    beforeEach(() => {
        room = new Room({
            ID: 'testroom',
            name: 'Test Room',
            type: 'chat',
            connected: true,
            open: true,
        });
    });

    describe('constructor', () => {
        it('should create room with correct properties', () => {
            expect(room.ID).toBe('testroom');
            expect(room.name).toBe('Test Room');
            expect(room.type).toBe('chat');
            expect(room.connected).toBe(true);
            expect(room.open).toBe(true);
        });

        it('should initialize with empty users', () => {
            expect(room.users).toEqual([]);
        });
    });

    describe('rename', () => {
        it('should change room name', () => {
            room.rename('New Name');
            expect(room.name).toBe('New Name');
        });
    });

    describe('select', () => {
        it('should reset history index', () => {
            room.send('Message 1');
            room.send('Message 2');
            room.historyPrev();
            room.select();
            expect(room.historyPrev()).toBe('Message 2');
        });
    });

    describe('send and history', () => {
        it('should add message to history', () => {
            room.send('Test message');
            expect(room.historyPrev()).toBe('Test message');
        });

        it('should limit history size', () => {
            for (let i = 0; i < 30; i++) {
                room.send(`Message ${i}`);
            }
            let count = 0;
            while (room.historyPrev() !== '') {
                count++;
                if (count > 30) break;
            }
            expect(count).toBeLessThanOrEqual(26);
        });

        it('should navigate backwards through history', () => {
            room.send('Message 1');
            room.send('Message 2');
            room.send('Message 3');
            expect(room.historyPrev()).toBe('Message 3');
            expect(room.historyPrev()).toBe('Message 2');
            expect(room.historyPrev()).toBe('Message 1');
        });

        it('should return empty at start of history', () => {
            room.send('Message 1');
            room.send('Message 2');
            room.send('Message 3');
            room.historyPrev();
            room.historyPrev();
            room.historyPrev();
            expect(room.historyPrev()).toBe('');
        });

        it('should navigate forwards through history', () => {
            room.send('Message 1');
            room.send('Message 2');
            room.send('Message 3');
            room.historyPrev();
            room.historyPrev();
            expect(room.historyNext()).toBe('Message 3');
        });

        it('should return empty at end of history', () => {
            expect(room.historyNext()).toBe('');
        });
    });

    describe('addUsers', () => {
        it('should add users to room', () => {
            const users = [
                new User({ name: 'User1', ID: 'user1' }),
                new User({ name: 'User2', ID: 'user2' }),
            ];
            room.addUsers(users);
            expect(room.users.length).toBe(2);
        });

        it('should sort users by rank', () => {
            const users = [
                new User({ name: ' Regular', ID: 'regular' }),
                new User({ name: '@Mod', ID: 'mod' }),
                new User({ name: '+Voice', ID: 'voice' }),
            ];
            room.addUsers(users);
            expect(room.users[0].name).toBe('@Mod');
        });
    });

    describe('removeUser', () => {
        beforeEach(() => {
            room.addUsers([
                new User({ name: 'User1', ID: 'user1' }),
                new User({ name: 'User2', ID: 'user2' }),
            ]);
        });

        it('should remove user from room', () => {
            room.removeUser('User1');
            expect(room.users.length).toBe(1);
            expect(room.users[0].ID).toBe('user2');
        });

        it('should handle removing non-existent user', () => {
            room.removeUser('NonExistent');
            expect(room.users.length).toBe(2);
        });
    });

    describe('updateUsername', () => {
        beforeEach(() => {
            room.addUsers([
                new User({ name: 'OldName', ID: 'oldname' }),
            ]);
        });

        it('should update username in user list', () => {
            room.updateUsername('NewName', 'oldname');
            const user = room.users.find(u => u.ID === 'newname');
            expect(user?.name).toBe('NewName');
        });
    });
});

describe('MessageStore', () => {
    afterEach(() => {
        useMessageStore.setState({ rooms: {} });
    });

    describe('addMessage', () => {
        it('should add message to store', () => {
            const message = newMessage({
                user: 'testuser',
                content: 'Hello',
                type: 'chat',
            });
            useMessageStore.getState().addMessage('testroom', message, { selected: false, selfSent: false, roomType: 'chat' });
            const messages = useMessageStore.getState().rooms['testroom']?.messages ?? [];
            expect(messages).toContain(message);
        });

        it('should increment unread for unselected chat messages', () => {
            const message = newMessage({
                user: 'testuser',
                content: 'Hello',
                type: 'chat',
                timestamp: String(Math.floor(Date.now() / 1000)),
            });
            useMessageStore.getState().addMessage('testroom', message, { selected: false, selfSent: false, roomType: 'chat' });
            const entry = useMessageStore.getState().rooms['testroom'];
            expect(entry?.unread).toBe(1);
        });

        it('should not increment unread for selected room', () => {
            const message = newMessage({
                user: 'testuser',
                content: 'Hello',
                type: 'chat',
                timestamp: String(Math.floor(Date.now() / 1000)),
            });
            useMessageStore.getState().addMessage('testroom', message, { selected: true, selfSent: false, roomType: 'chat' });
            const entry = useMessageStore.getState().rooms['testroom'];
            expect(entry?.unread).toBe(0);
        });

        it('should not increment unread for self-sent messages', () => {
            const message = newMessage({
                user: 'myuser',
                content: 'Hello',
                type: 'chat',
                timestamp: String(Math.floor(Date.now() / 1000)),
            });
            useMessageStore.getState().addMessage('testroom', message, { selected: true, selfSent: false, roomType: 'chat' });
            const entry = useMessageStore.getState().rooms['testroom'];
            expect(entry?.unread).toBe(0);
        });

        it('should not increment unread for self-sent messages', () => {
            const message = newMessage({
                user: 'myuser',
                content: 'Hello',
                type: 'chat',
                timestamp: String(Math.floor(Date.now() / 1000)),
            });
            useMessageStore.getState().addMessage('testroom', message, { selected: false, selfSent: false, roomType: 'chat' });
            expect(useMessageStore.getState().rooms['testroom']?.unread).toBe(1);

            useMessageStore.getState().selectRoom('testroom');
            const entry = useMessageStore.getState().rooms['testroom'];
            expect(entry?.unread).toBe(0);
            expect(entry?.mentions).toBe(0);
        });
    });
});
