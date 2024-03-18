import { HTMLAttributes, useContext } from 'react';
import { PS_context } from './PS_context';
import { RoomListComponent } from '../RoomListComponent';
import { twMerge } from 'tailwind-merge';
import {
    restrictToParentElement,
    restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import UserPanel from './userpanel';
import 'allotment/dist/style.css';
import {
    closestCenter,
    DndContext,
    DragOverEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from '../../../utils/Sortable';

export default function Sidebar(props: Readonly<HTMLAttributes<'div'>>) {
    const { rooms, setRooms } = useContext(PS_context);

    const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
        activationConstraint: {
            distance: 10,
        },
    });
    const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
        activationConstraint: {
            delay: 250,
            tolerance: 5,
        },
    });
    const sensors = useSensors(mouseSensor, touchSensor);

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (over) {
            if (active.id !== over.id) {
                const oldIndex = rooms.findIndex((item) => item.ID === active.id);
                const newIndex = rooms.findIndex((item) => item.ID === over.id);
                const tmp = arrayMove(rooms, oldIndex, newIndex);
                setRooms(tmp);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragOver={handleDragOver}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
            <div
                id='sidebar'
                className={twMerge(
                    'bg-gray-sidebar-light dark:bg-gray-600 h-screen flex flex-col justify-between',
                    props.className,
                )}
            >
                <div className="text-center mr-2 ml-2 p-2 font-bold text-lg h-16 whitespace-nowrap">
          Showcord!
                </div>
                <div className="flex flex-grow overflow-y-auto">
                    <div className="w-full">
                        <SortableContext
                            items={rooms.map((e) => e.ID)}
                            strategy={verticalListSortingStrategy}
                        >
                            {rooms.map((room, idx) => (
                                <SortableItem id={room.ID} key={idx}>
                                    <RoomListComponent
                                        name={room.name}
                                        type={room.type}
                                        ID={room.ID}
                                        notifications={{
                                            unread: room.unread,
                                            mentions: room.mentions,
                                        }}
                                    />
                                </SortableItem>
                            ))}
                        </SortableContext>
                    </div>
                </div>
                <UserPanel />
            </div>
        </DndContext>
    );
}
