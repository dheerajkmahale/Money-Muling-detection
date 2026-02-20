import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Transaction {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: string;
}

interface GraphNode {
  id: string;
  outEdges: string[];
  inEdges: string[];
  transactions: Transaction[];
}

function buildGraph(transactions: Transaction[]): Map<string, GraphNode> {
  const graph = new Map<string, GraphNode>();

  const ensureNode = (id: string) => {
    if (!graph.has(id)) {
      graph.set(id, { id, outEdges: [], inEdges: [], transactions: [] });
    }
  };

  for (const tx of transactions) {
    ensureNode(tx.sender_id);
    ensureNode(tx.receiver_id);
    graph.get(tx.sender_id)!.outEdges.push(tx.receiver_id);
    graph.get(tx.receiver_id)!.inEdges.push(tx.sender_id);
    graph.get(tx.sender_id)!.transactions.push(tx);
  }

  return graph;
}

// Detect cycles of length 3–5 using DFS
function detectCycles(graph: Map<string, GraphNode>): string[][] {
  const cycles: string[][] = [];
  const nodes = Array.from(graph.keys());

  for (const startNode of nodes) {
    // DFS from each node looking for cycles of length 3-5
    const dfs = (path: string[], visited: Set<string>) => {
      if (path.length > 5) return;
      const current = path[path.length - 1];
      const node = graph.get(current);
      if (!node) return;

      for (const neighbor of node.outEdges) {
        if (neighbor === startNode && path.length >= 3) {
          // Found a cycle
          const cycle = [...path];
          // Normalize cycle to avoid duplicates
          const minIdx = cycle.indexOf(cycle.reduce((a, b) => a < b ? a : b));
          const normalized = [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
          const key = normalized.join(",");
          const alreadyExists = cycles.some(c => c.join(",") === key);
          if (!alreadyExists) {
            cycles.push(normalized);
          }
          continue;
        }
        if (!visited.has(neighbor) && neighbor >= startNode) {
          visited.add(neighbor);
          dfs([...path, neighbor], visited);
          visited.delete(neighbor);
        }
      }
    };

    dfs([startNode], new Set([startNode]));
  }

  return cycles;
}

// Smurfing: fan-in (10+ senders → 1 receiver) or fan-out (1 sender → 10+ receivers) within 72 hours
function detectSmurfing(transactions: Transaction[]): {
  fanIn: { receiver: string; senders: string[]; count: number }[];
  fanOut: { sender: string; receivers: string[]; count: number }[];
} {
  const windowMs = 72 * 60 * 60 * 1000;
  const txByTime = transactions.map(tx => ({ ...tx, ts: new Date(tx.timestamp).getTime() }));

  const fanIn: { receiver: string; senders: string[]; count: number }[] = [];
  const fanOut: { sender: string; receivers: string[]; count: number }[] = [];

  // Fan-in: group by receiver, find windows with 10+ unique senders
  const byReceiver = new Map<string, typeof txByTime>();
  for (const tx of txByTime) {
    if (!byReceiver.has(tx.receiver_id)) byReceiver.set(tx.receiver_id, []);
    byReceiver.get(tx.receiver_id)!.push(tx);
  }

  for (const [receiver, txs] of byReceiver) {
    txs.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < txs.length; i++) {
      const window = txs.filter(t => t.ts >= txs[i].ts && t.ts <= txs[i].ts + windowMs);
      const uniqueSenders = [...new Set(window.map(t => t.sender_id))];
      if (uniqueSenders.length >= 10) {
        const exists = fanIn.some(fi => fi.receiver === receiver);
        if (!exists) {
          fanIn.push({ receiver, senders: uniqueSenders, count: uniqueSenders.length });
        }
        break;
      }
    }
  }

  // Fan-out: group by sender, find windows with 10+ unique receivers
  const bySender = new Map<string, typeof txByTime>();
  for (const tx of txByTime) {
    if (!bySender.has(tx.sender_id)) bySender.set(tx.sender_id, []);
    bySender.get(tx.sender_id)!.push(tx);
  }

  for (const [sender, txs] of bySender) {
    txs.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < txs.length; i++) {
      const window = txs.filter(t => t.ts >= txs[i].ts && t.ts <= txs[i].ts + windowMs);
      const uniqueReceivers = [...new Set(window.map(t => t.receiver_id))];
      if (uniqueReceivers.length >= 10) {
        const exists = fanOut.some(fo => fo.sender === sender);
        if (!exists) {
          fanOut.push({ sender, receivers: uniqueReceivers, count: uniqueReceivers.length });
        }
        break;
      }
    }
  }

  return { fanIn, fanOut };
}

// Shell chain: chains of 3+ hops where intermediates have only 2-3 total transactions
function detectShellChains(graph: Map<string, GraphNode>, transactions: Transaction[]): string[][] {
  const txCountByAccount = new Map<string, number>();
  for (const tx of transactions) {
    txCountByAccount.set(tx.sender_id, (txCountByAccount.get(tx.sender_id) || 0) + 1);
    txCountByAccount.set(tx.receiver_id, (txCountByAccount.get(tx.receiver_id) || 0) + 1);
  }

  const isShell = (id: string) => {
    const count = txCountByAccount.get(id) || 0;
    return count >= 2 && count <= 3;
  };

  const chains: string[][] = [];

  // DFS to find chains where intermediates are shell accounts
  const dfs = (path: string[], visited: Set<string>) => {
    if (path.length >= 3) {
      // Check intermediates (all except first and last) are shells
      const intermediates = path.slice(1, -1);
      if (intermediates.every(n => isShell(n))) {
        chains.push([...path]);
      }
    }

    if (path.length >= 6) return; // Limit chain length

    const current = path[path.length - 1];
    const node = graph.get(current);
    if (!node) return;

    for (const neighbor of node.outEdges) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        dfs([...path, neighbor], visited);
        visited.delete(neighbor);
      }
    }
  };

  for (const nodeId of graph.keys()) {
    const visited = new Set([nodeId]);
    dfs([nodeId], visited);
  }

  // Deduplicate and keep longest unique chains
  const uniqueChains: string[][] = [];
  for (const chain of chains) {
    const key = chain.join(",");
    const isSubchain = uniqueChains.some(c => c.join(",").includes(key));
    if (!isSubchain) {
      uniqueChains.push(chain);
    }
  }

  return uniqueChains.slice(0, 100); // Limit output
}

// Score accounts 0-100
function scoreAccounts(
  graph: Map<string, GraphNode>,
  cycles: string[][],
  smurfing: ReturnType<typeof detectSmurfing>,
  shellChains: string[][],
  transactions: Transaction[]
): { account_id: string; score: number; reasons: string[] }[] {
  const scores = new Map<string, { score: number; reasons: string[] }>();

  const ensureScore = (id: string) => {
    if (!scores.has(id)) scores.set(id, { score: 0, reasons: [] });
  };

  // Cycle participation (+30 per cycle)
  for (const cycle of cycles) {
    for (const node of cycle) {
      ensureScore(node);
      const s = scores.get(node)!;
      s.score += 30;
      if (!s.reasons.includes("Cycle participant")) s.reasons.push("Cycle participant");
    }
  }

  // Fan-in (+25)
  for (const fi of smurfing.fanIn) {
    ensureScore(fi.receiver);
    const s = scores.get(fi.receiver)!;
    s.score += 25;
    s.reasons.push(`Fan-in receiver (${fi.count} senders)`);
    for (const sender of fi.senders) {
      ensureScore(sender);
      const ss = scores.get(sender)!;
      ss.score += 10;
      if (!ss.reasons.includes("Fan-in participant")) ss.reasons.push("Fan-in participant");
    }
  }

  // Fan-out (+25)
  for (const fo of smurfing.fanOut) {
    ensureScore(fo.sender);
    const s = scores.get(fo.sender)!;
    s.score += 25;
    s.reasons.push(`Fan-out sender (${fo.count} receivers)`);
  }

  // Shell chain (+20 per chain node)
  for (const chain of shellChains) {
    for (const node of chain) {
      ensureScore(node);
      const s = scores.get(node)!;
      s.score += 20;
      if (!s.reasons.includes("Shell chain node")) s.reasons.push("Shell chain node");
    }
  }

  // High transaction velocity: compute tx per hour
  const txCountByAccount = new Map<string, number>();
  const txTimestamps = new Map<string, number[]>();
  for (const tx of transactions) {
    txCountByAccount.set(tx.sender_id, (txCountByAccount.get(tx.sender_id) || 0) + 1);
    txCountByAccount.set(tx.receiver_id, (txCountByAccount.get(tx.receiver_id) || 0) + 1);
    if (!txTimestamps.has(tx.sender_id)) txTimestamps.set(tx.sender_id, []);
    txTimestamps.get(tx.sender_id)!.push(new Date(tx.timestamp).getTime());
  }

  for (const [account, timestamps] of txTimestamps) {
    if (timestamps.length < 2) continue;
    timestamps.sort((a, b) => a - b);
    const span = (timestamps[timestamps.length - 1] - timestamps[0]) / 3600000; // hours
    if (span > 0) {
      const velocity = timestamps.length / span;
      if (velocity > 5) {
        ensureScore(account);
        const s = scores.get(account)!;
        s.score += Math.min(20, Math.floor(velocity * 2));
        s.reasons.push(`High velocity (${velocity.toFixed(1)} tx/hr)`);
      }
    }
  }

  // Shell account characteristic: 2-3 tx total
  for (const [account, count] of txCountByAccount) {
    if (count >= 2 && count <= 3) {
      ensureScore(account);
      const s = scores.get(account)!;
      s.score += 15;
      if (!s.reasons.includes("Shell account (low tx count)")) s.reasons.push("Shell account (low tx count)");
    }
  }

  // Cap at 100
  const result = [];
  for (const [account_id, { score, reasons }] of scores) {
    if (score > 5) { // Only include accounts with meaningful scores
      result.push({ account_id, score: Math.min(100, score), reasons });
    }
  }

  return result.sort((a, b) => b.score - a.score);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions } = await req.json() as { transactions: Transaction[] };

    if (!transactions || !Array.isArray(transactions)) {
      return new Response(JSON.stringify({ error: "Invalid transactions data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (transactions.length > 10000) {
      return new Response(JSON.stringify({ error: "Maximum 10,000 transactions allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build graph
    const graph = buildGraph(transactions);

    // Detect fraud patterns
    const cycles = detectCycles(graph);
    const smurfing = detectSmurfing(transactions);
    const shellChains = detectShellChains(graph, transactions);
    const suspiciousAccounts = scoreAccounts(graph, cycles, smurfing, shellChains, transactions);

    // Build fraud rings from cycles
    const fraudRings = cycles.map((cycle, i) => ({
      ring_id: `RING-${String(i + 1).padStart(3, "0")}`,
      accounts: cycle,
      cycle_length: cycle.length,
      type: "circular_routing",
    }));

    // Build graph nodes and edges for visualization
    const allNodes = Array.from(graph.keys());
    const suspiciousSet = new Set(suspiciousAccounts.map(a => a.account_id));
    const graphNodes = allNodes.map(id => ({
      id,
      suspicious: suspiciousSet.has(id),
      score: suspiciousAccounts.find(a => a.account_id === id)?.score || 0,
    }));

    const graphEdges = transactions.slice(0, 2000).map(tx => ({
      source: tx.sender_id,
      target: tx.receiver_id,
      amount: tx.amount,
      transaction_id: tx.transaction_id,
    }));

    const summary = {
      total_transactions: transactions.length,
      total_accounts: graph.size,
      suspicious_accounts_count: suspiciousAccounts.length,
      fraud_rings_detected: fraudRings.length,
      smurfing_fan_in_detected: smurfing.fanIn.length,
      smurfing_fan_out_detected: smurfing.fanOut.length,
      shell_chains_detected: shellChains.length,
      analysis_timestamp: new Date().toISOString(),
    };

    const result = {
      suspicious_accounts: suspiciousAccounts,
      fraud_rings: fraudRings,
      smurfing: smurfing,
      shell_chains: shellChains.slice(0, 50),
      graph: { nodes: graphNodes, edges: graphEdges },
      summary,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
