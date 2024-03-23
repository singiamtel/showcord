import { Client } from '@/client/client';
import { MouseEvent } from 'react';

export default function manageURL(event:MouseEvent<HTMLAnchorElement>, client: Client) {
    // if host is current, handle redirect in client instead of opening new tab
    if (location.host === (event.target as HTMLAnchorElement).host) {
        if (!client) {
            console.error('Client not defined on manageURL');
            return;
        }
        client.join((event.target as HTMLAnchorElement).pathname.slice(1));
        event.preventDefault();
        return;
    }
}
