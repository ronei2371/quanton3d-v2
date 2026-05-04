import { useState, useEffect, useRef } from "react";

export default function TimerImpressao() {
  const [horasTotal, setHorasTotal] = useState(2);
  const [minutosTotal, setMinutosTotal] = useState(40);
  const [iniciado, setIniciado] = useState(false);
  const [paused, setPaused] = useState(false);
  const [secsRestantes, setSecsRestantes] = useState(0);
  const [horaInicio, setHoraInicio] = useState(null);
  const [concluido, setConcluido] = useState(false);
  const [notificou, setNotificou] = useState(false);
  const [agoraMs, setAgoraMs] = useState(() => Date.now());
  const intervalRef = useRef(null);

  const totalSecs = horasTotal * 3600 + minutosTotal * 60;

  useEffect(() => {
    const clockId = setInterval(() => setAgoraMs(Date.now()), 1000);
    return () => clearInterval(clockId);
  }, []);

  const iniciar = () => {
    if (totalSecs <= 0) return;
    setSecsRestantes(totalSecs);
    setHoraInicio(new Date());
    setIniciado(true);
    setPaused(false);
    setConcluido(false);
    setNotificou(false);
  };

  const pausar = () => setPaused(p => !p);
  const cancelar = () => { setIniciado(false); setPaused(false); setConcluido(false); clearInterval(intervalRef.current); };

  useEffect(() => {
    if (!iniciado || paused || concluido) return;
    intervalRef.current = setInterval(() => {
      setSecsRestantes(s => {
        if (s <= 1) {
          setConcluido(true);
          setNotificou(true);
          clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [iniciado, paused, concluido]);

  useEffect(() => {
    if (!concluido || !notificou) return;
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Quanton3D — Impressão concluída!", { body: "Sua impressão terminou. Hora de remover e lavar a peça!" });
    }
  }, [concluido, notificou]);

  const pedirNotificacao = () => {
    if (typeof Notification !== "undefined") Notification.requestPermission();
  };

  const pad = n => String(n).padStart(2, "0");
  const hRest = Math.floor(secsRestantes / 3600);
  const mRest = Math.floor((secsRestantes % 3600) / 60);
  const sRest = secsRestantes % 60;
  const elapsed = totalSecs - secsRestantes;
  const pct = totalSecs > 0 ? Math.round((elapsed / totalSecs) * 100) : 0;

  const finish = horaInicio ? new Date(horaInicio.getTime() + totalSecs * 1000) : null;
  const finishStr = finish ? `${pad(finish.getHours())}:${pad(finish.getMinutes())}` : "--:--";

  const circunferencia = 2 * Math.PI * 54;
  const dashOffset = circunferencia * (1 - pct / 100);

  return (
    <section style={s.section}>
      <div style={s.header}>
        <span style={s.badge}>TIMER</span>
        <h2 style={s.title}>Timer de Impressão</h2>
        <p style={s.subtitle}>
          Informe o tempo do fatiador e acompanhe a impressão com previsão de término em tempo real.
        </p>
      </div>

      {!iniciado ? (
        <div style={s.card}>
          <p style={s.sectionLabel}>Duração da impressão (do fatiador)</p>
          <div style={s.timeInputRow}>
            <div style={s.timeField}>
              <label style={s.label}>Horas</label>
              <input type="number" min={0} max={24} value={horasTotal}
                onChange={e => setHorasTotal(Math.max(0, parseInt(e.target.value) || 0))}
                style={s.timeInput} />
            </div>
            <span style={s.timeSep}>:</span>
            <div style={s.timeField}>
              <label style={s.label}>Minutos</label>
              <input type="number" min={0} max={59} value={minutosTotal}
                onChange={e => setMinutosTotal(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                style={s.timeInput} />
            </div>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Término estimado:</span>
            <span style={s.infoVal}>
              {(() => {
                const f = new Date(agoraMs + totalSecs * 1000);
                return `${pad(f.getHours())}:${pad(f.getMinutes())}`;
              })()}
            </span>
            <span style={s.infoLabel}>Duração total:</span>
            <span style={s.infoVal}>{horasTotal}h {minutosTotal}min</span>
          </div>
          <div style={s.btns}>
            <button style={s.btnSecondary} onClick={pedirNotificacao}>🔔 Ativar notificação</button>
            <button style={s.btnPrimary} onClick={iniciar} disabled={totalSecs <= 0}>▶ Iniciar timer</button>
          </div>
        </div>
      ) : (
        <>
          {/* Círculo de progresso */}
          <div style={s.circleWrap}>
            <svg width="140" height="140" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="6" />
              <circle cx="60" cy="60" r="54" fill="none"
                stroke={concluido ? "#00ff88" : paused ? "#ffaa00" : "#00d4ff"}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circunferencia}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div style={s.circleInner}>
              <span style={{ ...s.circleTime, color: concluido ? "#00ff88" : paused ? "#ffaa00" : "#fff" }}>
                {concluido ? "✓" : `${pad(hRest)}:${pad(mRest)}:${pad(sRest)}`}
              </span>
              <span style={s.circleLabel}>{concluido ? "CONCLUÍDO!" : paused ? "PAUSADO" : "restante"}</span>
            </div>
          </div>

          {/* Métricas */}
          <div style={s.metricsRow}>
            <div style={s.metric}>
              <p style={s.metricLabel}>Início</p>
              <p style={s.metricVal}>{horaInicio ? `${pad(horaInicio.getHours())}:${pad(horaInicio.getMinutes())}` : "--"}</p>
            </div>
            <div style={{ ...s.metric, borderColor: "rgba(0,212,255,.2)", background: "rgba(0,212,255,.07)" }}>
              <p style={s.metricLabel}>Término</p>
              <p style={{ ...s.metricVal, color: "#00d4ff" }}>{finishStr}</p>
            </div>
            <div style={s.metric}>
              <p style={s.metricLabel}>Progresso</p>
              <p style={s.metricVal}>{pct}%</p>
            </div>
            <div style={s.metric}>
              <p style={s.metricLabel}>Decorrido</p>
              <p style={s.metricVal}>{pad(Math.floor(elapsed / 3600))}:{pad(Math.floor((elapsed % 3600) / 60))}</p>
            </div>
          </div>

          {/* Barra */}
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${pct}%`, background: concluido ? "#00ff88" : "#00d4ff" }} />
          </div>

          {concluido && (
            <div style={s.alertBox}>
              <span style={{ fontSize: 20 }}>🎉</span>
              <div>
                <p style={s.alertTitle}>Impressão concluída!</p>
                <p style={s.alertSub}>Retire a peça da plataforma, lave em IPA por 2-5 minutos e cure na UV.</p>
              </div>
            </div>
          )}

          <div style={s.btns}>
            {!concluido && <button style={s.btnSecondary} onClick={pausar}>{paused ? "▶ Retomar" : "⏸ Pausar"}</button>}
            <button style={{ ...s.btnSecondary, borderColor: "rgba(255,100,100,.3)", color: "rgba(255,120,120,.8)" }} onClick={cancelar}>✕ Cancelar</button>
            {concluido && <button style={s.btnPrimary} onClick={iniciar}>↺ Novo timer</button>}
          </div>
        </>
      )}
    </section>
  );
}

const s = {
  section: { background: "transparent", color: "#fff", padding: "2rem 0", fontFamily: "'Inter',sans-serif" },
  header: { marginBottom: "1.5rem" },
  badge: { display: "inline-block", fontSize: "11px", fontWeight: 600, letterSpacing: ".1em", color: "#00d4ff", marginBottom: 8 },
  title: { fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, margin: "0 0 12px", color: "#fff", lineHeight: 1.1 },
  subtitle: { fontSize: "14px", color: "rgba(255,255,255,.55)", maxWidth: 600, lineHeight: 1.6, margin: 0 },
  card: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  sectionLabel: { fontSize: "12px", color: "rgba(255,255,255,.35)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 },
  timeInputRow: { display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 16 },
  timeField: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  label: { fontSize: "13px", color: "rgba(255,255,255,.5)" },
  timeInput: { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#fff", padding: "12px", fontSize: "24px", fontWeight: 700, outline: "none", textAlign: "center", width: "100%" },
  timeSep: { fontSize: "28px", fontWeight: 700, color: "rgba(255,255,255,.3)", paddingBottom: 10 },
  infoRow: { display: "flex", flexWrap: "wrap", gap: "8px 20px", padding: "10px 12px", background: "rgba(255,255,255,.03)", borderRadius: 8, marginBottom: 16, alignItems: "center" },
  infoLabel: { fontSize: "12px", color: "rgba(255,255,255,.4)" },
  infoVal: { fontSize: "13px", fontWeight: 600, color: "#00d4ff" },
  btns: { display: "flex", gap: 10 },
  btnSecondary: { flex: 1, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", background: "transparent", color: "rgba(255,255,255,.6)", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  btnPrimary: { flex: 2, padding: "10px", borderRadius: 8, border: "1px solid rgba(0,212,255,.35)", background: "rgba(0,212,255,.08)", color: "#00d4ff", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  circleWrap: { position: "relative", width: 140, height: 140, margin: "0 auto 24px" },
  circleInner: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  circleTime: { fontSize: "22px", fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  circleLabel: { fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: ".08em", marginTop: 2 },
  metricsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 },
  metric: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "12px" },
  metricLabel: { fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 4px" },
  metricVal: { fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0, fontVariantNumeric: "tabular-nums" },
  progressBar: { height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2, overflow: "hidden", marginBottom: 16 },
  progressFill: { height: "100%", borderRadius: 2, transition: "width 1s linear" },
  alertBox: { display: "flex", gap: 12, alignItems: "flex-start", background: "rgba(0,255,136,.07)", border: "1px solid rgba(0,255,136,.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 },
  alertTitle: { fontSize: "14px", fontWeight: 700, color: "#00ff88", margin: "0 0 4px" },
  alertSub: { fontSize: "12px", color: "rgba(255,255,255,.5)", margin: 0, lineHeight: 1.5 },
};
