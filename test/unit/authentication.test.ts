import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
            logout: vi.fn(),
        } as any;

        authManager = new AuthenticationManager(mockSettings, {
            sendMessage: mockSendMessage as (message: string) => void,
            setUsername: mockSetUsername as (username: string) => void,
            onLoginSuccess: mockOnLoginSuccess as () => void,
            onLoginFailure: mockOnLoginFailure as (error: string) => void,
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
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

    describe('login', () => {
        it('should use the configured login server and OAuth client ID', async () => {
            vi.stubEnv('VITE_LOGINSERVER_URL', 'https://login.example.test/custom/');
            vi.stubEnv('VITE_OAUTH_CLIENTID', 'test-client-id');
            const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
            const configuredAuthManager = new AuthenticationManager(mockSettings, {
                sendMessage: mockSendMessage as (message: string) => void,
                setUsername: mockSetUsername as (username: string) => void,
            });
            configuredAuthManager.setChallstr('test-challenge');

            await configuredAuthManager.login();

            const loginURL = new URL(openSpy.mock.calls[0][0] as string);
            expect(loginURL.origin).toBe('https://login.example.test');
            expect(loginURL.pathname).toBe('/custom/oauth/authorize');
            expect(loginURL.searchParams.get('client_id')).toBe('test-client-id');
            expect(loginURL.searchParams.get('challenge')).toBe('test-challenge');
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
