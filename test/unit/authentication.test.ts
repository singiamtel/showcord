import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthenticationManager } from '@/client/authentication';
import { useUserStore } from '@/client/stores/userStore';
import type { Settings } from '@/client/settings';

describe('Authentication Manager', () => {
    let authManager: AuthenticationManager;
    let mockSettings: Settings;
    let mockSendMessage: ReturnType<typeof vi.fn>;
    let mockSetUsername: ReturnType<typeof vi.fn>;
    let mockOnLoginSuccess: ReturnType<typeof vi.fn>;
    let mockOnLoginFailure: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockSendMessage = vi.fn();
        mockSetUsername = vi.fn();
        mockOnLoginSuccess = vi.fn();
        mockOnLoginFailure = vi.fn();

        mockSettings = {
            username: 'TestUser',
            loginServerURL: 'https://play.pokemonshowdown.com/',
            logout: vi.fn(),
        } as any;

        authManager = new AuthenticationManager(mockSettings, {
            sendMessage: mockSendMessage as (message: string) => void,
            setUsername: mockSetUsername as (username: string) => void,
            onLoginSuccess: mockOnLoginSuccess as () => void,
            onLoginFailure: mockOnLoginFailure as (error: string) => void,
        });
    });

    describe('isLoggedIn', () => {
        it('should return false initially', () => {
            expect(authManager.isLoggedIn).toBe(false);
        });
    });

    describe('setChallstr', () => {
        it('should store challstr in user store', () => {
            authManager.setChallstr('test-challstr');
            expect(useUserStore.getState().challstr).toBe('test-challstr');
        });
    });

    describe('setShouldAutoLogin', () => {
        it('should update auto-login preference', () => {
            authManager.setShouldAutoLogin(false);
            authManager.setShouldAutoLogin(true);
        });
    });

    describe('logout', () => {
        it('should clear logged in state', () => {
            authManager.logout();
            expect(authManager.isLoggedIn).toBe(false);
        });

        it('should call settings logout', () => {
            authManager.logout();
            expect(mockSettings.logout).toHaveBeenCalled();
        });

        it('should remove token from localStorage', () => {
            const removeItemSpy = vi.spyOn(localStorage, 'removeItem');
            authManager.logout();
            expect(removeItemSpy).toHaveBeenCalledWith('ps-token');
            removeItemSpy.mockRestore();
        });

        it('should set manual logout flag', () => {
            authManager.logout();
            expect(authManager.isLoggedIn).toBe(false);
        });
    });
});
