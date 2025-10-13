import type { Settings } from './settings';
import { logger } from '../utils/logger';
import { toID } from '../utils/generic';

export interface AuthenticationCallbacks {
    sendMessage: (message: string) => void;
    setUsername: (username: string) => void;
    onLoginSuccess?: () => void;
    onLoginFailure?: (error: string) => void;
}

export class AuthenticationManager {
    private challstr: string = '';
    private client_id = import.meta.env.VITE_OAUTH_CLIENTID;
    private shouldAutoLogin: boolean = true; // Currently unused - kept for future auto-login features
    private loggedIn: boolean = false;
    private hasManuallyLoggedOut: boolean = false;

    constructor(
        private settings: Settings,
        private callbacks: AuthenticationCallbacks
    ) {}

    setChallstr(challstr: string): void {
        this.challstr = challstr;
    }

    setShouldAutoLogin(shouldAutoLogin: boolean): void {
        this.shouldAutoLogin = shouldAutoLogin;
    }

    get isLoggedIn(): boolean {
        return this.loggedIn;
    }

    async login(): Promise<void> {
        // Reset manual logout flag when user explicitly logs in
        this.hasManuallyLoggedOut = false;

        // Wait for challstr
        while (!this.challstr) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // OAuth login method
        const url = `https://play.pokemonshowdown.com/api/oauth/authorize?redirect_uri=${location.origin}&client_id=${this.client_id}&challenge=${this.challstr}`;
        const nWindow = (window as any).n = open(
            url,
            undefined,
            'popup=1,width=700,height=700',
        );

        const checkIfUpdated = async (): Promise<void> => {
            try {
                if (nWindow?.location.host === location.host) {
                    const url = new URL(nWindow.location.href);
                    const assertion = url.searchParams.get('assertion');
                    if (assertion) {
                        await this.sendAssertion(assertion);
                    }
                    const token = url.searchParams.get('token');
                    if (token) {
                        localStorage.setItem('ps-token', token);
                    }
                    nWindow.close();
                } else {
                    setTimeout(checkIfUpdated, 500);
                }
            } catch (error) {
                // DomException means that the window wasn't redirected yet
                if (error instanceof DOMException) {
                    setTimeout(checkIfUpdated, 500);
                    return;
                }
                throw error;
            }
        };
        setTimeout(checkIfUpdated, 1000);
    }

    async tryLogin(): Promise<void> {
        // Don't auto-login if user has manually logged out
        if (this.hasManuallyLoggedOut) {
            return;
        }

        while (!this.challstr) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const urlParams = new URLSearchParams(window.location.search);
        const assertion = urlParams.get('assertion');

        if (assertion && assertion !== 'undefined') {
            await this.sendAssertion(assertion);
            const token = urlParams.get('token');
            if (token) {
                localStorage.setItem('ps-token', token);
            }
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        // Try token login
        const token = localStorage.getItem('ps-token');
        if (token && token !== 'undefined') {
            const tokenAssertion = await this.assertionFromToken(this.challstr);
            if (tokenAssertion) {
                await this.sendAssertion(tokenAssertion);
                return;
            }
            // Token failed, remove it
            localStorage.removeItem('ps-token');
        }

        // Don't automatically open login popup - let user initiate login manually
        // This prevents jarring popups on app startup
    }

    private async sendAssertion(assertion: string): Promise<void> {
        const username = assertion.split(',')[1];
        const storedName = this.settings.username;

        // Use the stored name if it matches the assertion username, otherwise use assertion username
        const finalUsername = toID(storedName) === toID(username) ? storedName : username;

        const message = `/trn ${finalUsername},0,${assertion}`;

        try {
            this.callbacks.sendMessage(message);
            this.loggedIn = true;
            // Reset manual logout flag on successful login
            this.hasManuallyLoggedOut = false;
            this.callbacks.setUsername(finalUsername);
            this.callbacks.onLoginSuccess?.();
        } catch (error) {
            logger.error('Failed to send assertion', error);
            this.callbacks.onLoginFailure?.('Failed to send assertion');
        }
    }

    private async parseLoginserverResponse(response: Response): Promise<string | false> {
        // Loginserver responses are just weird
        const response_text = await response.text();
        if (response_text.startsWith(';')) {
            logger.error('AssertionError: Received ; from loginserver');
            return false;
        }
        try {
            const response_json = JSON.parse(response_text.slice(1));
            if (response_json.success === false) {
                logger.error('Couldn\'t login', response_json);
                return false;
            } else if (response_json.success) {
                return response_json.success;
            }
        } catch {
            // pass
        }
        return response_text;
    }

    private async assertionFromToken(challstr: string): Promise<string | false> {
        const token = localStorage.getItem('ps-token');
        if (!token || token === 'undefined') {
            return false;
        }
        try {
            const response = await fetch(
                `${this.settings.loginServerURL}oauth/api/getassertion?challenge=${challstr}&token=${token}&client_id=${this.client_id}`,
            );
            return await this.parseLoginserverResponse(response);
        } catch (error) {
            logger.error('Error getting assertion from token', error);
            return false;
        }
    }

    private async refreshToken(): Promise<boolean> {
        const token = localStorage.getItem('ps-token');
        if (!token || token === 'undefined') {
            return false;
        }
        try {
            const response = await fetch(
                `${this.settings.loginServerURL}oauth/api/refreshtoken?token=${token}&client_id=${this.client_id}`,
            );
            const result = await this.parseLoginserverResponse(response);
            if (result) {
                localStorage.setItem('ps-token', result);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Couldn\'t refresh token', error);
            return false;
        }
    }

    logout(): void {
        this.loggedIn = false;
        this.hasManuallyLoggedOut = true;
        this.settings.logout();
        localStorage.removeItem('ps-token');
    }
}
