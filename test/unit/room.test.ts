import { describe, it, expect, beforeEach } from 'vitest';
import { Room } from '@/client/room/room';
import { User } from '@/client/user';
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

        it('should initialize with empty messages and users', () => {
            expect(room.messages).toEqual([]);
            expect(room.users).toEqual([]);
        });

        it('should initialize unread count to 0', () => {
            expect(room.unread).toBe(0);
            expect(room.mentions).toBe(0);
        });
    });

    describe('rename', () => {
        it('should change room name', () => {
            room.rename('New Name');
            expect(room.name).toBe('New Name');
        });
    });

    describe('select', () => {
        it('should reset unread counts', () => {
            room.unread = 5;
            room.mentions = 2;
            room.select();
            expect(room.unread).toBe(0);
            expect(room.mentions).toBe(0);
        });

        it('should update last read time', () => {
            const before = room.lastReadTime;
            setTimeout(() => {
                room.select();
                expect(room.lastReadTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
            }, 10);
        });
    });

    describe('addMessage', () => {
        it('should add message to room', () => {
            const message = newMessage({
                user: 'testuser',
                content: 'Hello',
                type: 'chat',
            });
            room.addMessage(message, { selected: false, selfSent: false });
            expect(room.messages).toContain(message);
        });

        it('should increment unread for unselected chat messages', () => {
            const message = newMessage({
                user: 'testuser',
                content: 'Hello',
                type: 'chat',
                timestamp: new Date().getTime().toString(),
            });
            room.addMessage(message, { selected: false, selfSent: false });
            expect(room.unread).toBe(1);
        });

        it('should not increment unread for selected room', () => {
            const message = newMessage({
                user: 'testuser',
                content: 'Hello',
                type: 'chat',
                timestamp: new Date().getTime().toString(),
            });
            room.addMessage(message, { selected: true, selfSent: false });
            expect(room.unread).toBe(0);
        });

        it('should not increment unread for self-sent messages', () => {
            const message = newMessage({
                user: 'myuser',
                content: 'Hello',
                type: 'chat',
                timestamp: new Date().getTime().toString(),
            });
            room.addMessage(message, { selected: false, selfSent: true });
            expect(room.unread).toBe(0);
        });

        it('should limit message count', () => {
            for (let i = 0; i < 250; i++) {
                const message = newMessage({
                    user: 'testuser',
                    content: `Message ${i}`,
                    type: 'chat',
                });
                room.addMessage(message, { selected: true, selfSent: false });
            }
            expect(room.messages.length).toBeLessThanOrEqual(201);
        });
    });

    describe('send', () => {
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
    });

    describe('historyPrev and historyNext', () => {
        beforeEach(() => {
            room.send('Message 1');
            room.send('Message 2');
            room.send('Message 3');
        });

        it('should navigate backwards through history', () => {
            expect(room.historyPrev()).toBe('Message 3');
            expect(room.historyPrev()).toBe('Message 2');
            expect(room.historyPrev()).toBe('Message 1');
        });

        it('should return empty at start of history', () => {
            room.historyPrev();
            room.historyPrev();
            room.historyPrev();
            expect(room.historyPrev()).toBe('');
        });

        it('should navigate forwards through history', () => {
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

    describe('addUHTML', () => {
        it('should add UHTML message', () => {
            const message = newMessage({
                name: 'box1',
                user: '',
                content: '<div>Test</div>',
                type: 'boxedHTML',
            });
            room.addUHTML(message, { selected: true, selfSent: false });
            expect(room.messages).toContain(message);
        });

        it('should replace existing UHTML with same name', () => {
            const message1 = newMessage({
                name: 'box1',
                user: '',
                content: '<div>Original</div>',
                type: 'boxedHTML',
            });
            const message2 = newMessage({
                name: 'box1',
                user: '',
                content: '<div>Updated</div>',
                type: 'boxedHTML',
            });
            room.addUHTML(message1, { selected: true, selfSent: false });
            room.addUHTML(message2, { selected: true, selfSent: false });
            
            const boxes = room.messages.filter(m => m.name === 'box1');
            expect(boxes.length).toBe(1);
            expect(boxes[0].content).toBe('<div>Updated</div>');
        });
    });

    describe('changeUHTML', () => {
        beforeEach(() => {
            const message = newMessage({
                name: 'box1',
                user: '',
                content: '<div>Original</div>',
                type: 'boxedHTML',
            });
            room.addUHTML(message, { selected: true, selfSent: false });
        });

        it('should change existing UHTML content', () => {
            const updatedMessage = newMessage({
                name: 'box1',
                user: '',
                content: '<div>Updated</div>',
                type: 'boxedHTML',
            });
            room.changeUHTML(updatedMessage);
            
            const box = room.messages.find(m => m.name === 'box1');
            expect(box?.content).toBe('<div>Updated</div>');
        });

        it('should return false for non-existent UHTML', () => {
            const message = newMessage({
                name: 'nonexistent',
                user: '',
                content: '<div>Test</div>',
                type: 'boxedHTML',
            });
            const result = room.changeUHTML(message);
            expect(result).toBe(false);
        });
    });

    describe('endChallenge', () => {
        it('should cancel active challenge message', () => {
            const challengeMessage = newMessage({
                user: 'challenger',
                content: 'gen9ou',
                type: 'challenge',
            });
            room.addMessage(challengeMessage, { selected: true, selfSent: false });
            
            room.endChallenge();
            expect(challengeMessage.cancelled).toBe(true);
        });
    });
});
