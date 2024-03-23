import { userColor } from '../../utils/namecolour';
import { useTrainerCard } from './single/TrainerCard/TrainerCardContext';

export function Username(
    { user, alignRight, colon, idle, bold, colorless }: Readonly<{
        user: string;
        idle?: boolean;
        alignRight?: boolean;
        colon?: boolean;
        bold?: boolean;
        colorless?: boolean;
    }>,
) {
    const { clickUsername } = useTrainerCard();
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
                onClick={clickUsername}
                style={{
                    color: colorless ? '' : idle ? '#888888' : userColor(user),
                }}
                className={'text-black dark:text-white hover:underline hover:cursor-pointer ' +
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
