import { type RefObject, useEffect, useState } from 'react';

export default function useOnScreen(ref: RefObject<HTMLElement>) {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsIntersecting(entry.isIntersecting),
        );
        observer.observe((ref as any).current);
        return () => observer.disconnect();
    }, []);

    return isIntersecting;
}
