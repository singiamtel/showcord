import { notificationsEngine } from '../../../client/notifications';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { UserDetails } from '../UserDetails';
import { client, useUserStore, useAppStore } from '@/client/client';

function LoginButton() {
    return (
        <button
            type="button"
            onClick={() => {
                client.login();
                notificationsEngine.askPermission();
            }}
            className="font-bold rounded px-2 py-1 w-full"
        >
        Login
        </button>
    );
}

function Disconnected() {
    return (
        <span className="rounded px-2 py-1 w-full text-red-400 font-bold">
            Couldn't connect
        </span>
    );
}
function RenderUserContent() {
    const isConnected = useAppStore(state => state.isConnected);
    const user = useUserStore(state => state.user);
    const avatar = useUserStore(state => state.avatar);

    if (!isConnected) {
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
                <div className="flex flex-row justify-between items-center w-full">
                    <RenderUserContent/>
                    <button type="button" className="flex flex-row justify-center items-center cursor-pointer hover-color" onClick={() => client.openSettings()}>
                        <FontAwesomeIcon icon={faCog} />
                    </button>
                </div>
            </span>
        </div>
    );
}
