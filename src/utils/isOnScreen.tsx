"use client";
import { RefObject, useEffect, useState } from "react";

export default function useOnScreen(ref: RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
    );
    observer.observe((ref as any).current);
    return () => observer.disconnect();
  }, []);

  return isIntersecting;
}
