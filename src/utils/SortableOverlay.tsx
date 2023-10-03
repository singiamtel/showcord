import type { PropsWithChildren } from 'react';
import {
    defaultDropAnimationSideEffects,
    DragOverlay,
    type DropAnimation,
} from '@dnd-kit/core';

const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.4',
            },
        },
    }),
};

interface Props {}

export function SortableOverlay({ children }: PropsWithChildren<Props>) {
    return (
        <DragOverlay dropAnimation={dropAnimationConfig}>{children}</DragOverlay>
    );
}
