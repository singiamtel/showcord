import { Settings } from './settings';
import { logger } from '../utils/logger';

export class AuthenticationManager {
    private challstr: string = '';
    private client_id = import.meta.env.VITE_OAUTH_CLIENTID;
    private shouldAutoLogin: boolean = true;
    private sendAssertionCallback?: (assertion: string) => void;

    constructor(private settings: Settings) {}

    setChallstr(challstr: string): void {
        this.challstr = challstr;
    }

    setShouldAutoLogin(shouldAutoLogin: boolean): void {
        this.shouldAutoLogin = shouldAutoLogin;
    }

    setSendAssertionCallback(callback: (assertion: string) => void): void {
        this.sendAssertionCallback = callback;
    }

    async login(): Promise<void> {
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
        while (!this.challstr) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const urlParams = new URLSearchParams(window.location.search);
        let assertion = urlParams.get('assertion');

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
            if (!(await this.refreshToken())) {
                logger.error('Couldn\'t refresh token');
                return;
            }
            const tokenAssertion = await this.assertionFromToken(this.challstr);
            if (tokenAssertion) {
                await this.sendAssertion(tokenAssertion);
                return;
            }
            // Token failed, remove it
            localStorage.removeItem('ps-token');
        }

        if (this.shouldAutoLogin) {
            await this.login();
        }
    }

    private async sendAssertion(assertion: string): Promise<void> {
        if (this.sendAssertionCallback) {
            this.sendAssertionCallback(assertion);
        } else {
            logger.debug('No send assertion callback set', { assertion });
        }
    }

    private async parseLoginserverResponse(response: Response): Promise<string | false> {
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
        } catch (error) {
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
        this.settings.logout();
    }
}
