import { notificationsEngine } from '../../../client/notifications';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { UserDetails } from '../UserDetails';
import { useClientContext } from './ClientContext';

export default function UserPanel() {
    const { client, user, avatar } = useClientContext();

    return (
        <div className="h-26 p-3 flex items-center bg-gray-251 dark:bg-gray-600">
            <span
                className={'rounded text-lg flex flex-row items-center h-auto w-full ' +
                    (user ? ' w-auto p-2 ' : 'w-full font-bold ')}
            >
                <div className="flex flex-row justify-between items-center w-full">
                    {user ?

                        (
                            < UserDetails
                                border
                                user={user}
                                avatar={avatar}
                            />
                        ) :
                        (
                            <>
                                <button
                                    onClick={() => {
                                        client.login();
                                        notificationsEngine.askPermission();
                                    }}
                                    className="font-bold rounded px-2 py-1 w-full"
                                >
                                    Login
                                </button>
                            </>
                        )
                    }
                    <div className="flex flex-row justify-center items-center cursor-pointer hover-color" onClick={() => client.openSettings()}>
                        <FontAwesomeIcon icon={faCog} />
                    </div>
                </div>
            </span>
        </div>
    );
}
