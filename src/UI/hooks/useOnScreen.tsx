import { type RefObject, useEffect, useState } from 'react';

export default function useOnScreen(ref: RefObject<HTMLElement | null>) {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsIntersecting(entry.isIntersecting),
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return isIntersecting;
}
