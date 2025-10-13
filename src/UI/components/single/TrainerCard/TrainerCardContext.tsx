import { type MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TrainerCard from './TrainerCard';
import useClickOutside from '@/UI/hooks/useClickOutside';
import { useClientContext } from '../useClientContext';
import { TrainerCardContext } from './TrainerCardContext.types';

export function TrainerCardProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const { client } = useClientContext();
    const [isOpen, setIsOpen] = useState(false);
    const openCard = () => setIsOpen(true);
    const closeCard = () => setIsOpen(false);

    const [user, setUser] = useState<any | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const wrapperRef = useRef<any>(null);

    const closeWindow = useCallback(() => {
        // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
        setUser(null);
        // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
        setUsername(null);
        // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
        setPosition({ x: 0, y: 0 });
    }, []);

    const { isOutside: clickedOutside } = useClickOutside(wrapperRef);

    const clickUsername: MouseEventHandler<HTMLAnchorElement> = (e) => {
        if (!e) return;
        if (!(e.target instanceof HTMLElement)) return;
        const username = e.target.getAttribute(
            'data-username',
        )?.trim();
        if (!username) {
            console.error('clickUsername: no username');
            return;
        }
        setUsername(username);
        setPosition({ x: e.clientX, y: e.clientY });
        setUser(null);
        client.queryUser(username, (user: any) => {
            setUser(user);
        });
    };

    useEffect(() => {
        if (!clickedOutside) return;
        closeWindow();
    }, [clickedOutside, closeWindow]);


    const contextValue = useMemo(() => ({ isOpen, openCard, closeCard, clickUsername }), [isOpen, clickUsername]);

    return (
        <TrainerCardContext.Provider value={contextValue}>
            <TrainerCard
                user={user}
                name={username}
                position={position}
                forwardRef={wrapperRef}
                close={closeWindow}
            />
            {children}
        </TrainerCardContext.Provider>
    );
}

