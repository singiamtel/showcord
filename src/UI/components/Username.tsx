import { userColor } from '../../utils/namecolour';
import { MouseEventHandler } from 'react';

export function Username(
    { user, alignRight, onClick, colon, idle, bold, colorless }: {
        user: string;
        idle?: boolean;
        alignRight?: boolean;
        onClick?: MouseEventHandler<HTMLAnchorElement>;
        colon?: boolean;
        bold?: boolean;
        colorless?: boolean;
    }
) {
    const rank = user.charAt(0);
    const rankDisplay = alignRight ?
        rank.padEnd(1, ' ') :
        (rank === ' ' ? '' : rank);
    return (
        <>
            <span
                className={'text-[#9D9488] whitespace-pre ' +
                    (alignRight ? 'font-mono' : '')}
            >
                {rankDisplay}
            </span>
            <a
                onClick={onClick}
                style={{
                    color: colorless ? '' : idle ? '#888888' : userColor(user),
                }}
                className={'text-black dark:text-white ' + (onClick ? 'hover:underline hover:cursor-pointer ' : '') +
                    (bold ? 'font-bold ' : '')}
                data-message="true"
                data-username={user.slice(1)}
            >
                {user.slice(1)}
                {colon && ':'}
            </a>

        </>
    );
}
