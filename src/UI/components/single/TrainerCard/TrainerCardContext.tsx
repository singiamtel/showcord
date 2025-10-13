import { type MouseEventHandler, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import TrainerCard from './TrainerCard';
import useClickOutside from '@/UI/hooks/useClickOutside';
import { useClientContext } from '../ClientContext';

interface TrainerCardContextType {
    isOpen: boolean;
    openCard: () => void;
    closeCard: () => void;
    clickUsername: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const TrainerCardContext = createContext<TrainerCardContextType | undefined>(undefined);

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
        setUser(null);
        setUsername(null);
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
        setUser(null);
        setUsername(null);
        setPosition({ x: 0, y: 0 });
    }, [clickedOutside]);


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

export const useTrainerCard = () => {
    const context = useContext(TrainerCardContext);
    if (context === undefined) {
        throw new Error('useTrainerCard must be used within a TrainerCardProvider');
    }
    return context;
};

