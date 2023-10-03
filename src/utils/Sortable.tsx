import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FC, ReactNode } from 'react';

interface SortableItemProps {
    id: string;
    children: ReactNode;
}

const SortableItem: FC<SortableItemProps> = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        transition: {
            duration: 150, // milliseconds
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        },
        id,
    });

    const style = {
        opacity: transform ? 0.8 : 1,
        transform: CSS.Transform.toString(transform),
        transition: transition,
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={style}
        >
            {children}
        </div>
    );
};

export default SortableItem;
