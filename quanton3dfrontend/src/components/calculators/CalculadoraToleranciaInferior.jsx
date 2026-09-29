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
          que o fatiador usa só nas camadas de base para encolher essa sobra. Antes de compensar, confira se a exposição e as camadas de base
          são as do perfil oficial: exposição de base alta demais aumenta o pé de elefante.
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
              <li>Imprima um cubo simples de <strong style={{ color: "var(--text-primary)" }}>20 × 20 × 20 mm</strong> <strong>direto na plataforma, sem suportes</strong> (o pé de elefante só aparece na base colada na plataforma)</li>
              <li>Use o perfil da sua resina, sem compensação de tolerância inferior ligada</li>
              <li>Deixe curar completamente antes de medir</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Ruler size={15} /> Passo 2 — Meça a base com paquímetro</p>
            <p className="calc-step-text">Com a peça impressa e curada, meça a dimensão <strong>na base</strong> (primeiras camadas):</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>Dimensão teórica</strong> = valor no arquivo STL (ex: 20,000 mm)</li>
              <li><strong style={{ color: "var(--q-laranja)" }}>Dimensão medida na base</strong> = o que o paquímetro mostra na face inferior da peça (ex: 20,350 mm)</li>
              <li>Meça bem rente à base (onde a sobra aparece) — não no meio da peça</li>
              <li>Meça também no meio da peça: se o meio já estiver maior que o arquivo, corrija primeiro com a Calculadora de Tolerância X/Y</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><AlertTriangle size={15} /> Importante — resultado negativo é normal</p>
            <p className="calc-step-text">Se a base ficou maior que o STL, o resultado será negativo — isso é esperado:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li>Valor negativo = fatiador vai <strong style={{ color: "var(--primary)" }}>reduzir</strong> a base para compensar o pé de elefante</li>
              <li>O fatiador aplica o valor em <strong>cada lado</strong>, por isso a diferença é dividida por 2</li>
              <li>Exemplo: base mediu 20,350 mm e o arquivo tem 20,000 mm → compensação = (20,000 − 20,350) ÷ 2 = −0,175 mm</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Printer size={15} /> Passo 3 — Aplique no fatiador</p>
            <p className="calc-step-text">Com o valor calculado, abra seu fatiador e localize:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>CHITUBOX:</strong> configurações de impressão → aba <strong>Avançado</strong> → ative <strong>Compensação de tolerância inferior</strong> (Bottom Tolerance Compensation) → coloque o valor no campo <strong>b</strong> (diâmetro externo). Se um furo perto da base saiu apertado, o campo <strong>a</strong> usa o mesmo valor (negativo abre o furo).</li>
              <li><strong style={{ color: "var(--primary)" }}>Outros fatiadores:</strong> procure "elephant foot" ou compensação das camadas de base; use o valor por lado e confira reimprimindo</li>
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

  // Valor por lado (o fatiador aplica nos dois lados da parede): (arquivo - medido) / 2.
  const vT = parseFloat(teorico);
  const vM = parseFloat(medido);
  const ok = vT > 0 && vM > 0;
  const compensacao = ok ? ((vT - vM) / 2).toFixed(3) : null;
  const diferencaGrande = ok && Math.abs(vM - vT) > 1;

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
          min="0"
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
          min="0"
        />
      </div>

      {ok && (
        <div className="calc-result">
          <div className="calc-result-label">Compensação a inserir no fatiador:</div>
          <div className="calc-result-value">{compensacao} mm</div>
          <div className="calc-result-hint">
            CHITUBOX: Compensação de tolerância inferior → campo b = {compensacao} mm<br />
            {parseFloat(compensacao) < 0
              ? "Valor negativo: o fatiador diminui só as camadas de base e tira o pé de elefante."
              : "Valor zero ou positivo: a base não ficou maior que o arquivo. Não há pé de elefante para corrigir; confira a medição."}
            {diferencaGrande && <><br /><strong>Diferença acima de 1 mm: confira exposição de base, número de camadas de base e se a peça foi medida no lugar certo.</strong></>}
          </div>
        </div>
      )}

      <div className="calc-info">
        <strong>Fórmula:</strong> Compensação (por lado) = (Arquivo − Medido na base) ÷ 2
      </div>
    </div>
  );
}
