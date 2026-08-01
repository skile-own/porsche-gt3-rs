"use client";

import Lenis from "@studio-freight/lenis";
import { AnimatePresence, animate, motion, useInView, useScroll, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const chapters = [
  { id: "01", video: "/videos/02.mp4", poster: "/posters/02.jpg", label: "Engineering", title: "RACE-BRED\nPRECISION.", copy: "Every component serves a single purpose: a direct connection between driver, machine and asphalt.", detail: "4.0 L naturally aspirated flat-six", zoom: 1 },
  { id: "02", video: "/videos/03.mp4", poster: "/posters/03.jpg", label: "Aerodynamics", title: "DOWNFORCE\nREDEFINED.", copy: "The rear wing is not decoration. It is a commitment to grip, balance and outright lap time.", detail: "860 kg downforce at 285 km/h", zoom: 1 },
  { id: "03", video: "/videos/04.mp4", poster: "/posters/04.jpg", label: "Performance", title: "BUILT FOR\nTHE APEX.", copy: "A naturally aspirated engine meets a chassis that makes every millimetre of the racing line count.", detail: "0-100 km/h in 3.2 seconds", zoom: 1 },
  { id: "04", video: "/videos/05.mp4", poster: "/posters/05.jpg", label: "Signature", title: "UNMISTAKABLY\nGT3 RS.", copy: "A silhouette with one destination in mind. The circuit.", detail: "Top speed 296 km/h", zoom: 1.05 },
];

const specRows = [
  { label: "0-100 km/h", value: 3.2, decimals: 1, unit: "SEC" },
  { label: "Top speed", value: 296, decimals: 0, unit: "KM/H" },
  { label: "DIN unladen weight", value: 1450, decimals: 0, unit: "KG" },
  { label: "Downforce @ 285 km/h", value: 860, decimals: 0, unit: "KG" },
  { label: "Redline", value: 9000, decimals: 0, unit: "RPM" },
];

const ticker = "911 GT3 RS /// 525 PS /// 4.0 L FLAT-SIX /// 0-100 IN 3.2 S /// 296 KM/H /// 860 KG DOWNFORCE /// NORDSCHLEIFE 6:49.328 /// ";

let lenisShared: Lenis | null = null;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const glide = (t: number) => 1 - Math.pow(1 - t, 5);

function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = dot.current;
    if (!element || !window.matchMedia("(pointer: fine)").matches) return;
    gsap.set(element, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const move = (event: PointerEvent) => gsap.to(element, { x: event.clientX, y: event.clientY, duration: .35, ease: "power3.out", overwrite: "auto" });
    const over = (event: PointerEvent) => { const hot = (event.target as HTMLElement).closest("a,button"); gsap.to(element, { scale: hot ? 2.6 : 1, duration: .3, overwrite: "auto" }); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerover", over); };
  }, []);
  return <div ref={dot} className="cursor-dot pointer-events-none fixed left-0 top-0 z-[80] h-3 w-3 rounded-full border border-white mix-blend-difference" />;
}

function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} onPointerMove={(event) => { const box = event.currentTarget.getBoundingClientRect(); gsap.to(event.currentTarget, { x: (event.clientX - box.left - box.width / 2) * .18, y: (event.clientY - box.top - box.height / 2) * .22, duration: .25 }); }} onPointerLeave={(event) => gsap.to(event.currentTarget, { x: 0, y: 0, duration: .7, ease: "elastic.out(1,.45)" })} className="magnetic rounded-full border border-white/45 px-7 py-3 font-mono text-[11px] font-bold tracking-[.16em] hover:bg-white hover:text-black">{children}</button>;
}

function Telemetry() {
  const fill = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const pos = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let rpm = 900;
    let target = 900;
    let last = lenisShared ? lenisShared.scroll : window.scrollY;
    const tick = () => {
      const current = lenisShared ? lenisShared.scroll : window.scrollY;
      const delta = Math.abs(current - last);
      last = current;
      target = Math.min(9000, Math.max(target * .9, 900 + delta * 80));
      rpm += (target - rpm) * .16;
      if (fill.current) gsap.set(fill.current, { scaleX: rpm / 9000 });
      if (readout.current) readout.current.textContent = String(Math.round(rpm)).padStart(4, "0");
      if (pos.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
        pos.current.textContent = `TRK ${String(pct).padStart(3, "0")}%`;
      }
    };
    gsap.set(fill.current, { scaleX: rpm / 9000 });
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return <div className="absolute bottom-10 right-6 z-10 flex flex-col items-end gap-3 md:right-16">
    <div className="flex items-center gap-3 font-mono text-[10px] tracking-[.18em] text-white/60">
      <span>RPM</span>
      <span className="relative block h-[3px] w-24 overflow-hidden bg-white/15"><span ref={fill} className="absolute inset-0 block origin-left bg-white" /></span>
      <span ref={readout} className="w-10 text-right text-white">0900</span>
    </div>
    <span ref={pos} className="font-mono text-[10px] tracking-[.2em] text-white/50">TRK 000%</span>
  </div>;
}

function Counter({ to, decimals = 0, duration = 1.6, className }: { to: number; decimals?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, to, { duration, ease: "easeOut", onUpdate: (value) => { if (ref.current) ref.current.textContent = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US"); } });
    return () => controls.stop();
  }, [inView, to, decimals, duration]);
  return <span ref={ref} className={className}>0</span>;
}

function Marquee() {
  return <div aria-hidden className="relative overflow-hidden border-y border-white/10 bg-[#050505] py-3">
    <div className="marquee flex w-max whitespace-nowrap font-mono text-[10px] uppercase tracking-[.22em] text-white/45">
      <span className="pr-4">{ticker}</span><span className="pr-4">{ticker}</span>
    </div>
  </div>;
}

function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const onEnded = () => { element.currentTime = 0; void element.play().catch(() => {}); };
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) void element.play().catch(() => {}); else element.pause(); }); }, { threshold: .1 });
    element.addEventListener("ended", onEnded);
    observer.observe(element);
    return () => { element.removeEventListener("ended", onEnded); observer.disconnect(); };
  }, []);
  return <motion.video ref={video} initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.8, ease: "easeOut" }} autoPlay muted loop playsInline preload="auto" src="/videos/01.mp4" className="absolute inset-0 h-full w-full object-cover opacity-70" />;
}

function ScrollSequence() {
  const stage = useRef<HTMLElement>(null);
  const videos = useRef<HTMLVideoElement[]>([]);
  const copy = useRef<HTMLDivElement[]>([]);
  const railFill = useRef<HTMLDivElement>(null);
  const railDot = useRef<HTMLDivElement>(null);
  const railTicks = useRef<HTMLSpanElement[]>([]);
  const counter = useRef<HTMLSpanElement>(null);
  const hint = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = videos.current;
    media.forEach((video, index) => { video.load(); video.pause(); gsap.set(video, { autoAlpha: index === 0 ? 1 : 0, scale: chapters[index].zoom }); });
    copy.current.forEach((card, index) => gsap.set(card, { autoAlpha: index === 0 ? 1 : 0, y: index === 0 ? 0 : 26 }));
    gsap.set(railFill.current, { scaleY: 0 });
    railTicks.current.forEach((tick, index) => gsap.set(tick, { opacity: index === 0 ? 1 : .3 }));

    const smooth = (t: number) => { const c = clamp(t); return c * c * (3 - 2 * c); };
    const previousTimes = media.map(() => -1);
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: () => `+=${window.innerHeight * 10}`,
      pin: true,
      scrub: .18,
      anticipatePin: 1,
      onUpdate: (self) => {
        const story = Math.min(chapters.length - .0001, self.progress * chapters.length);
        const chapterIndex = Math.floor(story);
        const chapterProgress = story - chapterIndex;
        const activeVideo = media[chapterIndex];
        const playhead = chapterIndex === 0 ? (chapterProgress < .45 ? chapterProgress / .45 : chapterProgress < .55 ? 1 : 1 - (chapterProgress - .55) / .45) : chapterProgress < .5 ? chapterProgress / .5 : 1;
        if (activeVideo.readyState >= 1 && Number.isFinite(activeVideo.duration) && activeVideo.duration > 0) {
          const nextTime = activeVideo.duration * clamp(playhead);
          if (Math.abs(nextTime - previousTimes[chapterIndex]) > .008) { activeVideo.currentTime = nextTime; previousTimes[chapterIndex] = nextTime; }
        }

        const fade = smooth((chapterProgress - .72) / .26);
        media.forEach((video, index) => {
          const isOutgoing = index === chapterIndex && chapterIndex < media.length - 1;
          const isIncoming = chapterIndex < media.length - 1 && index === chapterIndex + 1;
          const opacity = isOutgoing ? 1 - fade : isIncoming ? fade : index === chapterIndex ? 1 : 0;
          const extra = isOutgoing ? fade * .06 : isIncoming ? (1 - fade) * .06 : 0;
          gsap.set(video, { autoAlpha: opacity, scale: chapters[index].zoom * (1 + extra) });
        });
        copy.current.forEach((card, index) => {
          const visible = index === chapterIndex ? clamp(chapterProgress / .12) * clamp((.74 - chapterProgress) / .12) : 0;
          gsap.set(card, { autoAlpha: visible, y: 26 * (1 - visible) });
        });

        const overall = (chapterIndex + chapterProgress) / chapters.length;
        gsap.set(railFill.current, { scaleY: overall });
        gsap.set(railDot.current, { y: overall * 148 });
        railTicks.current.forEach((tick, index) => gsap.set(tick, { opacity: index <= chapterIndex ? 1 : .3 }));
        if (counter.current) counter.current.textContent = String(chapterIndex + 1).padStart(2, "0");
        gsap.set(hint.current, { autoAlpha: 1 - clamp(story) });
      },
    });
    return () => trigger.kill();
  }, []);

  return <section ref={stage} id="experience" className="relative h-screen overflow-hidden bg-[#050505]">
    <div className="absolute inset-0">
      {chapters.map((chapter, index) => <div key={chapter.id} className="video-frame absolute inset-0"><video ref={(node) => { if (node) videos.current[index] = node; }} src={chapter.video} poster={chapter.poster} preload="auto" muted playsInline style={{ opacity: index === 0 ? 1 : 0 }} aria-label={`${chapter.label} Porsche 911 GT3 RS sequence`} className="h-full w-full object-cover" /></div>)}
    </div>
    <div className="absolute inset-0 z-[1] bg-black/10" />
    <div className="relative z-10 h-full">
      {chapters.map((chapter, index) => <div ref={(node) => { if (node) copy.current[index] = node; }} key={chapter.id} style={{ opacity: index === 0 ? 1 : 0 }} className="absolute inset-x-0 bottom-0 flex px-6 pb-16 md:px-16 md:pb-14">
        <div className="max-w-2xl"><p className="eyebrow mb-4">{chapter.id} / 04 - {chapter.label}</p><h2 className="display whitespace-pre-line text-[11vw] font-black uppercase md:text-[5vw]">{chapter.title}</h2><div className="mt-5 flex max-w-xl flex-col gap-4 border-l border-white/40 pl-4 text-[13px] leading-relaxed text-white/75 md:flex-row md:items-baseline md:gap-10"><p>{chapter.copy}</p><p className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[.13em] text-white">{chapter.detail}</p></div></div>
      </div>)}
    </div>
    <div className="absolute right-7 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-4 md:flex">
      <span ref={counter} className="font-mono text-[10px] font-bold tracking-[.2em] text-white/70">01</span>
      <div className="relative h-[148px] w-px bg-white/15">
        <div ref={railFill} className="absolute inset-0 origin-top bg-white" />
        <div ref={railDot} className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] rounded-full bg-white" />
        {chapters.map((chapter, index) => <span key={chapter.id} ref={(node) => { if (node) railTicks.current[index] = node; }} className="absolute -left-[5px] h-px w-[11px] bg-white/60" style={{ top: `${(index / chapters.length) * 100}%` }} />)}
      </div>
    </div>
    <div ref={hint} className="absolute bottom-8 right-7 z-10 flex items-center gap-3 font-mono text-[10px] tracking-[.15em] text-white/50 md:right-16"><span className="h-px w-9 bg-white/40" />SCROLL TO EXPLORE</div>
  </section>;
}

export default function PorscheExperience() {
  const [menu, setMenu] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: .001 });

  useEffect(() => {
    const lenis = new Lenis({ lerp: .075, smoothWheel: true, syncTouch: false });
    lenisRef.current = lenis;
    lenisShared = lenis;
    const sync = () => ScrollTrigger.update();
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", sync);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const onAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { duration: 1.6, easing: glide });
    };
    document.addEventListener("click", onAnchorClick);
    return () => { document.removeEventListener("click", onAnchorClick); lenis.off("scroll", sync); gsap.ticker.remove(tick); lenis.destroy(); lenisRef.current = null; lenisShared = null; };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const scrollTo = (target: string) => lenisRef.current?.scrollTo(target, { duration: 1.6, easing: glide });

  return <main>
    <div className="grain pointer-events-none fixed inset-0 z-[65]" />
    <Cursor /><motion.div style={{ scaleX }} className="fixed left-0 top-0 z-[70] h-px w-full origin-left bg-white" />
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-6 mix-blend-difference md:px-12"><a href="#top" className="text-[12px] font-medium uppercase tracking-[.3em]">Porsche</a><div className="hidden gap-7 font-mono text-[10px] tracking-[.15em] text-white/70 md:flex"><a className="transition-colors duration-300 hover:text-white" href="#experience">VEHICLE</a><a className="transition-colors duration-300 hover:text-white" href="#experience">PERFORMANCE</a><a className="transition-colors duration-300 hover:text-white" href="#specifications">SPECIFICATIONS</a></div><button aria-label="Open menu" onClick={() => setMenu(!menu)} className="font-mono text-[10px] tracking-[.15em]">{menu ? "CLOSE" : "MENU"}</button></nav>
    <AnimatePresence>{menu && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .35, ease: "easeOut" }} className="fixed inset-0 z-40 flex flex-col justify-center gap-4 bg-[#050505] px-7 md:px-16">
      {[["01", "The vehicle", "#experience"], ["02", "Specifications", "#specifications"], ["03", "Configure", "#final"]].map(([index, label, href], i) => <motion.a key={href} href={href} onClick={() => setMenu(false)} initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 + i * .07, duration: .5, ease: "easeOut" }} className="group flex w-fit items-baseline gap-5 transition-[padding] duration-300 ease-out hover:pl-6">
        <span className="font-mono text-[10px] tracking-[.2em] text-white/40">{index}</span><span className="display text-6xl uppercase md:text-8xl">{label}</span>
      </motion.a>)}
    </motion.div>}</AnimatePresence>
    <section id="top" className="relative flex h-screen min-h-[680px] items-end overflow-hidden px-6 pb-12 md:px-16 md:pb-16">
      <HeroVideo /><div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10">
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15, duration: .7, ease: "easeOut" }} className="eyebrow mb-6">Porsche 911 GT3 RS / 2025</motion.p>
        <h1 className="display text-[21vw] uppercase md:text-[12.5vw]">
          <span className="block overflow-hidden pb-1"><motion.span initial={{ y: "112%" }} animate={{ y: 0 }} transition={{ delay: .25, duration: 1, ease: [.16, 1, .3, 1] }} className="block">BORN</motion.span></span>
          <span className="block overflow-hidden pb-1"><motion.span initial={{ y: "112%" }} animate={{ y: 0 }} transition={{ delay: .37, duration: 1, ease: [.16, 1, .3, 1] }} className="block">ON TRACK.</motion.span></span>
        </h1>
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .6, duration: .8, ease: "easeOut" }} className="mt-9 flex items-center gap-5">
          <MagneticButton onClick={() => scrollTo("#experience")}>DISCOVER THE CAR</MagneticButton>
          <span className="font-mono text-[10px] tracking-[.13em] text-white/60">525 PS / 3.2 SEC / 296 KM/H</span>
        </motion.div>
      </div>
      <Telemetry />
    </section>
    <Marquee />
    <ScrollSequence />
    <section id="specifications" className="relative flex min-h-screen items-center px-6 py-28 md:px-16">
      <div className="relative w-full">
        <p className="eyebrow mb-9">Specifications</p>
        <h2 className="display mb-14 text-[18vw] uppercase md:text-[10vw]">PURE<br /><span className="outline-text">DATA.</span></h2>
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-12% 0px" }} transition={{ duration: .9, ease: "easeOut" }} className="md:col-span-5">
            <p className="display text-[24vw] md:text-[10.5vw]"><Counter to={525} /></p>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[.2em] text-white/55">PS maximum power / 4.0 L flat-six</p>
          </motion.div>
          <div className="md:col-span-7">
            {specRows.map((row, index) => <motion.div key={row.label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ delay: index * .07, duration: .7, ease: "easeOut" }} className="group flex items-baseline justify-between gap-6 border-t border-white/15 py-5 transition-colors duration-300 last:border-b hover:bg-white/[.04]">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-white/55 transition-colors duration-300 group-hover:text-white/80">{row.label}</p>
              <p className="display text-4xl md:text-5xl"><Counter to={row.value} decimals={row.decimals} /><span className="ml-2 align-top font-mono text-[10px] tracking-[.15em] text-white/50">{row.unit}</span></p>
            </motion.div>)}
          </div>
        </div>
      </div>
    </section>
    <section id="final" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none display text-[42vw] text-transparent opacity-[.06] md:text-[30vw]" style={{ WebkitTextStroke: "1.5px #ffffff" }}>RS</span>
      <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: .8 }} className="eyebrow mb-7">The ultimate track tool</motion.p>
      <h2 className="display text-[18vw] uppercase md:text-[10vw]">
        <motion.span initial={{ opacity: 0, y: 34 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15% 0px" }} transition={{ duration: .9, ease: "easeOut" }} className="block">YOUR LINE.</motion.span>
        <motion.span initial={{ opacity: 0, y: 34 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15% 0px" }} transition={{ delay: .12, duration: .9, ease: "easeOut" }} className="outline-text block">YOUR RULES.</motion.span>
      </h2>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .25, duration: .8 }} className="mt-12"><MagneticButton>CONFIGURE YOUR GT3 RS</MagneticButton></motion.div>
    </section>
    <footer className="flex items-center justify-between border-t border-white/10 px-6 py-6 font-mono text-[10px] uppercase tracking-[.18em] text-white/40 md:px-16">
      <span>Porsche AG - Concept Experience</span>
      <span className="hidden md:inline">911 GT3 RS (992)</span>
      <a href="#top" className="transition-colors duration-300 hover:text-white">Back to top ↑</a>
    </footer>
  </main>;
}
