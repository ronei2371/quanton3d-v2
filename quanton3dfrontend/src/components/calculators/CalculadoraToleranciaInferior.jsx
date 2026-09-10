import { useState } from "react";

export default function CalculadoraToleranciaInferior() {
  const [teorico, setTeorico] = useState("");
  const [medido, setMedido] = useState("");

  const compensacao =
    teorico && medido
      ? (parseFloat(teorico) - parseFloat(medido)).toFixed(3)
      : null;

  const ok = compensacao !== null;

  return (
    <div className="calc-wrapper">
      <h2 className="calc-title">Compensação de Tolerância Inferior</h2>
      <p className="calc-desc">
        Corrige o <strong>pé de elefante</strong> — expansão nas camadas inferiores
        causada pela sobre-exposição da base. Insira o valor resultante no fatiador
        em <strong>Compensação de Tolerância Inferior</strong> (valor normalmente negativo).
      </p>

      <div className="calc-row">
        <label className="calc-label">Dimensão teórica da base no STL (mm)</label>
        <input
          type="number"
          className="calc-input"
          placeholder="Ex: 20.000"
          value={teorico}
          onChange={(e) => setTeorico(e.target.value)}
          step="0.001"
        />
      </div>

      <div className="calc-row">
        <label className="calc-label">Dimensão medida na base após impressão (mm)</label>
        <input
          type="number"
          className="calc-input"
          placeholder="Ex: 20.350"
          value={medido}
          onChange={(e) => setMedido(e.target.value)}
          step="0.001"
        />
      </div>

      {ok && (
        <div className="calc-result">
          <div className="calc-result-label">Compensação a inserir no fatiador:</div>
          <div className="calc-result-value">{compensacao} mm</div>
          <div className="calc-result-hint">
            No Chitubox/Lychee: Compensação de Tolerância Inferior = {compensacao} mm<br />
            {parseFloat(compensacao) < 0
              ? "Valor negativo = reduz a base para compensar o pé de elefante."
              : "Valor positivo = base ficou menor que o esperado."}
          </div>
        </div>
      )}

      <div className="calc-info">
        <strong>Fórmula:</strong> Compensação = Teórico − Medido
      </div>
    </div>
  );
}
