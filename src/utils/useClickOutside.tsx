import { RefObject, useEffect, useState } from "react";

export default function useClickOutside(ref: RefObject<HTMLElement>) {
  const [isOutside, setIsOutside] = useState(false);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!event.target) return;
      console.log("clicked on", event.target, "ref", ref.current);
      if (ref.current && !ref.current.contains(event.target as Node)) {
        console.log("it was outside");
        setIsOutside(true);
      } else {
        setIsOutside(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, ref.current]);

  return { isOutside };
}
