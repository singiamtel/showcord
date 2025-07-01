import { Settings } from './settings';
import { logger } from '../utils/logger';

export class AuthenticationManager {
    private challstr: string = '';
    private client_id = import.meta.env.VITE_OAUTH_CLIENTID;
    private shouldAutoLogin: boolean = true;

    constructor(private settings: Settings) {}

    setChallstr(challstr: string): void {
        this.challstr = challstr;
    }

    setShouldAutoLogin(shouldAutoLogin: boolean): void {
        this.shouldAutoLogin = shouldAutoLogin;
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
        if (token) {
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
    // This would need to be implemented by calling back to the client
    // For now, just log it
        logger.debug('Sending assertion', { assertion });
    }

    private async parseLoginserverResponse(response: Response): Promise<string | false> {
        const response_text = await response.text();
        const response_json = JSON.parse(response_text.substr(1));
        if (response_json.actionsuccess) {
            return response_json.assertion;
        }
        if (response_json.assertion && response_json.assertion.substr(0, 2) === ';;') {
            logger.error('AssertionError: Received ; from loginserver');
            return false;
        }

        logger.error('Couldn\'t login', response_json);
        return false;
    }

    private async assertionFromToken(challstr: string): Promise<string | false> {
        try {
            const response = await fetch(this.settings.loginServerURL, {
                method: 'POST',
                body: `act=getassertion&userid=${this.settings.username}&challstr=${challstr}&token=${localStorage.getItem('ps-token')}`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            return await this.parseLoginserverResponse(response);
        } catch (error) {
            logger.error('Error getting assertion from token', error);
            return false;
        }
    }

    private async refreshToken(): Promise<void> {
        try {
            const response = await fetch(this.settings.loginServerURL, {
                method: 'POST',
                body: `act=upkeep&challstr=${this.challstr}&token=${localStorage.getItem('ps-token')}`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            const data = await response.text();
            const json = JSON.parse(data.substr(1));
            if (json.actionsuccess && json.token) {
                localStorage.setItem('ps-token', json.token);
            }
        } catch (error) {
            logger.error('Couldn\'t refresh token', error);
        }
    }

    logout(): void {
        this.settings.logout();
    }
}
