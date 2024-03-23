import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export default function BattleWindow(props: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn(props.className, 'h-full w-full max-w-96 max-h-48')}>
    Battle

    </div>;
}

