import { userColor } from '../utils/namecolour';
import { MouseEventHandler, MutableRefObject, ReactNode } from 'react';
import { clamp, toID } from '../utils/generic';
import { FaCommentAlt, FaUserPlus } from 'react-icons/fa';
import { PiSwordBold } from 'react-icons/pi';

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
    { user, name, position, forwardRef }: {
        user: any;
        name: string;
        position: { x: number; y: number };
        forwardRef: MutableRefObject<any>;
    },
) { // user is a json
    return (
        <div
            ref={forwardRef}
            className="absolute bg-gray-600 rounded-lg p-5 w-[500px] h-[300px] text-white shadow-sm shadow-black"
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
                            {user ? user.status : ''}
                        </div>
                    </div>
                    <div id="usercard-action-buttons" className="py-4 flex flex-row ">
                        <UserCardButton
                            name="Chat"
                            alt="Chat with this user"
                            icon={<FaCommentAlt height={15} width={15} />}
                            onClick={() => {}}
                        />
                        <UserCardButton
                            name="Challenge"
                            alt="Challenge to a non-rated battle"
                            icon={<PiSwordBold height={15} width={15} />}
                            onClick={() => {}}
                        />
                        <UserCardButton
                            name="Friend"
                            alt="Add this user as a friend"
                            icon={<FaUserPlus height={15} width={15} />}
                            onClick={() => {}}
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
                <div id="usercard-rooms">
          Rooms:
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
}: {
    name: string;
    alt: string;
    icon: ReactNode;
    onClick: MouseEventHandler<HTMLButtonElement>;
}) {
    return (
        <button
            className="inline-block text-sm text-white hover:bg-gray-700 rounded-lg px-4 py-2 flex-grow-0 "
            onClick={onClick}
            title={alt}
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
