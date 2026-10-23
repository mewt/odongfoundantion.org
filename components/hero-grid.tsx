"use client";

import { useEffect, useId, useRef, useState } from "react";

export function HeroGrid({ paused }: { paused: boolean }) {
  const id = useId().replace(/:/g, "");
  const host = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    const updateVisibility = () => setTabVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  return <svg ref={host} className="hero-grid" width="100%" height="100%" aria-hidden="true" focusable="false" data-running={!paused && visible && tabVisible}>
    <defs>
      <pattern id={`${id}-squares`} width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke="#ffe0b5" strokeOpacity=".32" strokeWidth=".8" />
      </pattern>
      <pattern id={`${id}-notebook`} width="200" height="200" patternUnits="userSpaceOnUse">
        <rect width="200" height="200" fill={`url(#${id}-squares)`} />
        <path d="M200 0H0V200" fill="none" stroke="#ffd39a" strokeOpacity=".5" strokeWidth="1.2" />
        <circle cx="0" cy="0" r="2.5" fill="#ffd39a" fillOpacity=".75" />
      </pattern>
      <pattern id={`${id}-bright`} width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke="#ffbd73" strokeWidth="1.1" />
        <circle cx="0" cy="0" r="1.8" fill="#ffe5c4" />
      </pattern>
      <radialGradient id={`${id}-glow`} cx="75%" cy="50%" r="50%">
        <stop offset="0" stopColor="white" stopOpacity=".95" />
        <stop offset=".45" stopColor="white" stopOpacity=".4" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <mask id={`${id}-spotlight`} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
        <rect className="hero-grid-sweep" width="100%" height="100%" fill={`url(#${id}-glow)`} />
      </mask>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id}-notebook)`} />
    <rect width="100%" height="100%" fill={`url(#${id}-bright)`} mask={`url(#${id}-spotlight)`} />
  </svg>;
}
