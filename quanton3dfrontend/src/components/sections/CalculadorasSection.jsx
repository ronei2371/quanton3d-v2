import { useState } from "react";
import { Zap, Microscope, Ruler, Timer, Wrench, Compass, X } from "lucide-react";
import CalculadoraExposicao from "../calculators/CalculadoraExposicao";
import CalculadoraVolume from "../calculators/CalculadoraVolume";
import CalculadoraTolerancia from "../calculators/CalculadoraTolerancia";
import CalculadoraCustos from "../calculators/CalculadoraCustos";
import CalculadoraTempo from "../calculators/CalculadoraTempo";
import CalculadoraCompensacao from "../calculators/CalculadoraCompensacao";

const CALCULADORAS = [
  { id: "custo_simples", icon: Zap, titulo: "Custo — Modo Simples", desc: "Resina, energia, falha e custo por peça em segundos.", tags: ["Resina", "Energia", "Falha"] },
  { id: "custo_avancado", icon: Microscope, titulo: "Custo — Modo Avançado", desc: "Orçamento completo com cliente, mão de obra, frete e PDF.", tags: ["Cliente", "PDF", "Histórico"] },
  { id: "exposicao", icon: Compass, titulo: "Exposição UV", desc: "Parâmetros reais por resina e impressora, ajustados por temperatura.", tags: ["UV", "Temperatura"] },
  { id: "tolerancia", icon: Ruler, titulo: "Tolerância X/Y", desc: "Compensação para encaixes perfeitos entre peças impressas.", tags: ["Encaixe", "Calibração"] },
  { id: "tempo", icon: Timer, titulo: "Tempo de Impressão", desc: "Compare tempos por camadas, delays e rest time.", tags: ["Camadas", "Rest Time"] },
  { id: "compensacao", icon: Wrench, titulo: "Compensação Chitubox/Lychee", desc: "Calibre a estimativa do fatiador com o tempo real.", tags: ["Chitubox", "Lychee"] },
];

function CalculadorasSection({ calculadoraInicial, onNavegar }) {
  const [ativa, setAtiva] = useState(calculadoraInicial || null);

  const conteudo = {
    custo_simples: <CalculadoraVolume />,
    custo_avancado: <CalculadoraCustos />,
    exposicao: <CalculadoraExposicao onIrParametros={onNavegar ? () => { setAtiva(null); onNavegar("parametros"); } : undefined} />,
    tolerancia: <CalculadoraTolerancia />,
    tempo: <CalculadoraTempo onAbrirCompensacao={() => setAtiva("compensacao")} />,
    compensacao: <CalculadoraCompensacao />,
  };

  return (
    <section className="q-card q-panel calculators-section">
      <span className="q-eyebrow">Ferramentas</span>
      <h2 className="q-section-title">Calculadoras</h2>
      <p className="q-section-desc">Ferramentas técnicas para custo, exposição, tolerância e tempo de impressão.</p>

      <div className="q-grid">
        {CALCULADORAS.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.id} type="button" className="q-card q-card--interactive calculator-launcher" style={{ padding: "18px", textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }} onClick={() => setAtiva(c.id)}>
              <span className="q-icon-badge"><Icon size={17} /></span>
              <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{c.titulo}</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{c.desc}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                {c.tags.map((t) => <span key={t} className="q-badge" style={{ fontSize: "0.64rem" }}>{t}</span>)}
              </div>
            </button>
          );
        })}
      </div>

      {ativa && (
        <div className="q-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setAtiva(null)}>
          <section className="q-modal q-modal--wide calculator-modal" style={{ display: "flex", flexDirection: "column" }}>
            <div className="q-modal-head">
              <h2 style={{ fontSize: "1rem" }}>{CALCULADORAS.find((c) => c.id === ativa)?.titulo}</h2>
              <button type="button" className="q-modal-close" onClick={() => setAtiva(null)}><X size={13} /> Fechar</button>
            </div>
            <div className="calculator-shell" style={{ flex: 1, minHeight: 0, overflowY: ativa === "custo_avancado" ? "hidden" : "auto" }}>{conteudo[ativa]}</div>
          </section>
        </div>
      )}
    </section>
  );
}

export default CalculadorasSection;
