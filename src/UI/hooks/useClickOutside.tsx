import { RefObject, useEffect, useState } from 'react';

export default function useClickOutside(ref: RefObject<HTMLElement>) {
    const [isOutside, setIsOutside] = useState<boolean | null>(false);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!event.target) return;
            if (ref.current && !ref.current.contains(event.target as Node)) {
                if ((event.target as HTMLElement)?.attributes?.getNamedItem('data-message')) return;
                setIsOutside(true);
            } else {
                setIsOutside(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref.current]);

    return { isOutside, setIsOutside };
}
