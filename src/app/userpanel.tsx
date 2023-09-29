import IconProfile from '../assets/profile';
import { useContext } from 'react';
import { PS_context } from './PS_context';
import { userColor } from '../utils/namecolour';

export default function UserPanel() {
    const { client, user } = useContext(PS_context);

    return (
        <div className="h-20 text-white p-3 flex items-center">
            <span
                className={'rounded text-lg flex flex-row items-center h-auto ' +
          (user ? 'bg-gray-600 w-auto p-2 ' : 'bg-gray-600 w-full font-bold ')}
            >
                {user ?
                    (
                        <>
                            <IconProfile className="mr-2 m-auto" />
                            <span
                                style={{ color: userColor(user) }}
                                className="font-bold"
                            >
                                {user}
                            </span>
                        </>
                    ) :
                    (
                        <>
                            <button
                                onClick={() => client?.login()}
                                className="font-bold rounded px-2 py-1 w-full"
                            >
                Login
                            </button>
                        </>
                    )}
            </span>
        </div>
    );
}
