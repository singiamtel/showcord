import { describe, it, expect } from 'vitest';
import { User, isStaff, rankOrder } from '@/client/user';

describe('User', () => {
    describe('User class', () => {
        it('should create user with name and ID', () => {
            const user = new User({ name: 'TestUser', ID: 'testuser' });
            expect(user.name).toBe('TestUser');
            expect(user.ID).toBe('testuser');
        });

        it('should create user with status', () => {
            const user = new User({ name: 'TestUser', ID: 'testuser', status: 'online' });
            expect(user.status).toBe('online');
        });

        it('should create user without status', () => {
            const user = new User({ name: 'TestUser', ID: 'testuser' });
            expect(user.status).toBeUndefined();
        });
    });

    describe('isStaff', () => {
        it('should return true for leader (&)', () => {
            expect(isStaff('&Leader')).toBe(true);
        });

        it('should return true for admin (#)', () => {
            expect(isStaff('#Admin')).toBe(true);
        });

        it('should return true for moderator (@)', () => {
            expect(isStaff('@Mod')).toBe(true);
        });

        it('should return true for driver (%)', () => {
            expect(isStaff('%Driver')).toBe(true);
        });

        it('should return false for voiced (+)', () => {
            expect(isStaff('+Voice')).toBe(false);
        });

        it('should return false for regular user ( )', () => {
            expect(isStaff(' User')).toBe(false);
        });

        it('should return false for locked user (‽)', () => {
            expect(isStaff('‽Locked')).toBe(false);
        });
    });

    describe('rankOrder', () => {
        it('should have correct rank hierarchy', () => {
            expect(rankOrder['&']).toBeGreaterThan(rankOrder['#']);
            expect(rankOrder['#']).toBeGreaterThan(rankOrder['@']);
            expect(rankOrder['@']).toBeGreaterThan(rankOrder['%']);
            expect(rankOrder['%']).toBeGreaterThan(rankOrder['*']);
            expect(rankOrder['*']).toBeGreaterThan(rankOrder['+']);
            expect(rankOrder['+']).toBeGreaterThan(rankOrder['^']);
            expect(rankOrder['^']).toBeGreaterThan(rankOrder[' ']);
            expect(rankOrder[' ']).toBeGreaterThan(rankOrder['‽']);
        });

        it('should have leader at highest rank', () => {
            const ranks = Object.values(rankOrder);
            expect(rankOrder['&']).toBe(Math.max(...ranks));
        });

        it('should have locked at lowest rank', () => {
            const ranks = Object.values(rankOrder);
            expect(rankOrder['‽']).toBe(Math.min(...ranks));
        });
    });
});
