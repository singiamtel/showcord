import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export default function BattleWindow(props: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn(props.className, 'h-full w-full bg-gray-125')}>
    Battle

    </div>;
}

