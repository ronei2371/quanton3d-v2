import { useState } from "react";
import { ChevronDown, ChevronUp, Printer, Ruler } from "lucide-react";

function Guia() {
  const [expandido, setExpandido] = useState(false);
  return (
    <div style={{ marginBottom: "20px" }}>
      <div className="q-alert q-alert--info">
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.82rem" }}>O que é compensação de encolhimento?</p>
        <p style={{ margin: "0 0 10px", lineHeight: 1.7 }}>
          Durante a polimerização UV, a resina{" "}
          <strong style={{ color: "var(--q-laranja)" }}>contrai levemente</strong> — as peças saem um pouco
          menores que o arquivo STL. Quanto mais crítica a dimensão, maior o impacto desse erro.
        </p>
        <p style={{ margin: "0 0 10px", lineHeight: 1.7 }}>
          A <strong style={{ color: "var(--primary)" }}>compensação de encolhimento (Scale)</strong> é um fator
          percentual aplicado no fatiador. Como a peça vai contrair, o fatiador amplia o modelo antes de fatiar —
          e após a contração a peça sai com o tamanho certo.
        </p>
        <p style={{ margin: "0 0 10px", lineHeight: 1.7 }}>
          O valor será <strong style={{ color: "var(--primary)" }}>maior que 100%</strong> (ex: 101,266%) — isso
          é normal e esperado.
        </p>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          <strong>Qual calculadora usar?</strong> Se a peça saiu menor por fora <strong>e os furos também ficaram menores</strong> (tudo diminuiu junto), é encolhimento: use esta.
          Se saiu maior por fora e com os furos apertados, é tolerância: use a Calculadora de Tolerância X/Y. Se saiu menor por fora e com os furos maiores, a exposição está baixa: calibre com o gabarito Quanton3D.
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
              <li>Imprima uma peça com medida conhecida e grande o bastante para medir bem (ex.: bloco de <strong style={{ color: "var(--text-primary)" }}>50 × 50 mm</strong>; quanto maior a peça, mais preciso o %)</li>
              <li>Use o perfil da sua resina já calibrado no gabarito Quanton3D</li>
              <li>Lave, seque e faça a pós-cura completa antes de medir: o encolhimento acontece principalmente na cura</li>
              <li>Antes, confira se a escala e a unidade (mm) do arquivo no fatiador estão corretas</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Ruler size={15} /> Passo 2 — Meça com paquímetro</p>
            <p className="calc-step-text">Com a peça impressa e curada, use um paquímetro digital para medir:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>Medida no arquivo</strong> = a do projeto (ex: 50,000 mm)</li>
              <li><strong style={{ color: "var(--q-laranja)" }}>Medida real</strong> = o que o paquímetro mostra na peça curada (ex: 49,600 mm)</li>
              <li>Meça <strong style={{ color: "var(--text-primary)" }}>no meio da peça</strong> (X e Y) — evite medir na base, o pé de elefante pode distorcer o resultado</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Printer size={15} /> Passo 3 — Aplique no fatiador</p>
            <p className="calc-step-text">Com o valor calculado, abra seu fatiador e localize:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>CHITUBOX:</strong> configurações de impressão → aba <strong>Avançado</strong> → <strong>Compensação de encolhimento</strong> (Shrinkage Compensation) → coloque o valor em %</li>
              <li><strong style={{ color: "var(--primary)" }}>Outros fatiadores:</strong> use a ferramenta <strong>Escala (Scale)</strong> do modelo com o mesmo %</li>
              <li>Meça X e Y separados; se derem diferentes, use cada um no seu eixo (ou a média)</li>
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

  const vT = parseFloat(teorico);
  const vM = parseFloat(medido);
  const escala = vT > 0 && vM > 0 ? ((vT / vM) * 100).toFixed(3) : null;
  // Mais de 5% de diferenca nao e encolhimento de resina: quase sempre e escala/unidade errada.
  const diferencaGrande = escala !== null && Math.abs(parseFloat(escala) - 100) > 5;

  const ok = escala !== null;

  return (
    <div className="calc-wrapper">
      <h2 className="calc-title">Compensação de Encolhimento</h2>

      <Guia />

      <div className="calc-row">
        <label className="calc-label">Medida no arquivo (mm)</label>
        <input
          type="number"
          className="calc-input"
          placeholder="Ex: 50.000"
          value={teorico}
          onChange={(e) => setTeorico(e.target.value)}
          step="0.001"
          min="0"
        />
      </div>

      <div className="calc-row">
        <label className="calc-label">Medida real, depois da pós-cura (mm)</label>
        <input
          type="number"
          className="calc-input"
          placeholder="Ex: 49.600"
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
            CHITUBOX: Compensação de encolhimento = {escala}% · Outros fatiadores: Escala = {escala}%<br />
            {parseFloat(escala) > 100
              ? "Valor acima de 100%: o fatiador amplia o modelo para compensar a contração."
              : "Valor abaixo de 100%: a peça saiu maior que o arquivo. Isso não é encolhimento: veja a Calculadora de Tolerância X/Y e a exposição."}
            {diferencaGrande && <><br /><strong>Diferença acima de 5%: isso não é encolhimento da resina. Confira escala e unidade (mm/polegada) no fatiador.</strong></>}
          </div>
        </div>
      )}

      <div className="calc-info">
        <strong>Fórmula:</strong> Scale (%) = (Teórico ÷ Medido) × 100
      </div>
    </div>
  );
}
