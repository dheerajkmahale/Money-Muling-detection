import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MatrixRain from "@/components/MatrixRain";
import CyberShieldLogo from "@/components/CyberShieldLogo";
import { TerminalWidget } from "@/components/TerminalWidget";
import FeatureCard from "@/components/FeatureCard";
import { VoiceAssistant } from "@/components/fraud/VoiceAssistant";
import {
  Shield,
  Cpu,
  AlertTriangle,
  Network,
  TrendingUp,
  Activity,
  Upload,
  Download,
  Mic,
  Globe,
  Zap,
  Eye,
  ArrowRight,
  ChevronRight,
  Lock,
} from "lucide-react";

// Animated counter
const AnimatedCounter: React.FC<{ target: number; suffix?: string; duration?: number }> = ({
  target,
  suffix = "",
  duration = 2000,
}) => {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const start = Date.now();
          const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={elementRef} className="font-mono font-bold text-3xl md:text-4xl text-neon tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

// Scroll indicator dots
const ScrollDots: React.FC<{ active: number; total: number }> = ({ active, total }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className="w-1 rounded-full transition-all duration-300"
        style={{
          height: i === active ? "24px" : "8px",
          background: i === active ? "hsl(155 100% 50%)" : "hsl(155 100% 50% / 0.3)",
        }}
      />
    ))}
  </div>
);

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const sections = document.querySelectorAll("section[data-section]");
      sections.forEach((section, i) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5) {
          setActiveSection(i);
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { label: "Transactions Processed", value: 10000, suffix: "+", icon: Activity },
    { label: "Detection Accuracy", value: 98, suffix: "%", icon: Eye },
    { label: "Analysis Time", value: 30, suffix: "s", icon: Zap },
    { label: "Supported Languages", value: 10, suffix: "", icon: Globe },
  ];

  const capabilities = [
    {
      icon: Shield,
      title: "Circular Routing Detection",
      description:
        "Detect money-laundering cycles of length 3–5 hops between accounts, automatically grouping them into fraud rings with unique IDs.",
      badge: "CYCLES",
    },
    {
      icon: TrendingUp,
      title: "Smurfing Analysis",
      description:
        "Identify fan-in (10+ senders → 1 receiver) and fan-out (1 sender → 10+ receivers) patterns within 72-hour sliding windows.",
      badge: "SMURF",
    },
    {
      icon: Network,
      title: "Shell Chain Tracing",
      description:
        "Trace layered shell account chains with 3+ hops where intermediate accounts carry only 2–3 total transactions.",
      badge: "SHELL",
    },
    {
      icon: Cpu,
      title: "Suspicion Scoring",
      description:
        "Score every account 0–100 based on cycle participation, fan-in/out behaviour, transaction velocity, and shell characteristics.",
      badge: "SCORE",
    },
    {
      icon: Mic,
      title: "AI Voice Assistant",
      description:
        "Multilingual real-time voice assistant supporting 10 Indian languages — ask questions, get fraud explanations, and navigate by voice.",
      badge: "AI",
    },
    {
      icon: Download,
      title: "JSON Export",
      description:
        "One-click export of the complete analysis report in structured JSON format: suspicious accounts, fraud rings, and full summary.",
      badge: "EXPORT",
    },
  ];

  const voiceLanguages = [
    "English", "हिन्दी", "తెలుగు", "தமிழ்", "ಕನ್ನಡ",
    "മലയാളം", "मराठी", "বাংলা", "ગુજરાતી", "ਪੰਜਾਬੀ",
  ];

  const terminalLines = [
    { prefix: "[SYS]", text: "Money Muling Detection Engine v2.4.1 initialized" },
    { prefix: "[NET]", text: "Graph construction module: ACTIVE" },
    { prefix: "[AML]", text: "Fraud detection algorithms: LOADED" },
    { prefix: "[AI ]", text: "Multilingual voice assistant: ONLINE" },
    { prefix: "[OK ]", text: "System ready. Upload CSV to begin analysis." },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden hex-pattern">
      <MatrixRain />
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: "var(--gradient-glow)" }} />

      {/* Scroll indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:block">
        <ScrollDots active={activeSection} total={4} />
      </div>

      {/* ─────────── NAV ─────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-300"
        style={{
          background: scrollY > 40 ? "hsl(220 20% 4% / 0.95)" : "transparent",
          backdropFilter: scrollY > 40 ? "blur(12px)" : "none",
          borderBottom: scrollY > 40 ? "1px solid hsl(155 60% 20% / 0.4)" : "none",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7">
            <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 5L10 22V55C10 78 28 98 50 108C72 98 90 78 90 55V22L50 5Z"
                fill="hsl(155 100% 50% / 0.15)"
                stroke="hsl(155 100% 50%)"
                strokeWidth="2"
              />
              <path
                d="M38 58L46 66L63 49"
                stroke="hsl(155 100% 50%)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            className="font-bold tracking-widest text-sm hidden sm:block"
            style={{ fontFamily: "Orbitron, monospace", color: "hsl(155 100% 50%)" }}
          >
            MMDE
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "How It Works", "Languages", "Terminal"].map((item) => (
            <button
              key={item}
              onClick={() => {
                const el = document.getElementById(item.toLowerCase().replace(/\s+/g, "-"));
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-mono tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded border transition-all duration-200 hover:scale-105"
          style={{
            background: "hsl(155 100% 50% / 0.1)",
            borderColor: "hsl(155 100% 50%)",
            color: "hsl(155 100% 50%)",
            boxShadow: "0 0 15px hsl(155 100% 50% / 0.2)",
          }}
        >
          ACCESS ENGINE
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* ─────────── HERO ─────────── */}
      <section data-section="hero" className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
        {/* Status badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono mb-8"
          style={{
            borderColor: "hsl(155 100% 50% / 0.4)",
            background: "hsl(155 100% 50% / 0.05)",
            color: "hsl(155 100% 70%)",
          }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(155 100% 50%)" }} />
          SYSTEM STATUS: OPERATIONAL
        </div>

        {/* Shield logo */}
        <div className="mb-8">
          <CyberShieldLogo size={110} />
        </div>

        {/* Headline */}
        <h1 className="mb-4" style={{ fontFamily: "Orbitron, monospace" }}>
          <span className="block text-4xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight">
            MONEY MULING
          </span>
          <span className="block text-4xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight">
            DETECTION
          </span>
          <span
            className="block text-4xl md:text-6xl lg:text-7xl font-black text-neon leading-tight"
            style={{ WebkitTextStroke: "1px hsl(155 100% 50%)" }}
          >
            ENGINE
          </span>
        </h1>

        <p className="max-w-xl text-sm md:text-base font-mono text-muted-foreground leading-relaxed mb-10">
          Advanced financial crime analysis platform for AML compliance teams. Detect circular routing, smurfing, and shell account chains using graph-based algorithms — powered by AI.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-2 px-8 py-3.5 text-sm font-mono font-bold rounded transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, hsl(155 100% 50%), hsl(185 100% 45%))",
              color: "hsl(220 20% 4%)",
              boxShadow: "0 0 30px hsl(155 100% 50% / 0.4), 0 4px 20px hsl(155 100% 50% / 0.2)",
            }}
          >
            <Upload className="w-4 h-4" />
            START ANALYSIS
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-2 px-8 py-3.5 text-sm font-mono font-bold rounded border transition-all duration-200 hover:bg-primary/5"
            style={{
              borderColor: "hsl(155 100% 50% / 0.4)",
              color: "hsl(155 100% 70%)",
            }}
          >
            LEARN MORE
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-xs font-mono text-muted-foreground tracking-widest">SCROLL</span>
          <div className="w-px h-12" style={{ background: "linear-gradient(to bottom, hsl(155 100% 50%), transparent)" }} />
        </div>
      </section>

      {/* ─────────── STATS ─────────── */}
      <section data-section="stats" className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ label, value, suffix, icon: Icon }) => (
              <div
                key={label}
                className="relative text-center p-6 rounded border overflow-hidden group hover:scale-105 transition-transform duration-300"
                style={{
                  background: "hsl(220 20% 7%)",
                  borderColor: "hsl(155 60% 20%)",
                }}
              >
                {/* Glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: "hsl(155 100% 50% / 0.05)" }}
                />
                {/* Corner accent */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: "hsl(155 100% 50% / 0.6)" }} />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: "hsl(155 100% 50% / 0.6)" }} />

                <Icon className="w-5 h-5 mx-auto mb-3 text-muted-foreground" style={{ color: "hsl(155 100% 50%)" }} />
                <AnimatedCounter target={value} suffix={suffix} />
                <p className="text-xs font-mono text-muted-foreground mt-2 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── FEATURES ─────────── */}
      <section id="features" data-section="features" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <span className="text-xs font-mono tracking-widest text-muted-foreground border border-border/40 px-3 py-1 rounded-full">
              // AML TOOLKIT
            </span>
            <h2
              className="text-3xl md:text-4xl font-black mt-4 mb-3"
              style={{ fontFamily: "Orbitron, monospace", color: "hsl(155 100% 50%)" }}
            >
              FORENSIC TOOLKIT
            </h2>
            <p className="text-sm font-mono text-muted-foreground max-w-lg mx-auto">
              Six powerful detection modules working in concert to expose financial crime networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((cap) => (
              <FeatureCard
                key={cap.title}
                icon={cap.icon}
                title={cap.title}
                description={cap.description}
                badge={cap.badge}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── HOW IT WORKS ─────────── */}
      <section id="how-it-works" data-section="how-it-works" className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono tracking-widest text-muted-foreground border border-border/40 px-3 py-1 rounded-full">
              // WORKFLOW
            </span>
            <h2
              className="text-3xl md:text-4xl font-black mt-4 mb-3"
              style={{ fontFamily: "Orbitron, monospace", color: "hsl(185 100% 55%)" }}
            >
              HOW IT WORKS
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px -translate-x-px hidden md:block"
              style={{ background: "linear-gradient(to bottom, transparent, hsl(155 100% 50% / 0.4), transparent)" }}
            />

            {[
              {
                step: "01",
                title: "Upload Transaction CSV",
                desc: "Drag & drop or browse your CSV file. The engine validates all 5 required columns and up to 10,000 rows instantly.",
                icon: Upload,
                color: "hsl(155 100% 50%)",
              },
              {
                step: "02",
                title: "Graph Construction",
                desc: "Sender and receiver IDs become nodes. Transactions become directed edges in an in-memory graph built for speed.",
                icon: Network,
                color: "hsl(185 100% 55%)",
              },
              {
                step: "03",
                title: "Fraud Detection Algorithms",
                desc: "Three algorithms run in parallel: cycle detection (DFS), smurfing (sliding windows), and shell chain tracing.",
                icon: Shield,
                color: "hsl(0 84% 60%)",
              },
              {
                step: "04",
                title: "Suspicion Scoring & Export",
                desc: "Accounts are scored 0–100 and sorted. Visualise the graph, inspect the fraud table, and download the JSON report.",
                icon: Download,
                color: "hsl(45 100% 55%)",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`relative flex flex-col md:flex-row gap-6 mb-10 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Content */}
                <div className={`flex-1 ${i % 2 === 1 ? "md:text-right" : ""}`}>
                  <div
                    className="inline-flex items-center gap-3 p-4 rounded border bg-card/60 hover:bg-card transition-colors duration-200 w-full md:w-auto max-w-sm"
                    style={{ borderColor: `${item.color}30` }}
                  >
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}15`, border: `1px solid ${item.color}40` }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground mb-0.5">STEP {item.step}</div>
                      <div className="text-sm font-mono font-bold text-foreground">{item.title}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-1 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                </div>

                {/* Center dot */}
                <div className="hidden md:flex items-center justify-center w-12 shrink-0">
                  <div
                    className="w-4 h-4 rounded-full border-2 z-10"
                    style={{ background: "hsl(220 20% 4%)", borderColor: item.color, boxShadow: `0 0 10px ${item.color}60` }}
                  />
                </div>

                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── LANGUAGES ─────────── */}
      <section id="languages" data-section="languages" className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-mono tracking-widest text-muted-foreground border border-border/40 px-3 py-1 rounded-full">
            // MULTILINGUAL AI
          </span>
          <h2
            className="text-3xl md:text-4xl font-black mt-4 mb-3"
            style={{ fontFamily: "Orbitron, monospace", color: "hsl(155 100% 50%)" }}
          >
            VOICE IN YOUR LANGUAGE
          </h2>
          <p className="text-sm font-mono text-muted-foreground mb-10 max-w-md mx-auto">
            The AI voice assistant understands and speaks 10 Indian languages. Switch at any time from the floating mic panel.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {voiceLanguages.map((lang, i) => (
              <div
                key={lang}
                className="px-4 py-2 rounded border font-mono text-sm transition-all duration-200 hover:scale-105"
                style={{
                  borderColor: i === 0 ? "hsl(155 100% 50%)" : "hsl(155 60% 20%)",
                  background: i === 0 ? "hsl(155 100% 50% / 0.1)" : "hsl(220 20% 7%)",
                  color: i === 0 ? "hsl(155 100% 50%)" : "hsl(150 30% 55%)",
                }}
              >
                {lang}
              </div>
            ))}
          </div>

          {/* Voice feature pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            {[
              { cmd: '"Upload file"', desc: "Triggers file upload dialog" },
              { cmd: '"Show suspicious accounts"', desc: "Navigates to fraud table" },
              { cmd: '"Explain this fraud ring"', desc: "AI explains detected rings" },
              { cmd: '"Download JSON report"', desc: "Exports analysis results" },
              { cmd: '"Switch language to Hindi"', desc: "Changes assistant language" },
              { cmd: '"What is smurfing?"', desc: "Financial crime education" },
            ].map(({ cmd, desc }) => (
              <div
                key={cmd}
                className="p-3 rounded border text-xs font-mono"
                style={{ borderColor: "hsl(155 60% 20%)", background: "hsl(220 20% 7%)" }}
              >
                <span style={{ color: "hsl(155 100% 50%)" }}>{cmd}</span>
                <span className="block text-muted-foreground mt-1">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── TERMINAL ─────────── */}
      <section id="terminal" data-section="terminal" className="relative z-10 py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-mono tracking-widest text-muted-foreground border border-border/40 px-3 py-1 rounded-full">
              // SYSTEM TERMINAL
            </span>
          </div>
          <TerminalWidget />
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Glowing border box */}
          <div
            className="relative p-10 rounded border overflow-hidden"
            style={{
              borderColor: "hsl(155 100% 50% / 0.4)",
              background: "hsl(220 20% 6%)",
              boxShadow: "0 0 60px hsl(155 100% 50% / 0.1), inset 0 0 60px hsl(155 100% 50% / 0.03)",
            }}
          >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: "hsl(155 100% 50%)" }} />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: "hsl(155 100% 50%)" }} />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2" style={{ borderColor: "hsl(155 100% 50%)" }} />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: "hsl(155 100% 50%)" }} />

            <Lock
              className="w-10 h-10 mx-auto mb-5"
              style={{ color: "hsl(155 100% 50%)", filter: "drop-shadow(0 0 10px hsl(155 100% 50% / 0.6))" }}
            />
            <h2
              className="text-2xl md:text-3xl font-black mb-3"
              style={{ fontFamily: "Orbitron, monospace", color: "hsl(155 100% 50%)" }}
            >
              BEGIN INVESTIGATION
            </h2>
            <p className="text-sm font-mono text-muted-foreground mb-8 leading-relaxed">
              Upload your transaction CSV, let the engine analyse for financial crime patterns, and get instant results — suspicious accounts, fraud rings, and a downloadable JSON report.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="group flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-mono font-bold rounded transition-all duration-200 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, hsl(155 100% 50%), hsl(185 100% 45%))",
                  color: "hsl(220 20% 4%)",
                  boxShadow: "0 0 30px hsl(155 100% 50% / 0.4)",
                }}
              >
                <Upload className="w-4 h-4" />
                LAUNCH ENGINE
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-mono font-bold rounded border transition-all duration-200 hover:bg-primary/5"
                style={{ borderColor: "hsl(155 100% 50% / 0.4)", color: "hsl(155 100% 70%)" }}
              >
                LEARN MORE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-border/30 text-center">
        <p className="text-xs font-mono text-muted-foreground/50">
          MONEY MULING DETECTION ENGINE · Financial Crime Analysis Platform · Built for AML Compliance
        </p>
      </footer>

      <VoiceAssistant analysisResult={null} />
    </div>
  );
};

export default Landing;
