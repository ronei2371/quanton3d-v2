import { useState } from "react";
import { Ruler, Printer, ScanLine, Cog, Calculator, MonitorCog, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

function normalizarMedida(valor) {
  const texto = String(valor || "").trim().replace(/\s/g, "");
  if (!texto || texto.startsWith("-")) return NaN;
  const normalizado = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : NaN;
}

function formatarMm(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";
  return `${numero.toFixed(3).replace(".", ",")} mm`;
}

function Guia() {
  const [expandido, setExpandido] = useState(false);
  return (
    <div style={{ marginBottom: "20px" }}>
      <div className="q-alert q-alert--info">
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.82rem" }}>O que é tolerância em impressão 3D?</p>
        <p style={{ margin: "0 0 10px", lineHeight: 1.7 }}>
          Quando você imprime uma peça em resina, ela raramente sai com o tamanho exato do arquivo STL.
          A luz UV espalha levemente para os lados durante a cura — isso faz as peças saírem <strong style={{ color: "var(--q-laranja)" }}>um pouco maiores</strong> do que o projetado.
        </p>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          A <strong style={{ color: "var(--primary)" }}>compensação X/Y</strong> (ou tolerância) é o ajuste que você faz no fatiador para corrigir esse erro antes de imprimir.
          Esta calculadora descobre o valor exato que você precisa colocar.
        </p>
      </div>

      <button type="button" className="q-btn q-btn--ghost q-btn--block" style={{ marginTop: "12px" }} onClick={() => setExpandido(v => !v)}>
        {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expandido ? "Ocultar guia completo de uso" : "Ver guia completo — como medir e usar a calculadora"}
      </button>

      {expandido && (
        <div style={{ marginTop: "12px", display: "grid", gap: "12px" }}>
          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Printer size={15} /> Passo 1 — Imprima um cubo de calibração</p>
            <p className="calc-step-text">Antes de compensar qualquer peça, você precisa de uma referência. Faça assim:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li>Imprima um cubo simples de <strong style={{ color: "var(--text-primary)" }}>20 × 20 × 20 mm</strong> (ou baixe o Gabarito Quanton3D nos guias do site)</li>
              <li>Use os parâmetros normais da sua resina e impressora</li>
              <li>Deixe curar completamente antes de medir</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Ruler size={15} /> Passo 2 — Meça com paquímetro</p>
            <p className="calc-step-text">Com o cubo impresso e curado, use um paquímetro digital para medir:</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>Medida teórica</strong> = o valor no arquivo STL (ex: 20,000 mm)</li>
              <li><strong style={{ color: "var(--q-laranja)" }}>Medida real</strong> = o que o paquímetro mostra na peça impressa (ex: 20,140 mm)</li>
              <li>Meça em <strong>X e Y</strong> (largura e profundidade) — não precisa medir Z (altura)</li>
              <li>Se X e Y derem valores diferentes, use a média dos dois</li>
            </ul>
            <div className="calc-tip" style={{ marginTop: "10px" }}>
              <span><strong>Dica:</strong> Meça 3 vezes e use a média para maior precisão. Varie os pontos de medição.</span>
            </div>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Cog size={15} /> Passo 3 — Entenda Externo vs Interno</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
              <div className="calc-highlight-box" style={{ marginBottom: 0 }}>
                <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--primary)", fontSize: "0.82rem" }}>EXTERNO (campo a)</p>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Usado para <strong>paredes externas</strong> da peça:<br />
                  • Cubos e blocos<br />
                  • Pinos macho<br />
                  • Dentes e protuberâncias<br />
                  • Qualquer dimensão de fora para dentro
                </p>
                <p style={{ margin: "8px 0 0", color: "var(--primary)", fontSize: "0.78rem", fontStyle: "italic" }}>
                  → A peça saiu maior? O campo a encolhe o arquivo.
                </p>
              </div>
              <div className="calc-highlight-box" style={{ marginBottom: 0, background: "rgba(150,80,245,0.06)", borderColor: "rgba(150,80,245,0.22)" }}>
                <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--q-ametista)", fontSize: "0.82rem" }}>INTERNO (campo b)</p>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Usado para <strong>dimensões internas</strong>:<br />
                  • Furos e buracos<br />
                  • Encaixes fêmea<br />
                  • Canais e ranhuras<br />
                  • Qualquer dimensão de dentro para fora
                </p>
                <p style={{ margin: "8px 0 0", color: "var(--q-ametista)", fontSize: "0.78rem", fontStyle: "italic" }}>
                  → O furo fechou? O campo b reabre os furos.
                </p>
              </div>
            </div>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Calculator size={15} /> Passo 4 — Como o cálculo funciona</p>
            <p className="calc-step-text">A fórmula é simples: o erro acontece nos <strong>dois lados</strong> da parede, então dividimos por 2:</p>
            <div style={{ background: "var(--bg-void)", borderRadius: "var(--r-sm)", padding: "14px", fontFamily: "monospace", fontSize: "0.82rem", color: "var(--primary)", lineHeight: 2, marginTop: "8px" }}>
              <div>Externo: compensação = −(real − teórica) ÷ 2</div>
              <div>Interno: compensação = (teórica − real) ÷ 2</div>
            </div>
            <div className="calc-tip" style={{ marginTop: "10px", background: "rgba(220,145,60,0.07)", borderColor: "rgba(220,145,60,0.22)" }}>
              <div>
                <strong style={{ color: "var(--q-laranja)" }}>Exemplo prático:</strong><br />
                Arquivo: 20,000 mm → Peça impressa: 20,140 mm<br />
                Erro = 20,140 − 20,000 = <strong style={{ color: "var(--text-primary)" }}>0,140 mm</strong> maior<br />
                Compensação externa = −(0,140 ÷ 2) = <strong style={{ color: "var(--text-primary)" }}>−0,070 mm</strong><br />
                <em>Digite −0,070 no campo "a" do fatiador</em>
              </div>
            </div>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><MonitorCog size={15} /> Passo 5 — Onde colocar no fatiador</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
              <div style={{ background: "var(--bg-void)", borderRadius: "var(--r-sm)", padding: "12px" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--text-primary)", fontSize: "0.82rem" }}>CHITUBOX</p>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Configurações → Impressora →<br />
                  <strong>X/Y Compensation</strong><br />
                  Campo a = Externo<br />
                  Campo b = Interno
                </p>
              </div>
              <div style={{ background: "var(--bg-void)", borderRadius: "var(--r-sm)", padding: "12px" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--text-primary)", fontSize: "0.82rem" }}>LYCHEE SLICER</p>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Propriedades → Printer Settings →<br />
                  <strong>XY Tolerance</strong><br />
                  Inner / Outer<br />
                  (mesmo conceito)
                </p>
              </div>
            </div>
          </div>

          <div className="q-alert q-alert--warning" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9 }}>
              <li>A compensação <strong>varia por resina</strong> — cada resina tem uma sensibilidade diferente ao UV</li>
              <li>A compensação <strong>varia por impressora</strong> — potência do LED e qualidade do FEP influenciam</li>
              <li>Sempre recalibre quando <strong>trocar de resina ou de FEP</strong></li>
              <li>A pós-cura UV pode <strong>encolher levemente</strong> a peça — meça sempre após a pós-cura completa</li>
              <li>Valores típicos ficam entre <strong>−0,050 e −0,150 mm</strong> para o campo externo</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ToleranceCard({ title, description, valores, tipo, onChange, onCalculate, buttonLabel }) {
  const baseId = `tolerancia-${tipo}`;
  const teoricaId = `${baseId}-teorica`;
  const realId = `${baseId}-real`;
  const resultadoId = `${baseId}-resultado`;

  return (
    <div className="calc-form-card" style={{ marginBottom: 0 }}>
      <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--text-primary)", fontSize: "0.88rem" }}>{title}</p>
      <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.5 }}>{description}</p>

      <label htmlFor={teoricaId} className="calc-field" style={{ marginBottom: "12px" }}>
        <span className="calc-label">Medida no arquivo STL (teórica)</span>
        <input
          id={teoricaId} type="text" inputMode="decimal" autoComplete="off" className="calc-input"
          value={valores.teorica} onChange={(e) => onChange(tipo, "teorica", e.target.value)}
          placeholder="Ex.: 20,000"
        />
      </label>

      <label htmlFor={realId} className="calc-field" style={{ marginBottom: "16px" }}>
        <span className="calc-label">Medida no paquímetro (real impressa)</span>
        <input
          id={realId} type="text" inputMode="decimal" autoComplete="off" className="calc-input"
          value={valores.real} onChange={(e) => onChange(tipo, "real", e.target.value)}
          placeholder="Ex.: 20,140"
        />
      </label>

      <button type="button" className="q-btn q-btn--primary q-btn--block" onClick={onCalculate}>
        {buttonLabel}
      </button>

      <div
        id={resultadoId} role="status" aria-live="polite"
        className={"q-alert " + (valores.erro ? "q-alert--error" : valores.resultado !== null ? "q-alert--success" : "")}
        style={{
          marginTop: "12px", textAlign: "center", marginBottom: 0,
          ...(valores.erro || valores.resultado !== null ? {} : { background: "var(--bg-void)", border: "1px solid var(--border-soft)", color: "var(--text-secondary)" }),
          fontWeight: valores.resultado !== null ? 800 : 400,
          fontSize: valores.resultado !== null ? "1.05rem" : "0.85rem",
        }}>
        {valores.erro
          ? valores.erro
          : valores.resultado === null
            ? "O resultado aparecerá aqui após calcular"
            : `Digite ${formatarMm(valores.resultado)} no campo ${tipo === "externo" ? '"a"' : '"b"'} do fatiador`}
      </div>
    </div>
  );
}

export default function CalculadoraTolerancia() {
  const [externo, setExterno] = useState({ teorica: "", real: "", resultado: null, erro: "" });
  const [interno, setInterno] = useState({ teorica: "", real: "", resultado: null, erro: "" });

  function alterar(tipo, campo, valor) {
    const setter = tipo === "externo" ? setExterno : setInterno;
    setter((atual) => ({ ...atual, [campo]: valor, erro: "" }));
  }

  function calcularExterno() {
    const vT = normalizarMedida(externo.teorica);
    const vR = normalizarMedida(externo.real);
    if (isNaN(vT) || isNaN(vR)) {
      setExterno(a => ({ ...a, resultado: null, erro: "Informe medidas válidas e positivas nos dois campos." }));
      return;
    }
    const resultado = Number((-(vR - vT) / 2).toFixed(6));
    setExterno(a => ({ ...a, resultado, erro: "" }));
  }

  function calcularInterno() {
    const vT = normalizarMedida(interno.teorica);
    const vR = normalizarMedida(interno.real);
    if (isNaN(vT) || isNaN(vR)) {
      setInterno(a => ({ ...a, resultado: null, erro: "Informe medidas válidas e positivas nos dois campos." }));
      return;
    }
    const resultado = Number(((vT - vR) / 2).toFixed(6));
    setInterno(a => ({ ...a, resultado, erro: "" }));
  }

  function limpar() {
    setExterno({ teorica: "", real: "", resultado: null, erro: "" });
    setInterno({ teorica: "", real: "", resultado: null, erro: "" });
  }

  return (
    <section className="calc-section">
      <div className="calc-header">
        <span className="calc-badge"><ScanLine size={12} /> Encaixe e calibração</span>
        <h2 className="calc-title">Calculadora de Tolerância X/Y</h2>
        <p className="calc-subtitle">Descubra o valor exato de compensação para o seu fatiador e imprima peças que encaixam de primeira, sem tentativa e erro.</p>
      </div>

      <Guia />

      <div className="calc-grid-2" style={{ marginTop: "6px" }}>
        <ToleranceCard
          title="Compensação externa — campo a"
          description="Para paredes externas, pinos macho, cubos e qualquer dimensão de fora para dentro."
          valores={externo} tipo="externo" onChange={alterar}
          onCalculate={calcularExterno} buttonLabel="Calcular Compensação Externa"
        />
        <ToleranceCard
          title="Compensação interna — campo b"
          description="Para furos, encaixes fêmea, canais e qualquer dimensão de dentro para fora."
          valores={interno} tipo="interno" onChange={alterar}
          onCalculate={calcularInterno} buttonLabel="Calcular Compensação Interna"
        />
      </div>

      <div style={{ textAlign: "center", marginTop: "18px" }}>
        <button type="button" className="q-btn q-btn--ghost" onClick={limpar}>
          Limpar campos
        </button>
      </div>
    </section>
  );
}
