import { useState } from "react";

const GRUPOS = [
  {
    titulo: "Máquina",
    icone: "🖨",
    itens: [
      { id: "fep", texto: "FEP limpo e sem marcas ou furos", critico: true },
      { id: "plataforma", texto: "Plataforma nivelada corretamente", critico: true },
      { id: "parafusos", texto: "Parafusos da plataforma apertados", critico: false },
      { id: "tanque", texto: "Tanque de resina limpo e sem resíduos curados", critico: true },
      { id: "tela", texto: "Tela LCD limpa (sem impressões digitais)", critico: false },
    ],
  },
  {
    titulo: "Resina",
    icone: "🧪",
    itens: [
      { id: "agitada", texto: "Resina agitada por pelo menos 2 minutos", critico: true },
      { id: "temperatura", texto: "Temperatura ambiente entre 20°C e 28°C", critico: true },
      { id: "volume", texto: "Volume suficiente de resina no tanque", critico: true },
      { id: "validade", texto: "Resina dentro da validade e bem vedada", critico: false },
      { id: "pigmento", texto: "Pigmento ou aditivo misturado corretamente (se usar)", critico: false },
    ],
  },
  {
    titulo: "Arquivo",
    icone: "📁",
    itens: [
      { id: "suportes", texto: "Suportes verificados e posicionados corretamente", critico: true },
      { id: "orientacao", texto: "Orientação da peça otimizada para menos suporte", critico: false },
      { id: "parametros", texto: "Parâmetros de exposição conferidos no fatiador", critico: true },
      { id: "preview", texto: "Preview camada a camada revisado", critico: false },
      { id: "escala", texto: "Escala da peça verificada (mm corretos)", critico: true },
    ],
  },
  {
    titulo: "Pós-impressão",
    icone: "🧹",
    itens: [
      { id: "isopropilico", texto: "Álcool isopropílico ou solução de lavagem preparada", critico: false },
      { id: "curauv", texto: "Câmara de cura UV disponível e funcionando", critico: false },
      { id: "epi", texto: "Luvas nitrílicas e óculos de proteção em mãos", critico: true },
      { id: "papel", texto: "Papel toalha e espátula disponíveis", critico: false },
    ],
  },
];

export default function ChecklistPreImpressao() {
  const [checked, setChecked] = useState({});
  const [historico, setHistorico] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [salvoMsg, setSalvoMsg] = useState("");

  const toggle = id => setChecked(c => ({ ...c, [id]: !c[id] }));

  const totalItens = GRUPOS.reduce((acc, g) => acc + g.itens.length, 0);
  const totalChecked = Object.values(checked).filter(Boolean).length;
  const todosCriticos = GRUPOS.every(g =>
    g.itens.filter(i => i.critico).every(i => checked[i.id])
  );
  const pronto = todosCriticos && totalChecked >= Math.floor(totalItens * 0.8);

  const resetar = () => setChecked({});

  const salvar = () => {
    setSalvando(true);
    const registro = {
      data: new Date().toLocaleString("pt-BR"),
      totalChecked,
      totalItens,
      pronto,
    };
    setHistorico(h => [registro, ...h.slice(0, 4)]);
    setTimeout(() => {
      setSalvando(false);
      setSalvoMsg("Checklist salvo!");
      setTimeout(() => setSalvoMsg(""), 3000);
    }, 600);
  };

  const pct = Math.round((totalChecked / totalItens) * 100);

  return (
    <section style={s.section}>
      <div style={s.header}>
        <span style={s.badge}>CHECKLIST</span>
        <h2 style={s.title}>Pré-impressão</h2>
        <p style={s.subtitle}>
          Verifique todos os itens antes de iniciar. Itens marcados com{" "}
          <span style={{ color: "#ff6b6b" }}>●</span> são críticos para o sucesso da impressão.
        </p>
      </div>

      {/* Progresso geral */}
      <div style={s.progressCard}>
        <div style={s.progressHeader}>
          <span style={s.progressLabel}>PROGRESSO</span>
          <span style={s.progressPct}>{totalChecked}/{totalItens} itens — {pct}%</span>
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${pct}%`, background: pronto ? "#00ff88" : pct > 50 ? "#00d4ff" : "#ffaa00" }} />
        </div>
      </div>

      {/* Grupos */}
      {GRUPOS.map(grupo => {
        const grupoChecked = grupo.itens.filter(i => checked[i.id]).length;
        const grupoTotal = grupo.itens.length;
        return (
          <div key={grupo.titulo} style={s.card}>
            <div style={s.grupoHeader}>
              <span style={s.grupoIcone}>{grupo.icone}</span>
              <span style={s.grupoTitulo}>{grupo.titulo}</span>
              <span style={s.grupoContador}>{grupoChecked}/{grupoTotal}</span>
            </div>
            {grupo.itens.map(item => (
              <div
                key={item.id}
                style={{ ...s.itemRow, background: checked[item.id] ? "rgba(0,255,136,.05)" : "transparent", cursor: "pointer" }}
                onClick={() => toggle(item.id)}
              >
                <div style={{ ...s.checkbox, background: checked[item.id] ? "#00ff88" : "transparent", borderColor: checked[item.id] ? "#00ff88" : "rgba(255,255,255,.2)" }}>
                  {checked[item.id] && <span style={s.checkmark}>✓</span>}
                </div>
                <span style={{ ...s.itemText, color: checked[item.id] ? "rgba(255,255,255,.5)" : "#fff", textDecoration: checked[item.id] ? "line-through" : "none" }}>
                  {item.texto}
                </span>
                {item.critico && !checked[item.id] && (
                  <span style={s.criticoBadge}>●</span>
                )}
                {item.critico && checked[item.id] && (
                  <span style={{ ...s.criticoBadge, color: "rgba(0,255,136,.5)" }}>●</span>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {/* Status final */}
      <div style={{ ...s.statusBox, background: pronto ? "rgba(0,255,136,.08)" : "rgba(255,170,0,.07)", borderColor: pronto ? "rgba(0,255,136,.25)" : "rgba(255,170,0,.25)" }}>
        <span style={{ fontSize: 20 }}>{pronto ? "✅" : "⚠️"}</span>
        <div>
          <p style={{ ...s.statusTitle, color: pronto ? "#00ff88" : "#ffaa00" }}>
            {pronto ? "Pronto para imprimir!" : "Itens pendentes"}
          </p>
          <p style={s.statusSub}>
            {pronto
              ? "Todos os itens críticos foram verificados. Boa impressão!"
              : !todosCriticos
              ? "Complete todos os itens críticos (marcados com ●) antes de iniciar."
              : "Complete pelo menos 80% dos itens para liberar a impressão."}
          </p>
        </div>
      </div>

      {/* Botões */}
      <div style={s.btns}>
        <button style={s.btnSecondary} onClick={resetar}>↺ Reiniciar</button>
        <button
          style={{ ...s.btnPrimary, opacity: salvando ? 0.6 : 1 }}
          onClick={salvar}
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "💾 Salvar registro"}
        </button>
      </div>
      {salvoMsg && <p style={s.salvoMsg}>{salvoMsg}</p>}

      {/* Histórico */}
      {historico.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={s.histTitle}>ÚLTIMOS REGISTROS</p>
          {historico.map((r, i) => (
            <div key={i} style={s.histRow}>
              <span style={s.histData}>{r.data}</span>
              <span style={s.histPct}>{r.totalChecked}/{r.totalItens} itens</span>
              <span style={{ ...s.histStatus, color: r.pronto ? "#00ff88" : "#ffaa00" }}>
                {r.pronto ? "✓ OK" : "⚠ Incompleto"}
              </span>
            </div>
          ))}
        </div>
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
  progressCard: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "16px", marginBottom: 16 },
  progressHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: "11px", color: "rgba(255,255,255,.35)", letterSpacing: ".08em" },
  progressPct: { fontSize: "12px", fontWeight: 600, color: "#00d4ff" },
  progressBar: { height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2, transition: "width .4s ease" },
  card: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: "16px", marginBottom: 12 },
  grupoHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,.06)" },
  grupoIcone: { fontSize: 16 },
  grupoTitulo: { fontSize: "13px", fontWeight: 600, color: "#fff", flex: 1 },
  grupoContador: { fontSize: "11px", color: "#00d4ff", fontWeight: 600 },
  itemRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderRadius: 8, marginBottom: 4, transition: "background .2s" },
  checkbox: { width: 20, height: 20, borderRadius: 4, border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" },
  checkmark: { fontSize: "11px", color: "#050c14", fontWeight: 800 },
  itemText: { fontSize: "13px", flex: 1, lineHeight: 1.4, transition: "all .2s" },
  criticoBadge: { fontSize: "10px", color: "#ff6b6b", flexShrink: 0 },
  statusBox: { display: "flex", gap: 12, alignItems: "flex-start", borderRadius: 12, border: "1px solid", padding: "14px 16px", marginBottom: 16, marginTop: 8 },
  statusTitle: { fontSize: "14px", fontWeight: 700, margin: "0 0 4px" },
  statusSub: { fontSize: "12px", color: "rgba(255,255,255,.45)", margin: 0, lineHeight: 1.5 },
  btns: { display: "flex", gap: 10 },
  btnSecondary: { flex: 1, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", background: "transparent", color: "rgba(255,255,255,.6)", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  btnPrimary: { flex: 2, padding: "10px", borderRadius: 8, border: "1px solid rgba(0,212,255,.35)", background: "rgba(0,212,255,.08)", color: "#00d4ff", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  salvoMsg: { fontSize: "12px", color: "#00ff88", textAlign: "center", marginTop: 8 },
  histTitle: { fontSize: "11px", color: "rgba(255,255,255,.3)", letterSpacing: ".08em", marginBottom: 8 },
  histRow: { display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.05)" },
  histData: { fontSize: "12px", color: "rgba(255,255,255,.4)", flex: 1 },
  histPct: { fontSize: "12px", color: "rgba(255,255,255,.5)" },
  histStatus: { fontSize: "12px", fontWeight: 600, minWidth: 80, textAlign: "right" },
};
