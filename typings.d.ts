import { Client } from './src/client/client';

declare module 'namecolour';

// add "client" to the "window" object
declare global {
    interface Window {
        client: Client;
    }
}
