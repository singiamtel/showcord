import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/components/ui/use-toast';
import { createElement } from 'react';

export type RoomNotification = {
    mentions: number;
    unread: number;
};

export type clientNotification = {
    user: string;
    readonly message: string;
    readonly room: string;
    readonly roomType: string;
};

function limitString(str: string, limit: number) {
    if (str.length <= limit) return str;
    return `${str.slice(0, limit - 3)}...`;
}

const notificationSupported = typeof Notification !== 'undefined';

class NotificationsEngine {
    private permission: NotificationPermission = notificationSupported ? Notification.permission : 'denied';

    async askPermission() {
        if (!notificationSupported) return;
        if (this.permission === 'default') {
            this.permission = await Notification.requestPermission();
        }
    }

    sendNotification(
        notification: clientNotification,
        selectedRoom?: string,
        selectRoom?: (room: string) => void,
    ) {
        if (document.hasFocus()) {
            notification.user = notification.user.trim();
            if (selectedRoom !== notification.room) {
                const title = notification.roomType === 'pm' ?
                    `PM from ${notification.user}` :
                    `${notification.room} - ${notification.user}`;
                toast({
                    title,
                    description: limitString(notification.message, 150),
                    // action: <ToastAction altText="Try again">Try again</ToastAction>,
                    action: createElement(ToastAction, { altText: 'View', onClick: () => {
                        selectRoom?.(notification.room);
                    } }, 'View') as unknown as React.JSX.Element,
                });
            }
        } else {
            if (!notificationSupported || this.permission !== 'granted') return;
            const title = notification.roomType === 'pm' ?
                `PM from ${notification.user.trim()}` :
                `${notification.room} - ${notification.user}`;
            const body = notification.message;
            const icon = '';
            new Notification(title, {
                body,
                icon,
            });
        }
    }
}

export const notificationsEngine = new NotificationsEngine();
