import { useState } from "react";
import { ChevronDown, ChevronUp, Printer, Ruler, AlertTriangle } from "lucide-react";

function Guia() {
  const [expandido, setExpandido] = useState(false);
  return (
    <div style={{ marginBottom: "20px" }}>
      <div className="q-alert q-alert--info">
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.82rem" }}>O que é o pé de elefante?</p>
        <p style={{ margin: "0 0 10px", lineHeight: 1.7 }}>
          As camadas inferiores recebem <strong style={{ color: "var(--q-laranja)" }}>mais exposição UV do que as normais</strong> para garantir
          boa adesão à plataforma. Isso faz a base da peça se expandir lateralmente — criando o chamado <strong style={{ color: "var(--q-laranja)" }}>pé de elefante</strong>.
        </p>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          A <strong style={{ color: "var(--primary)" }}>compensação de tolerância inferior</strong> é o valor (em mm, geralmente negativo)
          que você coloca no fatiador para reduzir a base e compensar essa expansão.
          Esta calculadora descobre o valor exato.
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
            <p className="calc-step-text">Você precisa de uma peça com base plana e dimensão conhecida. Faça assim:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li>Imprima um cubo simples de <strong style={{ color: "var(--text-primary)" }}>20 × 20 × 20 mm</strong> (ou baixe o Gabarito Quanton3D nos guias do site)</li>
              <li>Use os parâmetros normais da sua resina — sem alterar nada ainda</li>
              <li>Deixe curar completamente antes de medir</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Ruler size={15} /> Passo 2 — Meça a base com paquímetro</p>
            <p className="calc-step-text">Com a peça impressa e curada, meça a dimensão <strong>na base</strong> (primeiras camadas):</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>Dimensão teórica</strong> = valor no arquivo STL (ex: 20,000 mm)</li>
              <li><strong style={{ color: "var(--q-laranja)" }}>Dimensão medida na base</strong> = o que o paquímetro mostra na face inferior da peça (ex: 20,350 mm)</li>
              <li>Meça exatamente na primeira ou segunda camada — não no meio da peça</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><AlertTriangle size={15} /> Importante — resultado negativo é normal</p>
            <p className="calc-step-text">Se a base ficou maior que o STL, o resultado será negativo — isso é esperado:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li>Valor negativo = fatiador vai <strong style={{ color: "var(--primary)" }}>reduzir</strong> a base para compensar o pé de elefante</li>
              <li>Exemplo: base mediu 20,350 mm e STL tem 20,000 mm → compensação = −0,350 mm</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Printer size={15} /> Passo 3 — Aplique no fatiador</p>
            <p className="calc-step-text">Com o valor calculado, abra seu fatiador e localize:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>Chitubox:</strong> Configurações → Impressora → Compensação de Tolerância Inferior → cole o valor</li>
              <li><strong style={{ color: "var(--primary)" }}>Lychee Slicer:</strong> Configurações da impressora → Bottom Layer Compensation → cole o valor</li>
              <li>Reimprima a peça de referência para confirmar a correção</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

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
      <h2 className="calc-title">Tolerância Inferior — Pé de Elefante</h2>

      <Guia />

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
            Chitubox/Lychee: Compensação de Tolerância Inferior = {compensacao} mm<br />
            {parseFloat(compensacao) < 0
              ? "Valor negativo: fatiador vai reduzir a base para eliminar o pé de elefante."
              : "Valor positivo: a base ficou menor que o esperado — verifique a medição."}
          </div>
        </div>
      )}

      <div className="calc-info">
        <strong>Fórmula:</strong> Compensação = Teórico − Medido
      </div>
    </div>
  );
}
