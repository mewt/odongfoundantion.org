"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { photos } from "@/content/site";
import { label, type Locale } from "@/lib/i18n";
import { PhotoCredit } from "./photo-credit";
import { HeroGrid } from "./hero-grid";

const slides = [photos.hero, photos.heroTeam, photos.heroArena];

export function HeroBackground({ locale }: { locale: Locale }) {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || loaded.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActive((current) => {
        for (let step = 1; step < slides.length; step++) {
          const next = (current + step) % slides.length;
          if (loaded.includes(next)) return next;
        }
        return current;
      });
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, loaded]);

  return <>
    <div className="hero-background" aria-hidden="true">
      {slides.map((photo, index) => <Image key={photo.id} className={`hero-photo${active === index ? " is-active" : ""}`} src={photo.url} alt="" fill preload={index === 0} loading={index === 0 ? undefined : "eager"} unoptimized sizes="100vw" onLoad={() => setLoaded((current) => current.includes(index) ? current : [...current, index])} />)}
    </div>
    <HeroGrid paused={paused || reducedMotion} />
    <div className="hero-image-tools">
      <PhotoCredit photo={slides[active]} />
      <div className="hero-image-controls" role="group" aria-label={label(locale, "Esports backgrounds", "Latar esports")}>
        {slides.map((photo, index) => <button key={photo.id} type="button" disabled={!loaded.includes(index) && index !== active} aria-label={label(locale, `Show esports image ${index + 1}`, `Tampilkan foto esports ${index + 1}`)} aria-pressed={active === index} onClick={() => { setActive(index); setPaused(true); }}><span /></button>)}
        {!reducedMotion && <button type="button" aria-label={paused ? label(locale, "Play backgrounds", "Putar latar") : label(locale, "Pause backgrounds", "Jeda latar")} onClick={() => setPaused(!paused)}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>}
      </div>
    </div>
  </>;
}
