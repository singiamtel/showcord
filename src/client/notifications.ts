import { toast } from '@/components/ui/use-toast';

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

class NotificationsEngine {
    private permission = Notification.permission;

    askPermission() {
        if (this.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                this.permission = permission;
            });
        }
    }

    sendNotification(
        notification: clientNotification,
        selectedRoom?: string,
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
                });
            }
        } else {
            if (this.permission !== 'granted') return;
            const title = notification.roomType === 'pm' ?
                `PM from ${notification.user}` :
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
