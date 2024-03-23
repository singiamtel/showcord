import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export default function BattleControls(props: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn(props.className, 'flex flex-col w-full h-full justify-center items-center bg-gray-125')}>
    BattleControls

    </div>;
}

