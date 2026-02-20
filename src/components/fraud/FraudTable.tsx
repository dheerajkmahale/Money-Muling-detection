import React from "react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { SuspiciousAccount, FraudRing } from "@/types/fraud";

interface FraudTableProps {
  suspiciousAccounts: SuspiciousAccount[];
  fraudRings: FraudRing[];
}

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color =
    score >= 70
      ? { bg: "hsl(0 84% 60% / 0.15)", border: "hsl(0 84% 60% / 0.4)", text: "hsl(0 84% 60%)" }
      : score >= 40
      ? { bg: "hsl(45 100% 55% / 0.15)", border: "hsl(45 100% 55% / 0.4)", text: "hsl(45 100% 55%)" }
      : { bg: "hsl(210 100% 60% / 0.15)", border: "hsl(210 100% 60% / 0.4)", text: "hsl(210 100% 60%)" };

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-xs font-mono font-bold"
      style={{ background: color.bg, borderColor: color.border, color: color.text }}
    >
      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color.text }} />
      {score}
    </div>
  );
};

export const FraudTable: React.FC<FraudTableProps> = ({ suspiciousAccounts, fraudRings }) => {
  const [activeTab, setActiveTab] = React.useState<"accounts" | "rings">("accounts");

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-0 border-b border-border/50 mb-4">
        {(["accounts", "rings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-mono tracking-wider transition-colors duration-150 border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === tab ? { color: "hsl(155 100% 50%)", borderColor: "hsl(155 100% 50%)" } : {}}
          >
            {tab === "accounts" ? `SUSPICIOUS ACCOUNTS (${suspiciousAccounts.length})` : `FRAUD RINGS (${fraudRings.length})`}
          </button>
        ))}
      </div>

      {activeTab === "accounts" && (
        <div className="overflow-auto flex-1">
          {suspiciousAccounts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground font-mono text-sm">
              No suspicious accounts detected
            </div>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 text-muted-foreground font-normal tracking-wider">#</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-normal tracking-wider">ACCOUNT ID</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-normal tracking-wider">SCORE</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-normal tracking-wider">FLAGS</th>
                </tr>
              </thead>
              <tbody>
                {suspiciousAccounts.map((account, i) => (
                  <tr
                    key={account.account_id}
                    className="border-b border-border/20 hover:bg-primary/5 transition-colors"
                  >
                    <td className="py-2 px-3 text-muted-foreground/60">{i + 1}</td>
                    <td className="py-2 px-3 text-foreground font-bold">{account.account_id}</td>
                    <td className="py-2 px-3 text-center">
                      <ScoreBadge score={account.score} />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {account.reasons.map((r, ri) => (
                          <span
                            key={ri}
                            className="px-1.5 py-0.5 rounded text-muted-foreground bg-muted/30 border border-border/30"
                            style={{ fontSize: "10px" }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "rings" && (
        <div className="overflow-auto flex-1">
          {fraudRings.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground font-mono text-sm">
              No fraud rings detected
            </div>
          ) : (
            <div className="space-y-3">
              {fraudRings.map((ring) => (
                <div
                  key={ring.ring_id}
                  className="p-3 rounded-md border border-border/40 bg-card/30 hover:bg-card/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: "hsl(0 84% 60%)" }} />
                      <span className="text-xs font-mono font-bold" style={{ color: "hsl(0 84% 60%)" }}>
                        {ring.ring_id}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {ring.cycle_length}-hop cycle
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ring.accounts.map((acc, i) => (
                      <React.Fragment key={acc}>
                        <span className="text-xs font-mono px-2 py-0.5 rounded border border-border/40 bg-muted/20 text-foreground">
                          {acc}
                        </span>
                        {i < ring.accounts.length - 1 && (
                          <TrendingUp className="w-3 h-3 text-muted-foreground/50 rotate-90" />
                        )}
                      </React.Fragment>
                    ))}
                    <span className="text-xs font-mono text-muted-foreground/50">→ cycle back</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
