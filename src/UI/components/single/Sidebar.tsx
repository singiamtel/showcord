import type { HTMLAttributes } from 'react';
import { RoomListComponent } from '../RoomListComponent';
import {
    restrictToParentElement,
    restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import UserPanel from './UserPanel';
import 'allotment/dist/style.css';
import {
    closestCenter,
    DndContext,
    type DragOverEvent,
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
import { cn } from '@/lib/utils';
import { useRoomStore } from '@/client/client';

export default function Sidebar(props: Readonly<HTMLAttributes<'div'>>) {
    const rooms = useRoomStore((state) => state.rooms);
    const roomsArray = Array.from(rooms.values()).filter(room => room.open);

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
                const oldIndex = roomsArray.findIndex((item) => item.ID === active.id);
                const newIndex = roomsArray.findIndex((item) => item.ID === over.id);
                const tmp = arrayMove(roomsArray, oldIndex, newIndex);
                useRoomStore.setState({ rooms: new Map(tmp.map((_, idx) => [tmp[idx].ID, tmp[idx]])) });
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
                className={cn(
                    'bg-gray-sidebar-light dark:bg-gray-600 h-screen flex flex-col justify-between',
                    props.className,
                )}
            >
                <div className="text-center mr-2 ml-2 p-2 font-bold text-lg h-16 whitespace-nowrap">
          Showcord!
                </div>
                <div className="flex flex-grow overflow-y-auto">
                    <div className="w-full">
                        {/* @ts-ignore */}
                        <SortableContext
                            items={roomsArray.map((e) => e.ID)}
                            strategy={verticalListSortingStrategy}
                        >
                            {roomsArray.map((room) => (
                                <SortableItem id={room.ID} key={room.ID}>
                                    <RoomListComponent
                                        name={room.name}
                                        type={room.type}
                                        ID={room.ID}
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
