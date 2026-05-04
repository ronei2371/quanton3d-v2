import { useState, useEffect } from "react";

export default function ModoKiosk() {
  const [params, setParams] = useState({
    resina: "ABS-like",
    impressora: "Saturn 3 Ultra 12K",
    exposicao: 2.8,
    exposicaoBottom: 16.8,
    liftSpeed: 65,
    restTime: 1,
    camada: 0.05,
    camadasBottom: 6,
    antiAliasing: "4x",
    totalCamadas: 320,
    tempoTotalMin: 160,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(params);
  const [camadaAtual, setCamadaAtual] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [temp, setTemp] = useState(24);
  const [hora, setHora] = useState("");
  const [agoraMs, setAgoraMs] = useState(() => Date.now());

  const totalSecs = params.tempoTotalMin * 60;

  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");
      setHora(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
      setAgoraMs(now.getTime());
      setTemp(22 + Math.round(Math.sin(now.getTime() / 60000) * 3));
      if (!paused) {
        setElapsed(e => {
          const next = e + 1;
          setCamadaAtual(Math.min(params.totalCamadas, Math.floor(next / (totalSecs / params.totalCamadas))));
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [paused, params, totalSecs]);

  const pct = Math.round((camadaAtual / params.totalCamadas) * 100);
  const remSecs = Math.max(0, totalSecs - elapsed);
  const remMin = Math.floor(remSecs / 60);
  const remSec = remSecs % 60;
  const finish = new Date(agoraMs + remSecs * 1000);
  const pad = n => String(n).padStart(2, "0");
  const etaStr = `${pad(finish.getHours())}:${pad(finish.getMinutes())}`;
  const concluido = camadaAtual >= params.totalCamadas;

  const statusColor = concluido ? "#00ff88" : paused ? "#ffaa00" : "#00ff88";
  const statusLabel = concluido ? "CONCLUÍDO" : paused ? "PAUSADO" : "IMPRIMINDO";

  const salvar = () => { setParams(draft); setEditing(false); setCamadaAtual(0); setElapsed(0); setPaused(false); };

  return (
    <div style={s.kiosk}>
      {/* Top bar */}
      <div style={s.topBar}>
        <span style={s.logo}>QUANTON3D — MODO KIOSK</span>
        <span style={s.clock}>{hora}</span>
      </div>

      {/* Status */}
      <div style={s.statusRow}>
        <div style={{ ...s.dot, background: statusColor, animation: concluido || paused ? "none" : "pulse 2s infinite" }} />
        <span style={{ ...s.statusText, color: statusColor }}>{statusLabel}</span>
        <span style={s.printerName}>{params.impressora}</span>
      </div>

      {/* Progresso */}
      <div style={s.progressWrap}>
        <div style={s.progressHeader}>
          <span style={s.progressLabel}>PROGRESSO DA IMPRESSÃO</span>
          <span style={s.progressPct}>{pct}%</span>
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${pct}%` }} />
        </div>
        <div style={s.progressLayers}>
          Camada {camadaAtual} de {params.totalCamadas}
        </div>
      </div>

      {/* Métricas */}
      <div style={s.metricsGrid}>
        <MetricCard label="Exposição" value={params.exposicao} unit="seg / camada" color="cyan" />
        <MetricCard label="Bottom exp." value={params.exposicaoBottom} unit="seg / camada" color="cyan" />
        <MetricCard label="Lift speed" value={params.liftSpeed} unit="mm / min" color="green" />
        <MetricCard label="Temperatura" value={temp} unit="°C ambiente" color={temp > 28 ? "warn" : temp < 18 ? "cyan" : "green"} />
      </div>

      {/* Bottom row */}
      <div style={s.bottomRow}>
        <div style={s.infoCard}>
          <p style={s.infoTitle}>PARÂMETROS ATIVOS</p>
          <InfoRow label="Resina" value={params.resina} />
          <InfoRow label="Camada" value={`${params.camada} mm`} />
          <InfoRow label="Camadas bottom" value={params.camadasBottom} />
          <InfoRow label="Rest time" value={`${params.restTime} s`} />
          <InfoRow label="Anti-aliasing" value={params.antiAliasing} />
        </div>
        <div style={s.infoCard}>
          <p style={s.infoTitle}>PREVISÃO DE TÉRMINO</p>
          <p style={s.etaBig}>{etaStr}</p>
          <p style={s.etaSub}>hoje às {etaStr}</p>
          <div style={{ marginTop: 10 }}>
            <InfoRow label="Tempo restante" value={`${remMin}min ${remSec}s`} />
            <InfoRow label="Tempo total est." value={`${params.tempoTotalMin}min`} />
          </div>
        </div>
      </div>

      {/* Botões */}
      <div style={s.ctrlRow}>
        <button style={s.btn} onClick={() => setPaused(p => !p)}>
          {paused ? "▶ Retomar" : "⏸ Pausar"}
        </button>
        <button style={{ ...s.btn, borderColor: "rgba(0,212,255,.35)", color: "#00d4ff" }}
          onClick={() => { setCamadaAtual(0); setElapsed(0); setPaused(false); }}>
          ↺ Reiniciar
        </button>
        <button style={{ ...s.btn, borderColor: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.5)" }}
          onClick={() => { setDraft(params); setEditing(true); }}>
          ✎ Editar
        </button>
      </div>

      {/* Modal de edição */}
      {editing && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <p style={s.modalTitle}>Editar Parâmetros</p>
            <div style={s.modalGrid}>
              {[
                ["Resina", "resina", "text"],
                ["Impressora", "impressora", "text"],
                ["Exposição (s)", "exposicao", "number"],
                ["Bottom exp. (s)", "exposicaoBottom", "number"],
                ["Lift speed (mm/min)", "liftSpeed", "number"],
                ["Rest time (s)", "restTime", "number"],
                ["Camada (mm)", "camada", "number"],
                ["Camadas bottom", "camadasBottom", "number"],
                ["Anti-aliasing", "antiAliasing", "text"],
                ["Total camadas", "totalCamadas", "number"],
                ["Tempo total (min)", "tempoTotalMin", "number"],
              ].map(([label, key, type]) => (
                <div key={key} style={s.modalField}>
                  <label style={s.modalLabel}>{label}</label>
                  <input
                    type={type}
                    value={draft[key]}
                    onChange={e => setDraft(d => ({ ...d, [key]: type === "number" ? parseFloat(e.target.value) : e.target.value }))}
                    style={s.modalInput}
                  />
                </div>
              ))}
            </div>
            <div style={s.modalBtns}>
              <button style={{ ...s.btn, flex: 1 }} onClick={() => setEditing(false)}>Cancelar</button>
              <button style={{ ...s.btn, flex: 1, borderColor: "rgba(0,212,255,.4)", color: "#00d4ff" }} onClick={salvar}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}`}</style>
    </div>
  );
}

function MetricCard({ label, value, unit, color }) {
  const colors = { cyan: { bg: "rgba(0,212,255,.07)", border: "rgba(0,212,255,.2)", val: "#00d4ff" }, green: { bg: "rgba(0,255,136,.05)", border: "rgba(0,255,136,.15)", val: "#00ff88" }, warn: { bg: "rgba(255,170,0,.07)", border: "rgba(255,170,0,.2)", val: "#ffaa00" } };
  const c = colors[color] || colors.cyan;
  return (
    <div style={{ ...s.metricCard, background: c.bg, border: `1px solid ${c.border}` }}>
      <p style={s.metricLabel}>{label}</p>
      <p style={{ ...s.metricVal, color: c.val }}>{value}</p>
      <span style={s.metricUnit}>{unit}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoKey}>{label}</span>
      <span style={s.infoVal}>{value}</span>
    </div>
  );
}

const s = {
  kiosk: { background: "#050c14", color: "#fff", fontFamily: "'Inter',sans-serif", padding: "24px", borderRadius: "16px", minHeight: "100vh", position: "relative" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  logo: { fontSize: "12px", fontWeight: 700, letterSpacing: ".15em", color: "#00d4ff" },
  clock: { fontSize: "13px", color: "rgba(255,255,255,.4)", fontVariantNumeric: "tabular-nums" },
  statusRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" },
  dot: { width: 8, height: 8, borderRadius: "50%" },
  statusText: { fontSize: "12px", fontWeight: 700, letterSpacing: ".1em" },
  printerName: { fontSize: "12px", color: "rgba(255,255,255,.3)", marginLeft: "auto" },
  progressWrap: { marginBottom: "20px" },
  progressHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: "11px", color: "rgba(255,255,255,.35)", letterSpacing: ".08em" },
  progressPct: { fontSize: "11px", fontWeight: 700, color: "#00d4ff" },
  progressBar: { height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", background: "#00d4ff", borderRadius: 2, transition: "width .5s ease" },
  progressLayers: { fontSize: "11px", color: "rgba(255,255,255,.3)", marginTop: 6, textAlign: "right" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 },
  metricCard: { borderRadius: 10, padding: "14px 12px" },
  metricLabel: { fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: ".08em", textTransform: "uppercase", margin: "0 0 6px" },
  metricVal: { fontSize: "28px", fontWeight: 800, lineHeight: 1, margin: "0 0 3px", fontVariantNumeric: "tabular-nums" },
  metricUnit: { fontSize: "11px", color: "rgba(255,255,255,.25)" },
  bottomRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 },
  infoCard: { background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10, padding: "12px 14px" },
  infoTitle: { fontSize: "10px", color: "rgba(255,255,255,.3)", letterSpacing: ".08em", marginBottom: 8 },
  infoRow: { display: "flex", justifyContent: "space-between", marginBottom: 5 },
  infoKey: { fontSize: "12px", color: "rgba(255,255,255,.4)" },
  infoVal: { fontSize: "12px", color: "#fff", fontWeight: 600 },
  etaBig: { fontSize: "32px", fontWeight: 800, color: "#00d4ff", margin: "4px 0 2px" },
  etaSub: { fontSize: "11px", color: "rgba(255,255,255,.3)", marginBottom: 4 },
  ctrlRow: { display: "flex", gap: 8 },
  btn: { flex: 1, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.7)", fontSize: "12px", fontWeight: 600, cursor: "pointer", letterSpacing: ".05em" },
  modalOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 },
  modal: { background: "#0d1f2f", border: "1px solid rgba(0,212,255,.2)", borderRadius: 14, padding: "24px", width: "90%", maxWidth: 480 },
  modalTitle: { fontSize: "14px", fontWeight: 700, color: "#00d4ff", marginBottom: 16, letterSpacing: ".08em" },
  modalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 },
  modalField: { display: "flex", flexDirection: "column", gap: 4 },
  modalLabel: { fontSize: "11px", color: "rgba(255,255,255,.4)" },
  modalInput: { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, color: "#fff", padding: "7px 10px", fontSize: "13px", outline: "none" },
  modalBtns: { display: "flex", gap: 8 },
};
