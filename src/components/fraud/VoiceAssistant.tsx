import React, { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from "@/types/fraud";
import { useNavigate } from "react-router-dom";

const LANGUAGES = [
  { code: "en", label: "English", voice: "en-IN" },
  { code: "hi", label: "हिन्दी", voice: "hi-IN" },
  { code: "te", label: "తెలుగు", voice: "te-IN" },
  { code: "ta", label: "தமிழ்", voice: "ta-IN" },
  { code: "kn", label: "ಕನ್ನಡ", voice: "kn-IN" },
  { code: "ml", label: "മലയാളം", voice: "ml-IN" },
  { code: "mr", label: "मराठी", voice: "mr-IN" },
  { code: "bn", label: "বাংলা", voice: "bn-IN" },
  { code: "gu", label: "ગુજરાતી", voice: "gu-IN" },
  { code: "pa", label: "ਪੰਜਾਬੀ", voice: "pa-IN" },
];

interface VoiceAssistantProps {
  analysisResult: AnalysisResult | null;
}

type Status = "idle" | "listening" | "processing" | "speaking";

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ analysisResult }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [language, setLanguage] = useState("en");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [muted, setMuted] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (muted || !synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const lang = LANGUAGES.find(l => l.code === language);
    utt.lang = lang?.voice || "en-IN";
    utt.rate = 0.9;
    utt.onstart = () => setStatus("speaking");
    utt.onend = () => setStatus("idle");
    utt.onerror = () => setStatus("idle");
    synthRef.current.speak(utt);
  }, [language, muted]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setStatus("processing");

    try {
      const context = analysisResult ? {
        total_transactions: analysisResult.summary.total_transactions,
        suspicious_accounts: analysisResult.summary.suspicious_accounts_count,
        fraud_rings: analysisResult.summary.fraud_rings_detected,
        top_suspects: analysisResult.suspicious_accounts.slice(0, 3).map(a => ({
          id: a.account_id, score: a.score, reasons: a.reasons
        })),
      } : null;

      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { message: text, language, context },
      });

      if (error) throw error;

      const replyText = data?.reply || "I couldn't process that. Please try again.";
      setReply(replyText);
      setMessages(prev => [...prev, { role: "assistant", text: replyText }]);
      speak(replyText);
    } catch (err) {
      const errMsg = "Sorry, I encountered an error. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", text: errMsg }]);
      setStatus("idle");
    }
  }, [analysisResult, language, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      sendMessage("Hello, how can I use this app?");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    const lang = LANGUAGES.find(l => l.code === language);
    recognition.lang = lang?.voice || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setStatus("listening");
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        setTranscript("");
        sendMessage(t);
      }
    };
    recognition.onerror = () => setStatus("idle");
    recognition.onend = () => {
      if (status === "listening") setStatus("idle");
    };
    recognition.start();
  }, [language, sendMessage, status]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    synthRef.current?.cancel();
    setStatus("idle");
    setTranscript("");
  }, []);

  const statusColors: Record<Status, string> = {
    idle: "hsl(155 100% 50%)",
    listening: "hsl(185 100% 55%)",
    processing: "hsl(45 100% 55%)",
    speaking: "hsl(155 100% 50%)",
  };

  const statusLabels: Record<Status, string> = {
    idle: "Ready",
    listening: "Listening...",
    processing: "Processing...",
    speaking: "Speaking...",
  };

  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110"
        style={{
          background: "linear-gradient(135deg, hsl(155 100% 40%), hsl(185 100% 45%))",
          boxShadow: "0 0 20px hsl(155 100% 50% / 0.4)",
        }}
      >
        <Mic className="w-6 h-6 text-black" />
        {status !== "idle" && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse border-2 border-background"
            style={{ background: statusColors[status] }}
          />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 rounded-lg border border-border/60 shadow-2xl overflow-hidden"
          style={{ background: "hsl(220 20% 7%)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40" style={{ background: "hsl(220 20% 9%)" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColors[status] }} />
              <span className="text-xs font-mono font-bold" style={{ color: "hsl(155 100% 50%)" }}>
                AI VOICE ASSISTANT
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Language selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(m => !m)}
                  className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/40"
                >
                  {currentLang?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 top-7 z-50 w-40 rounded-md border border-border/60 shadow-xl overflow-hidden" style={{ background: "hsl(220 20% 10%)" }}>
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors hover:bg-primary/10 ${language === lang.code ? "text-primary" : "text-muted-foreground"}`}
                        style={language === lang.code ? { color: "hsl(155 100% 50%)" } : {}}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setMuted(m => !m)} className="text-muted-foreground hover:text-foreground transition-colors">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div
            className="px-4 py-1.5 text-xs font-mono text-center"
            style={{ background: `${statusColors[status]}15`, color: statusColors[status] }}
          >
            {transcript || statusLabels[status]}
          </div>

          {/* Messages */}
          <div className="h-48 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {messages.length === 0 && (
              <div className="text-center text-xs font-mono text-muted-foreground/50 mt-4">
                <p>Press the mic and ask:</p>
                <p className="mt-1">"Explain this fraud ring"</p>
                <p>"Show suspicious accounts"</p>
                <p>"How do I upload a file?"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] px-3 py-2 rounded-lg text-xs font-mono leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: "hsl(155 100% 50% / 0.15)", color: "hsl(155 100% 70%)", border: "1px solid hsl(155 100% 50% / 0.3)" }
                      : { background: "hsl(220 20% 14%)", color: "hsl(0 0% 80%)", border: "1px solid hsl(220 20% 20%)" }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 p-3 border-t border-border/40">
            <button
              onClick={status === "listening" ? stopListening : startListening}
              disabled={status === "processing" || status === "speaking"}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-mono font-bold transition-all duration-200 disabled:opacity-40"
              style={
                status === "listening"
                  ? { background: "hsl(0 84% 60% / 0.2)", border: "1px solid hsl(0 84% 60%)", color: "hsl(0 84% 60%)" }
                  : { background: "hsl(155 100% 50% / 0.15)", border: "1px solid hsl(155 100% 50%)", color: "hsl(155 100% 50%)" }
              }
            >
              {status === "listening" ? <><MicOff className="w-4 h-4" /> STOP</> : <><Mic className="w-4 h-4" /> SPEAK</>}
            </button>
          </div>

          {/* Quick commands */}
          <div className="px-3 pb-3 flex flex-wrap gap-1">
            {["Upload file", "Show suspects", "Download report", "Explain fraud ring"].map(cmd => (
              <button
                key={cmd}
                onClick={() => sendMessage(cmd)}
                disabled={status === "listening" || status === "processing"}
                className="text-xs font-mono px-2 py-1 rounded border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
