import { useEffect, useRef } from 'react';

export default function useClickOutside(onClickOutside: () => void) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!event.target) return;
            if (ref.current && !ref.current.contains(event.target as Node)) {
                if ((event.target as HTMLElement)?.attributes?.getNamedItem('data-message')) return;
                onClickOutside();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClickOutside]);

    return ref;
}
