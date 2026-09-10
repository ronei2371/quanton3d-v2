import { useState } from "react";

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
      <p className="calc-desc">
        Calcula o fator de escala para corrigir o encolhimento da resina.
        Insira no fatiador em <strong>Compensação de Encolhimento (Scale)</strong>.
      </p>

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
            No Chitubox: Compensação de Encolhimento → X e Y = {escala}%<br />
            No Lychee: Scale Compensation → {escala}%
          </div>
        </div>
      )}

      <div className="calc-info">
        <strong>Fórmula:</strong> Scale (%) = (Teórico ÷ Medido) × 100
      </div>
    </div>
  );
}
