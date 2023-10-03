import { useContext, useEffect, useMemo, useState } from 'react';
import { PS_context } from './PS_context';
import { RoomComponent } from './rooms';
import {
    restrictToParentElement,
    restrictToVerticalAxis,
    restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import UserPanel from './userpanel';
import 'allotment/dist/style.css';
import { Allotment } from 'allotment';
import {
    Active,
    closestCenter,
    DndContext,
    DragEndEvent,
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
import SortableItem from '../utils/Sortable';

export default function Sidebar() {
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
                // console.log('tmp:', tmp.map((e) => e.id));
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
            <div className="w-auto bg-gray-600 h-screen flex flex-col justify-between">
                <div className="text-center mr-2 ml-2 p-2 text-white font-bold text-lg h-16 whitespace-nowrap">
          Pokémon Showdown!
                </div>
                <div className="flex flex-grow">
                    <Allotment vertical minSize={100} className="">
                        <div className="w-full">
                            <SortableContext
                                items={rooms.map((e) => e.ID)}
                                strategy={verticalListSortingStrategy}
                            >
                                {rooms.filter((e) => e.type !== 'pm').map((room) => (
                                    <SortableItem id={room.ID}>
                                        <RoomComponent
                                            name={room.name}
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

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragOver={handleDragOver}
                            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                        >
                            <SortableContext
                                items={rooms.map((e) => e.ID)}
                                strategy={verticalListSortingStrategy}
                            >
                                {rooms.filter((e) => e.type === 'pm').length > 0 && (
                                    <div className="w-full">
                                        {rooms.filter((e) => e.type === 'pm').map((room) => (
                                            <SortableItem id={room.ID}>
                                                <RoomComponent
                                                    name={room.name}
                                                    ID={room.ID}
                                                    notifications={{
                                                        unread: room.unread,
                                                        mentions: room.mentions,
                                                    }}
                                                />
                                            </SortableItem>
                                        ))}
                                    </div>
                                )}
                            </SortableContext>
                        </DndContext>
                    </Allotment>
                </div>
                <UserPanel />
            </div>
        </DndContext>
    );
}
