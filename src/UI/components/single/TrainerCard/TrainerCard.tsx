import { Sprites } from '@pkmn/img';
import {
    Fragment,
    type MouseEventHandler,
    type MutableRefObject,
    type ReactNode,
    useEffect,
} from 'react';
import { motion } from 'framer-motion';
import {
    clamp,
    removeFirstCharacterIfNotLetter,
    toID,
} from '../../../../utils/generic';
import { FaCommentAlt, FaUserPlus } from 'react-icons/fa';
import { PiSwordBold } from 'react-icons/pi';
import manageURL from '../../../../utils/manageURL';
import { rankOrder } from '../../../../client/user';
import { useClientContext } from '../useClientContext';

const margin = 15;

export default function TrainerCard(
    { user, name, position, forwardRef, close }: Readonly<{
        user: any;
        name: string | null;
        position: { x: number; y: number };
        forwardRef: MutableRefObject<any>;
        close: () => void;
    }>,
) {
    const { client } = useClientContext();
    const publicRooms = user ?
        Object.entries(user.rooms).filter((e: any) => !e[1].isPrivate) :
        [];
    const privateRooms = user ?
        Object.entries(user.rooms).filter((e: any) => e[1].isPrivate) :
        [];

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                close();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    if (!name) return null;

    return (
        <motion.div
            ref={forwardRef}
            className="fixed bg-gray-601 dark:bg-gray-600 rounded-lg p-5 w-[400px] min-h-[150px] shadow-sm shadow-black z-20"
            style={{
                left: clamp(position.x, margin, window.innerWidth - 500 - margin),
                top: clamp(position.y, margin, window.innerHeight - 300 - margin),
            }}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
            }}
        >
            <div id="usercard-header" className="flex flex-row justify-between">
                <div id="usercard-user" className="w-full">
                    <div id="usercard-user-name">
                        <strong>
                            <a
                                target="_blank"
                                className="hover:underline"
                                href={'https://pokemonshowdown.com/users/' + toID(name)}
                            >
                                {name}
                            </a>
                        </strong>
                        <div className="text-xs dark:text-gray-100">
                            {parseStatus(user?.status)}
                        </div>
                    </div>
                    <div
                        id="usercard-action-buttons"
                        className="p-4 flex flex-row w-full justify-between"
                    >
                        <UserCardButton
                            name="Chat"
                            alt="Chat with this user"
                            icon={<FaCommentAlt height={15} width={15} />}
                            onClick={() => {
                                client.createPM(name);
                                close();
                            }}
                        />
                        <UserCardButton
                            name="Challenge"
                            alt="Challenge to a non-rated battle"
                            icon={<PiSwordBold height={15} width={15} />}
                            onClick={() => {}}
                            disabled
                        />
                        <UserCardButton
                            name="Friend"
                            alt="Add this user as a friend"
                            icon={<FaUserPlus height={15} width={15} />}
                            onClick={() => {}}
                            disabled
                        />
                    </div>
                </div>
                <div id="usercard-avatar" className="w-20 h-20">
                    {user ?
                        (
                            <img
                                src={user.avatar ?
                                    Sprites.getAvatar(user.avatar) :
                                    Sprites.getAvatar(167)}
                                alt="avatar"
                                className="w-20 h-20"
                            />
                        ) :
                        ''}
                </div>
            </div>
            {
                <div id="usercard-rooms" className="text-sm">
          Chatrooms: {user ?
                        publicRooms.map((e, idx) =>
                            roomLink(e[0], idx === publicRooms.length - 1, close, client, idx)) :
                        ''}
                    <br />
                    {privateRooms.length > 0 ?
                        (
                            <>
                Private rooms: {user ?
                                    privateRooms.map((e, idx) =>
                                        roomLink(e[0], idx === privateRooms.length - 1, close, client, idx)) :
                                    ''}
                            </>
                        ) :
                        ''}
                </div>
            }
        </motion.div>
    );
}

function UserCardButton({
    name,
    alt,
    icon,
    onClick,
    disabled = false,
}: Readonly<{
    name: string;
    alt: string;
    icon: ReactNode;
    onClick: MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
}>) {
    return (
        <motion.button
            type="button"
            className={'text-sm rounded-lg px-4 py-2 flex-grow-0 border border-gray-700 flex flex-col justify-center items-center transition-colors ' +
        (disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-351 hover:dark:bg-gray-700 ')}
            onClick={onClick}
            title={alt}
            disabled={disabled}
            whileHover={disabled ? undefined : { scale: 1.05 }}
            whileTap={disabled ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
            <motion.span
                className="flex items-center justify-center"
                whileHover={disabled ? undefined : { rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.3 }}
            >
                {icon}
            </motion.span>
            <div className="">
                {name}
            </div>
        </motion.button>
    );
}

function roomLink(room: string, last: boolean, close: () => void, client: any, key: number) {
    const hasRank = rankOrder[room.charAt(0) as keyof typeof rankOrder] !== undefined;
    return (
        <Fragment key={key}>
            <span id="rank" className="text-[#9D9488] font-mono whitespace-pre">
                {hasRank ? room.charAt(0) : ''}
            </span>
            <span className="text-blue-300">
                <a
                    href={'/' + (removeFirstCharacterIfNotLetter(room))}
                    target="_blank"
                    onClick={(e) => {
                        manageURL(e, client);
                        close();
                    }}
                    className="hover:underline"
                >
                    {hasRank ? room.slice(1) : room}
                </a>
            </span>
            {last ? '' : ', '}
        </Fragment>
    );
}

function parseStatus(status: string | undefined): string {
    if (!status) return '';
    if (status.startsWith('!')) {
        return status.slice(1);
    }
    return status;
}
