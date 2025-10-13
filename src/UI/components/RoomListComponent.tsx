import { useClientContext } from './single/ClientContext';
import HashtagIcon from '../assets/hashtag';
import Circle from './Circle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faHome, faUser } from '@fortawesome/free-solid-svg-icons';
import { notificationsEngine } from '../../client/notifications';
import { AiOutlineClose } from 'react-icons/ai';
import { GiBattleAxe } from 'react-icons/gi';
import { useRoomStore, useNotificationStore } from '@/client/client';

const customIcons = {
    'home': <FontAwesomeIcon icon={faHome} height={16} width={16} />,
    'settings': <FontAwesomeIcon icon={faCog} height={16} width={16} />,
};


export function RoomListComponent(
    { name, ID, type }: Readonly<{
        name: string;
        ID: string;
        type: string;
    }>,
) {
    const { setRoom } = useClientContext();
    const notifications = useNotificationStore(state => state.notifications);
    const currentNotifications = notifications[ID];
    const unread = currentNotifications?.unread ?? 0;
    const mentions = currentNotifications?.mentions ?? 0;
    const room = useRoomStore(state => state.currentRoom);
    const customIcon = customIcons[ID as keyof typeof customIcons];
    const icon = customIcon ?? (type === 'battle' ?
        <GiBattleAxe height={16} width={16} /> :
        type === 'pm' ?
            <FontAwesomeIcon icon={faUser} height={16} width={16} /> :
            <HashtagIcon height={16} width={16} />
    );

    return (
        <div
            className="relative flex w-full cursor-pointer"
        >
            <div
                className={'flex flex-row hover-color w-full overflow-clip ' + (
                    ID === room?.ID ?
                        ' bg-gray-451 dark:bg-gray-450 dark:hover:bg-gray-450 ' :
                        mentions > 0 || unread > 0 ?
                            ' ' :
                            ' text-gray-151 dark:text-gray-150 '
                )}
            >
                {/** Notification circle if it applies */}
                {(unread > 0) ?
                    (
                        <span className="rounded-full bg-gray-600 dark:bg-gray-600 text-xs p-1 h-1 w-1  absolute top-1/2  transform -translate-x-1/2 -translate-y-1/2" />
                    ) :
                    null}
                <button
                    type="button"
                    className={'rounded p-1 flex flex-row basis-full items-center truncate h-auto mr-2 ml-2 '}
                    onClick={() => {
                        notificationsEngine.askPermission();
                        setRoom(ID);
                    }}
                >
                    {icon}
                    <span className="text-left ml-2 max-w-full truncate">
                        <span className="truncate max-w-full">{name}</span>
                        {(unread > 0 && type !== 'pm') && (
                            <span className="ml-2 text-gray-500">[{unread}]</span>
                        )}
                    </span>
                    {mentions > 0 &&
            (
                <span className="text-white flex justify-center items-center ml-2 mr-1">
                    <Circle>{mentions}</Circle>
                </span>
            )}
                </button>
                {
                    /* Should display closing button?*/
                    (ID !== 'home') ?
                        <ClosingButton room={ID} current={ID === room?.ID} /> :
                        ''
                }
            </div>
        </div>
    );
}

function ClosingButton({ room, current }: Readonly<{ room: string, current: boolean }>) {
    const { client } = useClientContext();
    return (
        <button type="button" className="p-1" onClick={() => client.leaveRoom(room)}>
            <AiOutlineClose className='hover:text-red-600 hover:opacity-100' opacity={current ? 0.8 : 0.2} />
        </button>
    );
}
