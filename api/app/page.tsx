import { Redis } from "@upstash/redis";
export const dynamic = "force-dynamic";
const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
import { list } from "@vercel/blob";

interface DashboardData {
  pendingCount: number;
  lastSync: string | null;
  totalArchived: number;
  blobUsedBytes: number;
  staleFiles: number;
}

async function getDashboardData(): Promise<DashboardData> {
  const [pendingIds, lastSync, totalArchived, blobResult] = await Promise.all([
    kv.smembers("pending_files") as Promise<string[]>,
    kv.get<string>("stats:last_sync"),
    kv.get<number>("stats:total_archived"),
    list(),
  ]);

  // Check for stale files (pending > 14 days)
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  let staleFiles = 0;

  if (pendingIds && pendingIds.length > 0) {
    const records = await Promise.all(
      pendingIds.map((id) =>
        kv.hgetall(`file:${id}`) as Promise<{ uploadedAt: string } | null>
      )
    );
    staleFiles = records.filter((r) => {
      if (!r) return false;
      return Date.now() - new Date(r.uploadedAt).getTime() > FOURTEEN_DAYS_MS;
    }).length;
  }

  const blobUsedBytes = blobResult.blobs.reduce((sum, b) => sum + b.size, 0);

  return {
    pendingCount: pendingIds?.length ?? 0,
    lastSync,
    totalArchived: totalArchived ?? 0,
    blobUsedBytes,
    staleFiles,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const blobUsedMB = data.blobUsedBytes / (1024 * 1024);
  const blobPercent = Math.min((blobUsedMB / 500) * 100, 100);

  return (
    <>
      <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --bg: #0a0a0a;
            --surface: #111;
            --surface2: #1a1a1a;
            --border: #222;
            --accent: #00e5ff;
            --accent-dim: rgba(0, 229, 255, 0.12);
            --accent-warn: #ffaa00;
            --accent-ok: #00e676;
            --text: #f0f0f0;
            --text-muted: #666;
            --mono: 'Space Mono', monospace;
            --sans: 'DM Sans', sans-serif;
          }

          body {
            background: var(--bg);
            color: var(--text);
            font-family: var(--sans);
            min-height: 100vh;
            padding: 48px 24px;
          }

          .container {
            max-width: 860px;
            margin: 0 auto;
          }

          header {
            display: flex;
            align-items: baseline;
            gap: 16px;
            margin-bottom: 56px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 24px;
          }

          .logo {
            font-family: var(--mono);
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: -0.03em;
            color: var(--accent);
          }

          .logo span {
            color: var(--text-muted);
            font-weight: 400;
          }

          .tagline {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-family: var(--mono);
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 32px;
          }

          @media (max-width: 600px) {
            .grid { grid-template-columns: 1fr; }
          }

          .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 2px;
            padding: 24px;
            position: relative;
            overflow: hidden;
          }

          .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, var(--accent) 0%, transparent 60%);
            opacity: 0.4;
          }

          .card-label {
            font-family: var(--mono);
            font-size: 0.65rem;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 12px;
          }

          .card-value {
            font-family: var(--mono);
            font-size: 2.8rem;
            font-weight: 700;
            line-height: 1;
            color: var(--text);
          }

          .card-value.accent { color: var(--accent); }
          .card-value.warn { color: var(--accent-warn); }
          .card-value.ok { color: var(--accent-ok); }

          .card-sub {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 8px;
            font-family: var(--mono);
          }

          .card-wide {
            grid-column: 1 / -1;
          }

          .progress-bar {
            width: 100%;
            height: 3px;
            background: var(--border);
            border-radius: 2px;
            margin-top: 16px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            border-radius: 2px;
            background: var(--accent);
            transition: width 0.6s ease;
          }

          .progress-fill.warn { background: var(--accent-warn); }

          .stale-alert {
            background: rgba(255, 170, 0, 0.07);
            border: 1px solid rgba(255, 170, 0, 0.25);
            border-radius: 2px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 32px;
            font-family: var(--mono);
            font-size: 0.8rem;
            color: var(--accent-warn);
          }

          .stale-alert .dot {
            width: 6px; height: 6px;
            background: var(--accent-warn);
            border-radius: 50%;
            flex-shrink: 0;
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }

          .status-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px 0;
            border-bottom: 1px solid var(--border);
            font-family: var(--mono);
            font-size: 0.78rem;
          }

          .status-row:last-child { border-bottom: none; }

          .status-dot {
            width: 5px; height: 5px;
            border-radius: 50%;
            background: var(--accent);
            flex-shrink: 0;
          }

          .status-key { color: var(--text-muted); flex: 0 0 200px; }
          .status-val { color: var(--text); }

          footer {
            margin-top: 64px;
            font-family: var(--mono);
            font-size: 0.65rem;
            color: var(--text-muted);
            letter-spacing: 0.08em;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid var(--border);
            padding-top: 20px;
          }
        `}</style>
      <div className="container">
        <header>
          <div className="logo">PIXEL<span>_</span>VAULT</div>
          <div className="tagline">archive relay — v2.0</div>
        </header>

        {data.staleFiles > 0 && (
          <div className="stale-alert">
            <div className="dot" />
            {data.staleFiles} file{data.staleFiles > 1 ? "s" : ""} have been pending for over 14 days — sync your Pixel XL soon.
          </div>
        )}

        <div className="grid">
          <div className="card">
            <div className="card-label">Pending Files</div>
            <div className={`card-value ${data.pendingCount > 0 ? "accent" : "ok"}`}>
              {data.pendingCount}
            </div>
            <div className="card-sub">waiting on relay</div>
          </div>

          <div className="card">
            <div className="card-label">Total Archived</div>
            <div className="card-value">{data.totalArchived}</div>
            <div className="card-sub">confirmed to Google Photos</div>
          </div>

          <div className="card">
            <div className="card-label">Last Sync</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "1rem", fontWeight: 700, marginTop: 4 }}>
              {formatDate(data.lastSync)}
            </div>
            <div className="card-sub">most recent confirm call</div>
          </div>

          <div className="card">
            <div className="card-label">Stale Files</div>
            <div className={`card-value ${data.staleFiles > 0 ? "warn" : "ok"}`}>
              {data.staleFiles}
            </div>
            <div className="card-sub">pending &gt; 14 days</div>
          </div>

          <div className="card card-wide">
            <div className="card-label">Blob Relay Storage</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div className={`card-value ${blobPercent > 80 ? "warn" : ""}`} style={{ fontSize: "1.8rem" }}>
                {formatBytes(data.blobUsedBytes)}
              </div>
              <div className="card-sub" style={{ marginTop: 0 }}>/ 500 MB free tier</div>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${blobPercent > 80 ? "warn" : ""}`}
                style={{ width: `${blobPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-label" style={{ marginBottom: 4 }}>System Status</div>
          <div className="status-row">
            <div className="status-dot" />
            <div className="status-key">relay endpoint</div>
            <div className="status-val">vercel hobby — active</div>
          </div>
          <div className="status-row">
            <div className="status-dot" />
            <div className="status-key">blob store</div>
            <div className="status-val">transient — clears on confirm</div>
          </div>
          <div className="status-row">
            <div className="status-dot" />
            <div className="status-key">kv store</div>
            <div className="status-val">active — tracking {data.totalArchived + data.pendingCount} total records</div>
          </div>
          <div className="status-row">
            <div className="status-dot" style={{ background: "var(--text-muted)" }} />
            <div className="status-key">archive device</div>
            <div className="status-val">google pixel xl — manual sync</div>
          </div>
        </div>

        <footer>
          <span>github.com/MenaceHecker/pixel-vault</span>
          <span>rendered {new Date().toUTCString()}</span>
        </footer>
      </div>
    </>
  );
}
