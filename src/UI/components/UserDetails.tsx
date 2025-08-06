import { Sprites } from '@pkmn/img';
import { Username } from './Username';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface UserDetailsProps {
    user: string;
    avatar?: string | number;
    border?: boolean;
}

export function UserDetails(props: Readonly<HTMLAttributes<HTMLDivElement> & UserDetailsProps>) {
    return (
        <div className="flex overflow-hidden">
            <div className={cn('flex-shrink-0 w-12 h-12 rounded-full overflow-hidden mr-2 bg-gray-251 dark:bg-gray-250 border-gray-351 dark:border-gray-700', props.border && 'border-2', props.className)}>
                <img
                    src={props.avatar ?
                        Sprites.getAvatar(props.avatar) :
                        Sprites.getAvatar(167)}
                    className="w-10 h-10 object-cover m-auto scale-[1.2]"
                    alt={`${props.user}'s avatar (${props.avatar})`}
                />
            </div>
            <div className="h-full truncate m-auto">
                <Username user={props.user} bold />
            </div>
        </div>
    );
}

