import { useState } from "react";
import ModoKiosk from "./ModoKiosk";
import ChecklistPreImpressao from "./ChecklistPreImpressao";
import CalculadoraCuraUV from "./CalculadoraCuraUV";
import CalculadoraExposicao from "./CalculadoraExposicao";
import CalculadoraVolume from "./CalculadoraVolume";
import ComparadorCusto from "./ComparadorCusto";
import DiarioTecnico from "./DiarioTecnico";

// ============================================================
// ABAS
// ============================================================
const ABAS = [
  {
    id: "kiosk",
    label: "🖥 Kiosk",
    descricao: "Painel ao lado da impressora",
    componente: <ModoKiosk />,
  },
  {
    id: "checklist",
    label: "✅ Checklist",
    descricao: "Verificação pré-impressão",
    componente: <ChecklistPreImpressao />,
  },
  {
    id: "exposicao",
    label: "💡 Exposição",
    descricao: "Calcule o tempo de exposição",
    componente: <CalculadoraExposicao />,
  },
  {
    id: "volume",
    label: "🧪 Volume",
    descricao: "Calcule o consumo de resina",
    componente: <CalculadoraVolume />,
  },
  {
    id: "cura",
    label: "☀ Cura UV",
    descricao: "Tempo ideal de cura",
    componente: <CalculadoraCuraUV />,
  },
  {
    id: "comparador",
    label: "⚖ Comparador",
    descricao: "Compare custo entre resinas",
    componente: <ComparadorCusto />,
  },
  {
    id: "diario",
    label: "📓 Diário",
    descricao: "Registro técnico de impressões",
    componente: <DiarioTecnico />,
  },
];

export default function Ferramentas() {
  const [abaAtiva, setAbaAtiva] = useState("kiosk");
  const aba = ABAS.find((a) => a.id === abaAtiva);

  return (
    <div style={s.wrap}>
      <div style={s.pageHeader}>
        <span style={s.badge}>FERRAMENTAS</span>
        <h1 style={s.pageTitle}>Central de Ferramentas</h1>
        <p style={s.pageSubtitle}>
          Calculadoras, checklist e painel de monitoramento para sua impressão
          3D em resina.
        </p>
        <p style={s.pageHint}>
          Dica: os botões de pausar/retomar do painel servem para acompanhamento
          visual e não enviam comando direto para a impressora.
        </p>
      </div>

      <div style={s.tabsWrap}>
        <div style={s.tabs}>
          {ABAS.map((a) => (
            <button
              key={a.id}
              style={{ ...s.tab, ...(abaAtiva === a.id ? s.tabActive : {}) }}
              onClick={() => setAbaAtiva(a.id)}
            >
              <span style={s.tabLabel}>{a.label}</span>
              <span
                style={{
                  ...s.tabDesc,
                  ...(abaAtiva === a.id ? s.tabDescActive : {}),
                }}
              >
                {a.descricao}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={s.content}>{aba?.componente}</div>
    </div>
  );
}

const s = {
  wrap: {
    background: "transparent",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "2rem 1.5rem",
  },
  pageHeader: {
    marginBottom: "2rem",
  },
  badge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: ".1em",
    color: "#00d4ff",
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: 700,
    margin: "0 0 12px",
    color: "#fff",
    lineHeight: 1.1,
  },
  pageSubtitle: {
    fontSize: "15px",
    color: "rgba(255,255,255,.5)",
    maxWidth: 560,
    lineHeight: 1.6,
    margin: 0,
  },
  pageHint: {
    fontSize: "12px",
    color: "rgba(255,255,255,.38)",
    maxWidth: 680,
    lineHeight: 1.5,
    margin: "10px 0 0",
  },
  tabsWrap: {
    overflowX: "auto",
    marginBottom: "2rem",
    paddingBottom: 4,
    scrollbarWidth: "none",
  },
  tabs: {
    display: "flex",
    gap: 8,
    minWidth: "max-content",
    borderBottom: "1px solid rgba(255,255,255,.08)",
    paddingBottom: 0,
  },
  tab: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    padding: "10px 16px 12px",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "rgba(255,255,255,.45)",
    cursor: "pointer",
    transition: "all .2s",
    whiteSpace: "nowrap",
    marginBottom: -1,
  },
  tabActive: {
    color: "#fff",
    borderBottomColor: "#00d4ff",
  },
  tabLabel: {
    fontSize: "13px",
    fontWeight: 600,
  },
  tabDesc: {
    fontSize: "10px",
    color: "rgba(255,255,255,.25)",
    letterSpacing: ".03em",
  },
  tabDescActive: {
    color: "rgba(0,212,255,.6)",
  },
  content: {
    minHeight: "60vh",
  },
};
