import { userColor } from '../utils/namecolour';
import { Fragment, MouseEventHandler, MutableRefObject, ReactNode } from 'react';
import { clamp, toID } from '../utils/generic';
import { FaCommentAlt, FaUserPlus } from 'react-icons/fa';
import { PiSwordBold } from 'react-icons/pi';
import manageURL from '../utils/manageURL';
import { rankOrder } from '../client/room';
import { client } from './PS_context';

export function UsernameComponent(
    { user, alignRight, onClick, colon, idle, bold, colorless }: {
        user: string;
        idle?: boolean;
        alignRight?: boolean;
        onClick?: MouseEventHandler<HTMLAnchorElement>;
        colon?: boolean;
        bold?: boolean;
        colorless?: boolean;
    },
) {
    const rank = user.charAt(0);
    const rankDisplay = alignRight ?
        rank.padEnd(1, ' ') :
        (rank === ' ' ? '' : rank);
    return (
        <>
            <span className={'text-[#9D9488] font-mono whitespace-pre '}>
                {rankDisplay}
            </span>
            <a onClick={onClick} style={onClick && { cursor: 'pointer' }}>
                <span
                    style={{
                        color: colorless ? 'white' : idle ? '#888888' : userColor(user),
                    }}
                    className={bold ? 'font-bold ' : ''}
                    data-message="true"
                >
                    {user.slice(1)}
                    {colon && ':'}
                </span>
            </a>
        </>
    );
}

const margin = 15;
export function UserCard(
    { user, name, position, forwardRef, close }: {
        user: any;
        name: string;
        position: { x: number; y: number };
        forwardRef: MutableRefObject<any>;
        close: () => void;
    },
) {
    const publicRooms = user ?
        Object.entries(user.rooms).filter((e: any) => !e[1].isPrivate) :
        [];
    const privateRooms = user ?
        Object.entries(user.rooms).filter((e: any) => e[1].isPrivate) :
        [];
    return (
        <div
            ref={forwardRef}
            className="absolute bg-gray-600 rounded-lg p-5 w-[400px] min-h-[150px] text-white shadow-sm shadow-black z-10"
            style={{
                left: clamp(position.x, margin, window.innerWidth - 500 - margin),
                top: clamp(position.y, margin, window.innerHeight - 300 - margin),
            }}
        >
            <div id="usercard-header" className="flex flex-row justify-between">
                <div id="usercard-user">
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
                        <div className="text-xs text-gray-100">
                            {parseStatus(user?.status)}
                        </div>
                    </div>
                    <div id="usercard-action-buttons" className="py-4 flex flex-row ">
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
                <div id="usercard-avatar" className="w-16 h-20 bg-blue-100">
                    <span className="text-white text-sm m-2 inline-block">
            Avatar will go here
                    </span>
                </div>
            </div>
            {
                <div id="usercard-rooms" className="text-sm">
          Chatrooms: {user ?
                        publicRooms.map((e, idx) =>
                            roomLink(e[0], idx === publicRooms.length - 1, close, idx)) :
                        ''}
                    <br />
                    {privateRooms.length > 0 ?
                        (
                            <>
                Private rooms: {user ?
                                    privateRooms.map((e, idx) =>
                                        roomLink(e[0], idx === privateRooms.length - 1, close, idx)) :
                                    ''}
                            </>
                        ) :
                        ''}
                </div>
            }
        </div>
    );
}

function UserCardButton({
    name,
    alt,
    icon,
    onClick,
    disabled = false,
}: {
    name: string;
    alt: string;
    icon: ReactNode;
    onClick: MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
}) {
    return (
        <button
            className={'inline-block text-sm rounded-lg px-4 py-2 flex-grow-0 text-white ' +
        (disabled ? 'opacity-50' : 'hover:bg-gray-700 ')}
            onClick={onClick}
            title={alt}
            disabled={disabled}
        >
            <span className="flex items-center justify-center">
                {icon}
            </span>
            <div className="">
                {name}
            </div>
        </button>
    );
}

function roomLink(room: string, last: boolean, close: () => void, key: number) {
    const hasRank =
    rankOrder[room.charAt(0) as keyof typeof rankOrder] !== undefined;
    if (toID(room).startsWith('battle')) {
        return;
    }
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
                        manageURL(e);
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

function removeFirstCharacterIfNotLetter(str: string) {
    if (str.length > 0 && !str.charAt(0).match(/[a-zA-Z]/)) {
        return str.slice(1);
    }
    return str;
}

function parseStatus(status: string | undefined): string {
    if (!status) return '';
    if (status.startsWith('!')) {
        return status.slice(1);
    }
    return status;
}
