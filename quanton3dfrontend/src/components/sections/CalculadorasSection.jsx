import { useEffect, useState } from "react";
import { trackStartCalibration, trackOpenCalculator } from "../../utils/analytics";
import { Zap, Microscope, Ruler, Timer, Wrench, Compass, Maximize2, Layers, X } from "lucide-react";
import CalculadoraExposicao from "../calculators/CalculadoraExposicao";
import CalculadoraVolume from "../calculators/CalculadoraVolume";
import CalculadoraTolerancia from "../calculators/CalculadoraTolerancia";
import CalculadoraCustos from "../calculators/CalculadoraCustos";
import CalculadoraTempo from "../calculators/CalculadoraTempo";
import CalculadoraCompensacao from "../calculators/CalculadoraCompensacao";
import CalculadoraEncolhimento from "../calculators/CalculadoraEncolhimento";
import CalculadoraToleranciaInferior from "../calculators/CalculadoraToleranciaInferior";

const CALCULADORAS = [
  { id: "custo_simples", icon: Zap, titulo: "Custo — Modo Simples", desc: "Resina, energia, falha e custo por peça em segundos.", tags: ["Resina", "Energia", "Falha"] },
  { id: "custo_avancado", icon: Microscope, titulo: "Custo — Modo Avançado", desc: "Orçamento completo com cliente, mão de obra, frete e PDF.", tags: ["Cliente", "PDF", "Histórico"] },
  { id: "exposicao", icon: Compass, titulo: "Exposição UV", desc: "Parâmetros reais por resina e impressora, ajustados por temperatura.", tags: ["UV", "Temperatura"] },
  { id: "tolerancia", icon: Ruler, titulo: "Tolerância X/Y", desc: "Compensação para encaixes perfeitos entre peças impressas.", tags: ["Encaixe", "Calibração"] },
  { id: "tempo", icon: Timer, titulo: "Tempo de Impressão", desc: "Compare tempos por camadas, delays e rest time.", tags: ["Camadas", "Rest Time"] },
  { id: "compensacao", icon: Wrench, titulo: "Compensação Chitubox/Lychee", desc: "Calibre a estimativa do fatiador com o tempo real.", tags: ["Chitubox", "Lychee"] },
  { id: "encolhimento", icon: Maximize2, titulo: "Compensação de Encolhimento", desc: "Calcula o fator de escala (%) para corrigir o encolhimento da resina após cura.", tags: ["Escala", "Fatiador", "Encolhimento"] },
  { id: "tolerancia_inferior", icon: Layers, titulo: "Tolerância Inferior (Pé de Elefante)", desc: "Compensa a expansão das camadas base causada pela sobre-exposição.", tags: ["Base", "Camadas", "Pé de Elefante"] },
];

function CalculadorasSection({ calculadoraInicial, onNavegar }) {
  const [ativa, setAtiva] = useState(calculadoraInicial || null);
  const [guiaAberto, setGuiaAberto] = useState(false);
  const [guiaUrl, setGuiaUrl] = useState("");

  // Sincroniza calculadoraInicial com ativa quando o prop muda apos montagem
  useEffect(() => {
    if (calculadoraInicial) setAtiva(calculadoraInicial);
  }, [calculadoraInicial]);

  // Conta no Google Analytics cada calculadora aberta (pelo cartao, por link ou pela
  // Tempo -> Compensacao). A de Exposicao continua mandando tambem o start_calibration.
  useEffect(() => {
    if (!ativa) return;
    trackOpenCalculator(ativa);
    if (ativa === "exposicao") trackStartCalibration({ resin_name: undefined });
  }, [ativa]);

  const conteudo = {
    custo_simples: <CalculadoraVolume />,
    custo_avancado: <CalculadoraCustos />,
    exposicao: <CalculadoraExposicao onIrParametros={onNavegar ? () => { setAtiva(null); onNavegar("parametros"); } : undefined} />,
    tolerancia: <CalculadoraTolerancia onAbrirGuias={() => { if (onNavegar) { setAtiva(null); onNavegar("guias"); } }} />,
    tempo: <CalculadoraTempo onAbrirCompensacao={() => setAtiva("compensacao")} />,
    compensacao: <CalculadoraCompensacao onAbrirGuias={() => { if (onNavegar) { setAtiva(null); onNavegar("guias"); } }} />,
    encolhimento: <CalculadoraEncolhimento onAbrirGuias={() => { if (onNavegar) { setAtiva(null); onNavegar("guias"); } }} />,
    tolerancia_inferior: <CalculadoraToleranciaInferior onAbrirGuias={() => { if (onNavegar) { setAtiva(null); onNavegar("guias"); } }} />,
  };

  // Intercepta cliques em links de guia dentro das calculadoras e abre o modal
  function handleClickGuia(e) {
    const link = e.target.closest('a[href^="/guias/"]');
    if (link) {
      e.preventDefault();
      setGuiaUrl(link.getAttribute("href"));
      setGuiaAberto(true);
    }
  }

  return (
    <section className="q-card q-panel calculators-section" id="calculadoras">
      <span className="q-eyebrow">Ferramentas</span>
      <h2 className="q-section-title">Calculadoras</h2>
      <p className="q-section-desc">Ferramentas de precisão para sua impressão 3D em resina.</p>

      <div className="q-grid">
        {CALCULADORAS.map(({ id, icon: Icon, titulo, desc, tags }) => (
          <button key={id} type="button" className="q-card q-card--interactive calculator-launcher" style={{ padding: "18px", textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }} onClick={() => setAtiva(id)}>
            <span className="q-icon-badge"><Icon size={17} /></span>
            <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{titulo}</strong>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{desc}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
              {tags.map((t) => <span key={t} className="q-badge" style={{ fontSize: "0.64rem" }}>{t}</span>)}
            </div>
          </button>
        ))}
      </div>

      {ativa && (
        <div className="q-modal-backdrop" onClick={() => setAtiva(null)}>
          <div className="q-modal q-modal--wide" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <button className="q-modal-close" style={{ alignSelf: "flex-start", marginBottom: "10px" }} onClick={() => setAtiva(null)} aria-label="Fechar">
              <X size={20} />
            </button>
            {/* onClick intercepta links /guias/ e abre modal do guia em vez de navegar */}
            <div style={{ flex: 1, minHeight: 0, overflowY: ativa === "custo_avancado" ? "hidden" : "auto" }} onClick={handleClickGuia}>
              {conteudo[ativa]}
            </div>
          </div>
        </div>
      )}

      {/* Modal do Guia Tecnico — abre por cima do modal da calculadora */}
      {guiaAberto && (
        <div
          className="q-modal-backdrop"
          style={{ zIndex: 2000 }}
          onClick={() => setGuiaAberto(false)}
        >
          <div
            className="q-modal q-modal--wide"
            style={{ display: "flex", flexDirection: "column", height: "85vh", padding: "12px", boxSizing: "border-box" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="q-modal-close"
              style={{ alignSelf: "flex-end", marginBottom: "8px" }}
              onClick={() => setGuiaAberto(false)}
              aria-label="Fechar guia"
            >
              <X size={20} />
            </button>
            <iframe
              src={guiaUrl}
              title="Guia Técnico Quanton3D"
              style={{ flex: 1, width: "100%", border: "none", borderRadius: "8px" }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default CalculadorasSection;
