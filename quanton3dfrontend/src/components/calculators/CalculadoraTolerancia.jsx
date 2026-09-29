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
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.82rem" }}>Para que serve esta calculadora?</p>
        <p style={{ margin: "0 0 10px", lineHeight: 1.7 }}>
          Mesmo com a exposição certa, a luz UV espalha um pouco nas bordas: a parede externa tende a sair{" "}
          <strong style={{ color: "var(--q-laranja)" }}>um pouco maior</strong> e o furo{" "}
          <strong style={{ color: "var(--q-laranja)" }}>um pouco menor</strong> que o arquivo.
        </p>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          A <strong style={{ color: "var(--primary)" }}>compensação de tolerância</strong> do fatiador corrige essa sobra fina.{" "}
          <strong>Antes, calibre a exposição normal com o gabarito Quanton3D</strong> (teste do pino): compensação serve para o ajuste fino que sobra, não para esconder exposição errada.
        </p>
      </div>

      <button type="button" className="q-btn q-btn--ghost q-btn--block" style={{ marginTop: "12px" }} onClick={() => setExpandido(v => !v)}>
        {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expandido ? "Ocultar guia completo de uso" : "Ver guia completo — como medir e usar a calculadora"}
      </button>

      {expandido && (
        <div style={{ marginTop: "12px", display: "grid", gap: "12px" }}>
          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Printer size={15} /> Passo 1 — Imprima uma peça de teste com furo</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li>Use um bloco simples, por exemplo <strong style={{ color: "var(--text-primary)" }}>20 × 20 mm com um furo de 6 mm</strong> no meio</li>
              <li>Use o perfil da sua resina já calibrado no gabarito Quanton3D</li>
              <li>Lave, seque e faça a pós-cura completa antes de medir (a medida muda um pouco na cura)</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Ruler size={15} /> Passo 2 — Meça com paquímetro</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--primary)" }}>Medida do arquivo</strong> = a do projeto (ex.: parede 20,000 mm; furo 6,000 mm)</li>
              <li><strong style={{ color: "var(--q-laranja)" }}>Medida real</strong> = o que o paquímetro mostra na peça (ex.: 20,140 mm; furo 5,800 mm)</li>
              <li>Meça <strong>no meio da altura</strong> da peça, longe da base (a base tem o "pé de elefante", que tem calculadora própria)</li>
              <li>Meça 3 vezes em pontos diferentes e use a média</li>
            </ul>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Cog size={15} /> Passo 3 — Externo ou interno?</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginTop: "8px" }}>
              <div className="calc-highlight-box" style={{ marginBottom: 0 }}>
                <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--primary)", fontSize: "0.82rem" }}>EXTERNO — campo b no Chitubox</p>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Medidas por fora: largura de blocos, pinos macho, dentes, abas.
                </p>
              </div>
              <div className="calc-highlight-box" style={{ marginBottom: 0, background: "rgba(150,80,245,0.06)", borderColor: "rgba(150,80,245,0.22)" }}>
                <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--q-ametista)", fontSize: "0.82rem" }}>INTERNO — campo a no Chitubox</p>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Medidas por dentro: furos, encaixes fêmea, canais e ranhuras.
                </p>
              </div>
            </div>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><Calculator size={15} /> Passo 4 — Como a conta é feita</p>
            <p className="calc-step-text">O fatiador aplica o valor em <strong>cada lado</strong> da parede, por isso a diferença é dividida por 2:</p>
            <div style={{ background: "var(--bg-void)", borderRadius: "var(--r-sm)", padding: "14px", fontFamily: "monospace", fontSize: "0.82rem", color: "var(--primary)", lineHeight: 2, marginTop: "8px" }}>
              <div>Externo (b) = (arquivo − real) ÷ 2</div>
              <div>Interno (a) = (real − arquivo) ÷ 2</div>
            </div>
            <div className="calc-tip" style={{ marginTop: "10px", background: "rgba(220,145,60,0.07)", borderColor: "rgba(220,145,60,0.22)" }}>
              <div>
                <strong style={{ color: "var(--q-laranja)" }}>Exemplos:</strong><br />
                Parede: arquivo 20,000 → real 20,140 (saiu maior) → b = −0,070 mm (diminui por fora)<br />
                Furo: arquivo 6,000 → real 5,800 (saiu apertado) → a = −0,100 mm (abre o furo)
              </div>
            </div>
          </div>

          <div className="calc-guide-card">
            <p className="calc-guide-card-title"><MonitorCog size={15} /> Passo 5 — Onde colocar no fatiador</p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9, color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--text-primary)" }}>CHITUBOX:</strong> configurações de impressão → aba <strong>Avançado</strong> → ative <strong>Compensação de tolerância</strong> (Tolerance Compensation). <strong>a</strong> = diâmetro interno (furo): valor maior fecha o furo, menor abre. <strong>b</strong> = diâmetro externo: valor maior aumenta a peça, menor diminui.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Outros fatiadores (Lychee e outros):</strong> o nome muda (ex.: compensação XY). Use o mesmo valor por lado e confira o sentido imprimindo a peça de teste de novo.</li>
            </ul>
          </div>

          <div className="q-alert q-alert--warning" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.82rem", lineHeight: 1.9 }}>
              <li>O valor muda com a <strong>resina</strong>, a <strong>impressora</strong> e a <strong>exposição</strong>: refaça quando trocar qualquer um deles (e ao trocar a tela LCD)</li>
              <li>Se a peça saiu <strong>menor por fora E com o furo também menor</strong>, não é tolerância: veja escala/unidade no fatiador ou a Calculadora de Encolhimento</li>
              <li>Diferença grande (mais de 0,5 mm) quase nunca é tolerância: confira exposição, escala e unidade primeiro</li>
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
        <span className="calc-label">Medida no arquivo (projeto)</span>
        <input
          id={teoricaId} type="text" inputMode="decimal" autoComplete="off" className="calc-input"
          value={valores.teorica} onChange={(e) => onChange(tipo, "teorica", e.target.value)}
          placeholder={tipo === "externo" ? "Ex.: 20,000" : "Ex.: 6,000"}
        />
      </label>

      <label htmlFor={realId} className="calc-field" style={{ marginBottom: "16px" }}>
        <span className="calc-label">Medida no paquímetro (real impressa)</span>
        <input
          id={realId} type="text" inputMode="decimal" autoComplete="off" className="calc-input"
          value={valores.real} onChange={(e) => onChange(tipo, "real", e.target.value)}
          placeholder={tipo === "externo" ? "Ex.: 20,140" : "Ex.: 5,800"}
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
            : `Digite ${formatarMm(valores.resultado)} no campo ${tipo === "externo" ? '"b" (externo)' : '"a" (interno)'} do Chitubox`}
        {valores.aviso && <span style={{ display: "block", marginTop: "8px", fontSize: "0.8rem", fontWeight: 600 }}>{valores.aviso}</span>}
      </div>
    </div>
  );
}

export default function CalculadoraTolerancia() {
  const [externo, setExterno] = useState({ teorica: "", real: "", resultado: null, erro: "", aviso: "" });
  const [interno, setInterno] = useState({ teorica: "", real: "", resultado: null, erro: "", aviso: "" });

  function alterar(tipo, campo, valor) {
    const setter = tipo === "externo" ? setExterno : setInterno;
    setter((atual) => ({ ...atual, [campo]: valor, erro: "" }));
  }

  // Valida as duas medidas e devolve o aviso quando a diferenca e grande demais para ser tolerancia.
  function lerMedidas(v) {
    const vT = normalizarMedida(v.teorica);
    const vR = normalizarMedida(v.real);
    if (!(vT > 0) || !(vR > 0)) return { erro: "Informe as duas medidas em mm, maiores que zero (ex.: 20,140)." };
    const dif = Math.abs(vR - vT);
    const aviso = dif > 0.5 || dif / vT > 0.05
      ? "Diferença grande para tolerância: confira exposição (gabarito), escala e unidade do fatiador antes de usar este valor."
      : "";
    return { vT, vR, aviso };
  }

  function calcularExterno() {
    const m = lerMedidas(externo);
    if (m.erro) { setExterno(a => ({ ...a, resultado: null, erro: m.erro, aviso: "" })); return; }
    // Chitubox campo b (diametro externo): valor menor diminui a peca. Peca maior -> b negativo.
    const resultado = Number(((m.vT - m.vR) / 2).toFixed(6));
    setExterno(a => ({ ...a, resultado, erro: "", aviso: m.aviso }));
  }

  function calcularInterno() {
    const m = lerMedidas(interno);
    if (m.erro) { setInterno(a => ({ ...a, resultado: null, erro: m.erro, aviso: "" })); return; }
    // Chitubox campo a (diametro interno): valor maior fecha o furo, menor abre. Furo apertado -> a negativo.
    const resultado = Number(((m.vR - m.vT) / 2).toFixed(6));
    setInterno(a => ({ ...a, resultado, erro: "", aviso: m.aviso }));
  }

  function limpar() {
    setExterno({ teorica: "", real: "", resultado: null, erro: "", aviso: "" });
    setInterno({ teorica: "", real: "", resultado: null, erro: "", aviso: "" });
  }

  return (
    <section className="calc-section">
      <div className="calc-header">
        <span className="calc-badge"><ScanLine size={12} /> Encaixe e calibração</span>
        <h2 className="calc-title">Calculadora de Tolerância X/Y</h2>
        <p className="calc-subtitle">Meça a peça de teste, informe a medida do arquivo e a real, e veja o valor de compensação para colocar no fatiador.</p>
      </div>

      <Guia />

      <div className="calc-grid-2" style={{ marginTop: "6px" }}>
        <ToleranceCard
          title="Compensação externa — campo b"
          description="Medidas por fora: largura de blocos, pinos macho, dentes e abas."
          valores={externo} tipo="externo" onChange={alterar}
          onCalculate={calcularExterno} buttonLabel="Calcular Compensação Externa"
        />
        <ToleranceCard
          title="Compensação interna — campo a"
          description="Medidas por dentro: furos, encaixes fêmea, canais e ranhuras."
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
