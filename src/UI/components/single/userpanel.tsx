import { useContext } from 'react';
import { PS_context } from './PS_context';
import { userColor } from '../../../utils/namecolour';
import { notificationsEngine } from '../../../client/notifications';
import { Sprites } from '@pkmn/img';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

export default function UserPanel() {
    const { client, user, avatar } = useContext(PS_context);

    return (
        <div className="h-26 p-3 flex items-center bg-gray-251 dark:bg-gray-600">
            <span
                className={'rounded text-lg flex flex-row items-center h-auto w-full ' +
          (user ? ' w-auto p-2 ' : 'w-full font-bold ')}
            >
                <div className="flex flex-row justify-between items-center w-full">
                    {user ?

                        (
                            <div className="flex flex-row ">
                                <div className="w-12 h-12 rounded-full overflow-hidden mr-2 bg-gray-251 dark:bg-gray-250 border-2 border-gray-700">
                                    <img
                                        src={avatar ?
                                            Sprites.getAvatar(avatar) :
                                            Sprites.getAvatar(167)}
                                        className="w-10 h-10 m-auto scale-[1.2]"
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span
                                        style={{ color: userColor(user) }}
                                        className="font-bold"
                                    >
                                        {user}
                                    </span>
                                </div>
                            </div>

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
