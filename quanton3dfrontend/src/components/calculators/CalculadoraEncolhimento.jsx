import { useState } from "react";
import { ChevronDown, ChevronUp, Printer, Ruler } from "lucide-react";

function Guia() {
  const [expandido, setExpandido] = useState(false);
  return (
    <div style={{ marginBottom: "20px" }}>
      <div className="q-alert q-alert--info">
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.82rem" }}>O que é compensação de encolhimento?</p>
        <p style={{ margin: "0 0 10px", lineHeight: 1.7 }}>
          Após a cura UV, a resina <strong style={{ color: "var(--q-laranja)" }}>encolhe levemente</strong> em relação ao arquivo STL.
          Isso faz as peças saírem menores do que o projetado.
        </p>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          A <strong style={{ color: "var(--primary)" }}>compensação de encolhimento (Scale)</strong> é o fator percentual que você aplica no fatiador
          para que a peça impressa saia com o tamanho correto. Esta calculadora descobre o valor exato.
        </p>
      </div>

      <button type="button" className="q-btn q-btn--ghost q-btn--block" style={{ marginTop: "12px" }} onClick={() => setExpandido(v => !v)}>
        {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expandido ? "Ocultar guia completo de uso" : "Ver guia completo — como medir e usar a calculadora"}
      </button>

      {expandido && (
        <div style={{ marginTop: "12px", display: "grid", gap: "12px" }}>
          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Printer size={15} /> Passo 1 — Imprima uma peça de referência</p>
            <p className="calc-step-text">Você precisa de uma peça com dimensão conhecida. Faça assim:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li>Imprima um cubo simples de <strong style={{ color: "var(--text-primary)" }}>20 × 20 × 20 mm</strong> (ou baixe o Gabarito Quanton3D nos guias do site)</li>
              <li>Use os parâmetros normais da sua resina e impressora</li>
              <li>Deixe curar completamente antes de medir</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Ruler size={15} /> Passo 2 — Meça com paquímetro</p>
            <p className="calc-step-text">Com a peça impressa e curada, use um paquímetro digital para medir:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>Dimensão teórica</strong> = valor no arquivo STL (ex: 20,000 mm)</li>
              <li><strong style={{ color: "var(--q-laranja)" }}>Dimensão medida</strong> = o que o paquímetro mostra na peça impressa (ex: 19,750 mm)</li>
              <li>Meça em X e Y — não precisa de profundidade (Z)</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Printer size={15} /> Passo 3 — Aplique no fatiador</p>
            <p className="calc-step-text">Com o valor calculado, abra seu fatiador e localize:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>Chitubox:</strong> Configurações → Impressora → Compensação de Encolhimento → cole o valor em X e Y</li>
              <li><strong style={{ color: "var(--primary)" }}>Lychee Slicer:</strong> Configurações da impressora → Scale Compensation → cole o valor</li>
              <li>Reimprima a peça de referência para confirmar a correção</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalculadoraEncolhimento() {
  const [teorico, setTeorico] = useState("");
  const [medido, setMedido] = useState("");

  const escala =
    teorico && medido && parseFloat(medido) > 0
      ? ((parseFloat(teorico) / parseFloat(medido)) * 100).toFixed(3)
      : null;

  const ok = escala !== null;

  return (
    <div className="calc-wrapper">
      <h2 className="calc-title">Compensação de Encolhimento</h2>

      <Guia />

      <div className="calc-row">
        <label className="calc-label">Dimensão teórica do STL (mm)</label>
        <input
          type="number"
          className="calc-input"
          placeholder="Ex: 20.000"
          value={teorico}
          onChange={(e) => setTeorico(e.target.value)}
          step="0.001"
          min="0"
        />
      </div>

      <div className="calc-row">
        <label className="calc-label">Dimensão medida após cura (mm)</label>
        <input
          type="number"
          className="calc-input"
          placeholder="Ex: 19.750"
          value={medido}
          onChange={(e) => setMedido(e.target.value)}
          step="0.001"
          min="0"
        />
      </div>

      {ok && (
        <div className="calc-result">
          <div className="calc-result-label">Scale a inserir no fatiador:</div>
          <div className="calc-result-value">{escala}%</div>
          <div className="calc-result-hint">
            Chitubox: Compensação de Encolhimento → X e Y = {escala}%<br />
            Lychee: Scale Compensation → {escala}%
          </div>
        </div>
      )}

      <div className="calc-info">
        <strong>Fórmula:</strong> Scale (%) = (Teórico ÷ Medido) × 100
      </div>
    </div>
  );
}
