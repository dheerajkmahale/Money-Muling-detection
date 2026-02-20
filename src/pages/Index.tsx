import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MatrixRain from "@/components/MatrixRain";
import { CsvUploader } from "@/components/fraud/CsvUploader";
import { GraphVisualization } from "@/components/fraud/GraphVisualization";
import { FraudTable } from "@/components/fraud/FraudTable";
import { SummaryPanel } from "@/components/fraud/SummaryPanel";
import { VoiceAssistant } from "@/components/fraud/VoiceAssistant";
import { Transaction, AnalysisResult } from "@/types/fraud";
import { Shield, Cpu, AlertTriangle, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tab = "graph" | "table" | "summary";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("graph");
  const { toast } = useToast();

  const handleUpload = useCallback(async (transactions: Transaction[]) => {
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-transactions", {
        body: { transactions },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysisResult(data as AnalysisResult);
      setActiveTab("graph");

      toast({
        title: "Analysis Complete",
        description: `Found ${data.summary.suspicious_accounts_count} suspicious accounts across ${data.summary.total_accounts} total accounts.`,
      });
    } catch (err) {
      toast({
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : "Failed to analyze transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const suspiciousSet = new Set(analysisResult?.suspicious_accounts.map(a => a.account_id) || []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "graph", label: "GRAPH VIEW" },
    { id: "table", label: "FRAUD TABLE" },
    { id: "summary", label: "SUMMARY" },
  ];

  return (
    <div className="relative min-h-screen hex-pattern overflow-x-hidden bg-background">
      <MatrixRain />

      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: "var(--gradient-glow)" }} />

      {/* NAV */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b border-border/50 backdrop-blur-sm bg-background/70">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mr-2 px-2 py-1 rounded border border-border/40 hover:border-primary/40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            HOME
          </button>
          <div className="w-7 h-7">
            <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L10 22V55C10 78 28 98 50 108C72 98 90 78 90 55V22L50 5Z" fill="hsl(155 100% 50% / 0.15)" stroke="hsl(155 100% 50%)" strokeWidth="2" />
              <path d="M38 58L46 66L63 49" stroke="hsl(155 100% 50%)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="font-mono text-sm font-bold tracking-widest text-neon" style={{ fontFamily: "Orbitron, monospace", color: "hsl(155 100% 50%)" }}>
              MONEY MULING DETECTION ENGINE
            </div>
            <div className="text-xs font-mono text-muted-foreground tracking-wider">Financial Crime Analysis Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono px-2 py-1 rounded border border-primary/30 bg-primary/5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ background: "hsl(155 100% 50%)" }} />
            <span className="text-muted-foreground">ENGINE:</span>
            <span style={{ color: "hsl(155 100% 50%)" }}>ONLINE</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
        {/* Upload section */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4" style={{ color: "hsl(155 100% 50%)" }} />
            <span className="text-xs font-mono tracking-widest text-muted-foreground">// TRANSACTION UPLOAD</span>
          </div>
          <div className="bg-card/40 border border-border/50 rounded-lg p-4 backdrop-blur-sm">
            <CsvUploader onUpload={handleUpload} isLoading={isLoading} />
          </div>
        </section>

        {/* Results section */}
        {(analysisResult || isLoading) && (
          <section>
            {/* Tabs */}
            <div className="flex items-center gap-0 border-b border-border/50 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-xs font-mono tracking-wider border-b-2 transition-colors duration-150 -mb-px ${
                    activeTab === tab.id
                      ? "border-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === tab.id ? { color: "hsl(155 100% 50%)", borderColor: "hsl(155 100% 50%)" } : {}}
                >
                  {tab.label}
                  {tab.id === "table" && analysisResult && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: "hsl(0 84% 60% / 0.2)", color: "hsl(0 84% 60%)", fontSize: "10px" }}>
                      {analysisResult.suspicious_accounts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "graph" && (
              <div className="bg-card/40 border border-border/50 rounded-lg overflow-hidden" style={{ height: "550px" }}>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(155 100% 50%)", borderTopColor: "transparent" }} />
                    <p className="text-sm font-mono" style={{ color: "hsl(155 100% 50%)" }}>Running fraud detection algorithms...</p>
                    <p className="text-xs font-mono text-muted-foreground">Detecting cycles · Smurfing · Shell chains</p>
                  </div>
                ) : analysisResult ? (
                  <GraphVisualization
                    nodes={analysisResult.graph.nodes}
                    edges={analysisResult.graph.edges}
                    suspiciousSet={suspiciousSet}
                  />
                ) : null}
              </div>
            )}

            {activeTab === "table" && analysisResult && (
              <div className="bg-card/40 border border-border/50 rounded-lg p-4 backdrop-blur-sm" style={{ minHeight: "500px" }}>
                <FraudTable
                  suspiciousAccounts={analysisResult.suspicious_accounts}
                  fraudRings={analysisResult.fraud_rings}
                />
              </div>
            )}

            {activeTab === "summary" && analysisResult && (
              <div className="bg-card/40 border border-border/50 rounded-lg p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4" style={{ color: "hsl(0 84% 60%)" }} />
                  <span className="text-xs font-mono tracking-widest text-muted-foreground">// ANALYSIS SUMMARY</span>
                </div>
                <SummaryPanel result={analysisResult} />
              </div>
            )}
          </section>
        )}

        {/* Landing state - no data */}
        {!analysisResult && !isLoading && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Shield,
                title: "Cycle Detection",
                desc: "Detects circular routing patterns (3–5 hops) that form fraud rings between accounts.",
                badge: "CYCLES",
              },
              {
                icon: AlertTriangle,
                title: "Smurfing Detection",
                desc: "Identifies fan-in (10+ senders → 1 receiver) and fan-out patterns within 72-hour windows.",
                badge: "SMURF",
              },
              {
                icon: Cpu,
                title: "Shell Chain Analysis",
                desc: "Traces layered shell account chains with intermediaries having only 2–3 transactions.",
                badge: "SHELL",
              },
            ].map(({ icon: Icon, title, desc, badge }) => (
              <div key={title} className="bg-card/30 border border-border/40 rounded-lg p-5 hover:bg-card/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-5 h-5" style={{ color: "hsl(155 100% 50%)" }} />
                  <span className="text-xs font-mono px-2 py-0.5 rounded border border-border/40 text-muted-foreground">{badge}</span>
                </div>
                <h3 className="text-sm font-mono font-bold text-foreground mb-2">{title}</h3>
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <VoiceAssistant analysisResult={analysisResult} />
    </div>
  );
};

export default Index;
