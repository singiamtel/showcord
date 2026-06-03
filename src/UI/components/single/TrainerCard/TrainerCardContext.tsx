import { useCallback, useMemo, useRef, useState } from 'react';
import TrainerCard from './TrainerCard';
import { logger } from '@/utils/logger';
import useClickOutside from '@/UI/hooks/useClickOutside';
import { useClientContext } from '../useClientContext';
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
    const clickedElementRef = useRef<HTMLElement | null>(null);

    const closeWindow = useCallback(() => {
        setUser(null);
        setUsername(null);
        setPosition({ x: 0, y: 0 });
        clickedElementRef.current = null;
    }, []);

    const wrapperRef = useClickOutside(closeWindow);

    const clickUsername = useCallback((e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (!e) return;
        if (!(e.target instanceof HTMLElement)) return;
        const clickedElement = e.target;

        // If clicking on the same element that opened the popup, close it
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
        clickedElementRef.current = clickedElement;
        setUsername(username);
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
                position={position}
                forwardRef={wrapperRef}
                close={closeWindow}
            />
            {children}
        </TrainerCardContext>
    );
}

