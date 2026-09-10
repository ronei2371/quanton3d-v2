import { useState } from "react";
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

  const conteudo = {
    custo_simples: <CalculadoraVolume />,
    custo_avancado: <CalculadoraCustos />,
    exposicao: <CalculadoraExposicao onIrParametros={onNavegar ? () => { setAtiva(null); onNavegar("parametros"); } : undefined} />,
    tolerancia: <CalculadoraTolerancia />,
    tempo: <CalculadoraTempo onAbrirCompensacao={() => setAtiva("compensacao")} />,
    compensacao: <CalculadoraCompensacao />,
    encolhimento: <CalculadoraEncolhimento />,
    tolerancia_inferior: <CalculadoraToleranciaInferior />,
  };

  const calcAtiva = CALCULADORAS.find((c) => c.id === ativa);

  return (
    <section className="q-section" id="calculadoras">
      <div className="q-section-header">
        <h2 className="q-section-title">Calculadoras</h2>
        <p className="q-section-sub">Ferramentas de precisão para sua impressão 3D em resina.</p>
      </div>

      <div className="q-grid">
        {CALCULADORAS.map(({ id, icon: Icon, titulo, desc, tags }) => (
          <button key={id} className="q-card q-card--calc" onClick={() => setAtiva(id)}>
            <div className="q-card-icon"><Icon size={22} /></div>
            <div className="q-card-body">
              <h3 className="q-card-title">{titulo}</h3>
              <p className="q-card-desc">{desc}</p>
              <div className="q-card-tags">
                {tags.map((t) => <span key={t} className="q-tag">{t}</span>)}
              </div>
            </div>
          </button>
        ))}
      </div>

      {ativa && (
        <div className="q-modal-backdrop" onClick={() => setAtiva(null)}>
          <div className="q-modal" onClick={(e) => e.stopPropagation()}>
            <button className="q-modal-close" onClick={() => setAtiva(null)} aria-label="Fechar">
              <X size={20} />
            </button>
            {conteudo[ativa]}
          </div>
        </div>
      )}
    </section>
  );
}

export default CalculadorasSection;
