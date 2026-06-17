import { useEffect, useState } from "react";

const VALID = ["morning", "afternoon", "evening", "night"];

// Same time buckets as the Hero greeting, so the visuals and the welcome
// message stay in sync.
export function getPeriod(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

// Optional manual override for previews/demos:
//   ?theme=night  (persisted) or ?theme=auto to clear.
function getOverride() {
  if (typeof window === "undefined") return null;
  try {
    const param = new URLSearchParams(window.location.search).get("theme");
    if (param === "auto") {
      localStorage.removeItem("flamingo-theme");
    } else if (param && VALID.includes(param)) {
      localStorage.setItem("flamingo-theme", param);
      return param;
    }
    const stored = localStorage.getItem("flamingo-theme");
    return stored && VALID.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function useTimeTheme() {
  const [period, setPeriod] = useState(() => getOverride() || getPeriod());

  useEffect(() => {
    if (getOverride()) return; // pinned by override
    const tick = () =>
      setPeriod((prev) => {
        const next = getPeriod();
        return next === prev ? prev : next;
      });
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return { period, isNight: period === "night" };
}
