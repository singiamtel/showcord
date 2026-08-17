import { notificationsEngine } from '../../../client/notifications';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { UserDetails } from '../UserDetails';
import { client } from '@/client/singleton';
import { useUserStore, useAppStore } from '@/client/client';
import { Button } from '@/components/ui/button';

function LoginButton() {
    return (
        <Button
            type="button"
            onClick={() => {
                client.login();
                notificationsEngine.askPermission();
            }}
            className="min-w-0 flex-1 font-bold"
        >
            Login
        </Button>
    );
}

function Disconnected() {
    return (
        <span className="rounded px-2 py-1 w-full text-red-400 font-bold">
            Couldn't connect
        </span>
    );
}

function Reconnecting() {
    return (
        <span className="rounded px-2 py-1 w-full text-yellow-400 font-bold">
            Reconnecting...
        </span>
    );
}

function RenderUserContent() {
    const isConnected = useAppStore(state => state.isConnected);
    const isReconnecting = useAppStore(state => state.isReconnecting);
    const user = useUserStore(state => state.user);
    const avatar = useUserStore(state => state.avatar);

    if (isReconnecting) {
        return <Reconnecting />;
    } else if (!isConnected) {
        return <Disconnected />;
    } else if (user) {
        return <UserDetails border user={user} avatar={avatar} />;
    } else {
        return <LoginButton />;
    }
}

export default function UserPanel() {
    const user = useUserStore(state => state.user);
    return (
        <div className="h-26 p-3 flex items-center bg-gray-251 dark:bg-gray-600">
            <span
                className={'rounded text-lg flex flex-row items-center h-auto w-full ' +
                    (user ? ' w-auto p-2 ' : 'w-full')}
            >
                <div className="flex flex-row items-center gap-3 w-full">
                    <RenderUserContent/>
                    <button type="button" className="shrink-0 flex flex-row justify-center items-center cursor-pointer hover-color" onClick={() => client.openSettings()}>
                        <FontAwesomeIcon icon={faCog} />
                    </button>
                </div>
            </span>
        </div>
    );
}
