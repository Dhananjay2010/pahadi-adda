"use client";

import { useEffect, useState } from "react";

/** Local hour as a float (e.g. 18.5 for 6:30pm) — updates once a minute. */
export function useTimeOfDay(): number {
  const [hour, setHour] = useState(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setHour(now.getHours() + now.getMinutes() / 60);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return hour;
}
