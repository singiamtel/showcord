import { useCallback, useMemo, useRef, useState } from 'react';
import TrainerCard from './TrainerCard';
import { logger } from '@/utils/logger';
import { toID } from '@/utils/generic';
import useClickOutside from '@/UI/hooks/useClickOutside';
import { useClientContext } from '../useClientContext';
import { useRoomStore } from '@/client/client';
import { TrainerCardContext } from './TrainerCardContext.types';
import type { UserDetails } from '@/client/queryHandlers';

export function TrainerCardProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const { client } = useClientContext();
    const [isOpen, setIsOpen] = useState(false);
    const openCard = () => setIsOpen(true);
    const closeCard = () => setIsOpen(false);

    const [user, setUser] = useState<UserDetails | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [localRank, setLocalRank] = useState<string | null>(null);
    const [globalRank, setGlobalRank] = useState<string | null>(null);
    const clickedElementRef = useRef<HTMLElement | null>(null);

    const closeWindow = useCallback(() => {
        setUser(null);
        setUsername(null);
        setPosition({ x: 0, y: 0 });
        setLocalRank(null);
        setGlobalRank(null);
        clickedElementRef.current = null;
    }, []);

    const wrapperRef = useClickOutside(closeWindow);

    const clickUsername = useCallback((e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (!e) return;
        if (!(e.target instanceof HTMLElement)) return;
        const clickedElement = e.target;

        if (clickedElementRef.current === clickedElement) {
            closeWindow();
            return;
        }

        const username = clickedElement.getAttribute(
            'data-username',
        )?.trim();
        if (!username) {
            logger.error('clickUsername: no username');
            return;
        }

        const rank = clickedElement.getAttribute('data-rank') ?? null;
        const userID = toID(username);

        let globalRankSymbol: string | null = null;
        const lobbyRoom = useRoomStore.getState().rooms.get('lobby');
        if (lobbyRoom) {
            const lobbyUser = lobbyRoom.users.find((u) => u.ID === userID);
            globalRankSymbol = lobbyUser?.name.charAt(0) ?? null;
        }

        clickedElementRef.current = clickedElement;
        setUsername(username);
        setLocalRank(rank);
        setGlobalRank(globalRankSymbol);
        setPosition({ x: e.clientX, y: e.clientY });
        setUser(null);
        client.queryUser(username).then((user: UserDetails) => {
            setUser(user);
        });
    }, [client, closeWindow]);

    const contextValue = useMemo(() => ({ isOpen, openCard, closeCard, clickUsername }), [isOpen, clickUsername]);

    return (
        <TrainerCardContext value={contextValue}>
            <TrainerCard
                user={user}
                name={username}
                localRank={localRank}
                globalRank={globalRank}
                position={position}
                forwardRef={wrapperRef}
                close={closeWindow}
            />
            {children}
        </TrainerCardContext>
    );
}

