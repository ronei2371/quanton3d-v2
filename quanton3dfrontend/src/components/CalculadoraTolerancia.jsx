import { useState } from "react";

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
    <div style={{ marginBottom: "24px" }}>
      {/* Card de introdução sempre visível */}
      <div style={{ background: "rgba(79,209,255,0.08)", border: "1px solid rgba(79,209,255,0.25)", borderRadius: "16px", padding: "18px", marginBottom: "12px" }}>
        <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#4fd1ff", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
          📐 O QUE É TOLERÂNCIA EM IMPRESSÃO 3D?
        </p>
        <p style={{ margin: "0 0 10px", color: "#d3e4f8", fontSize: "0.9rem", lineHeight: 1.7 }}>
          Quando você imprime uma peça em resina, ela raramente sai com o tamanho exato do arquivo STL.
          A luz UV espalha levemente para os lados durante a cura — isso faz as peças saírem <strong style={{ color: "#ffd166" }}>um pouco maiores</strong> do que o projetado.
        </p>
        <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.9rem", lineHeight: 1.7 }}>
          A <strong style={{ color: "#4fd1ff" }}>compensação X/Y</strong> (ou tolerância) é o ajuste que você faz no fatiador para corrigir esse erro antes de imprimir.
          Esta calculadora descobre o valor exato que você precisa colocar.
        </p>
      </div>

      {/* Botão expandir */}
      <button
        type="button"
        onClick={() => setExpandido(v => !v)}
        style={{ width: "100%", padding: "11px 16px", borderRadius: "12px", border: "1px solid rgba(79,209,255,0.3)", background: expandido ? "rgba(79,209,255,0.12)" : "rgba(255,255,255,0.04)", color: "#4fd1ff", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 800, textAlign: "left" }}>
        {expandido ? "▲ Ocultar guia completo de uso" : "▼ Ver guia completo — como medir e usar a calculadora"}
      </button>

      {expandido && (
        <div style={{ marginTop: "12px", display: "grid", gap: "12px" }}>

          {/* Passo 1 */}
          <div style={estiloCard("#ffd166")}>
            <p style={estiloTitulo("#ffd166")}>🖨️ PASSO 1 — Imprima um cubo de calibração</p>
            <p style={estiloTexto}>
              Antes de compensar qualquer peça, você precisa de uma referência. Faça assim:
            </p>
            <ul style={estiloLista}>
              <li>Imprima um cubo simples de <strong>20 × 20 × 20 mm</strong> (ou baixe o Gabarito Quanton3D nos guias do site)</li>
              <li>Use os parâmetros normais da sua resina e impressora</li>
              <li>Deixe curar completamente antes de medir</li>
            </ul>
          </div>

          {/* Passo 2 */}
          <div style={estiloCard("#49e68b")}>
            <p style={estiloTitulo("#49e68b")}>📏 PASSO 2 — Meça com paquímetro</p>
            <p style={estiloTexto}>
              Com o cubo impresso e curado, use um paquímetro digital para medir:
            </p>
            <ul style={estiloLista}>
              <li><strong style={{ color: "#4fd1ff" }}>Medida teórica</strong> = o valor no arquivo STL (ex: 20,000 mm)</li>
              <li><strong style={{ color: "#ffd166" }}>Medida real</strong> = o que o paquímetro mostra na peça impressa (ex: 20,140 mm)</li>
              <li>Meça em <strong>X e Y</strong> (largura e profundidade) — não precisa medir Z (altura)</li>
              <li>Se X e Y derem valores diferentes, use a média dos dois</li>
            </ul>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px 14px", marginTop: "10px", fontSize: "0.82rem", color: "#9fb4c7" }}>
              💡 <strong>Dica:</strong> Meça 3 vezes e use a média para maior precisão. Varie os pontos de medição.
            </div>
          </div>

          {/* Passo 3 — Externo vs Interno */}
          <div style={estiloCard("#b89cff")}>
            <p style={estiloTitulo("#b89cff")}>⚙️ PASSO 3 — Entenda Externo vs Interno</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
              <div style={{ background: "rgba(79,209,255,0.08)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(79,209,255,0.2)" }}>
                <p style={{ margin: "0 0 8px", fontWeight: 800, color: "#4fd1ff", fontSize: "0.82rem" }}>EXTERNO (campo a)</p>
                <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Usado para <strong>paredes externas</strong> da peça:<br />
                  • Cubos e blocos<br />
                  • Pinos macho<br />
                  • Dentes e protuberâncias<br />
                  • Qualquer dimensão de fora para dentro
                </p>
                <p style={{ margin: "8px 0 0", color: "#4fd1ff", fontSize: "0.78rem", fontStyle: "italic" }}>
                  → A peça saiu maior? O campo a encolhe o arquivo.
                </p>
              </div>
              <div style={{ background: "rgba(184,156,255,0.08)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(184,156,255,0.2)" }}>
                <p style={{ margin: "0 0 8px", fontWeight: 800, color: "#b89cff", fontSize: "0.82rem" }}>INTERNO (campo b)</p>
                <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Usado para <strong>dimensões internas</strong>:<br />
                  • Furos e buracos<br />
                  • Encaixes fêmea<br />
                  • Canais e ranhuras<br />
                  • Qualquer dimensão de dentro para fora
                </p>
                <p style={{ margin: "8px 0 0", color: "#b89cff", fontSize: "0.78rem", fontStyle: "italic" }}>
                  → O furo fechou? O campo b reabre os furos.
                </p>
              </div>
            </div>
          </div>

          {/* Passo 4 — Como calcular */}
          <div style={estiloCard("#4fd1ff")}>
            <p style={estiloTitulo("#4fd1ff")}>🔢 PASSO 4 — Como o cálculo funciona</p>
            <p style={estiloTexto}>
              A fórmula é simples: o erro acontece nos <strong>dois lados</strong> da parede, então dividimos por 2:
            </p>
            <div style={{ background: "rgba(4,12,24,0.6)", borderRadius: "10px", padding: "14px", fontFamily: "monospace", fontSize: "0.85rem", color: "#4fd1ff", lineHeight: 2, marginTop: "8px" }}>
              <div>📦 Externo: compensação = −(real − teórica) ÷ 2</div>
              <div>🔩 Interno: compensação = (teórica − real) ÷ 2</div>
            </div>
            <div style={{ background: "rgba(255,209,102,0.08)", borderRadius: "10px", padding: "12px 14px", marginTop: "10px" }}>
              <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#ffd166", fontSize: "0.82rem" }}>📌 EXEMPLO PRÁTICO:</p>
              <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.82rem", lineHeight: 1.7 }}>
                Arquivo: 20,000 mm → Peça impressa: 20,140 mm<br />
                Erro = 20,140 − 20,000 = <strong>0,140 mm</strong> maior<br />
                Compensação externa = −(0,140 ÷ 2) = <strong>−0,070 mm</strong><br />
                <em style={{ color: "#9fb4c7" }}>Digite −0,070 no campo "a" do fatiador</em>
              </p>
            </div>
          </div>

          {/* Passo 5 — Onde colocar */}
          <div style={estiloCard("#ff8fab")}>
            <p style={estiloTitulo("#ff8fab")}>💻 PASSO 5 — Onde colocar no fatiador</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#ff8fab", fontSize: "0.82rem" }}>CHITUBOX</p>
                <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Configurações → Impressora →<br />
                  <strong>X/Y Compensation</strong><br />
                  Campo a = Externo<br />
                  Campo b = Interno
                </p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 800, color: "#ff8fab", fontSize: "0.82rem" }}>LYCHEE SLICER</p>
                <p style={{ margin: 0, color: "#d3e4f8", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Propriedades → Printer Settings →<br />
                  <strong>XY Tolerance</strong><br />
                  Inner / Outer<br />
                  (mesmo conceito)
                </p>
              </div>
            </div>
          </div>

          {/* Dicas importantes */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.15)", borderRadius: "14px", padding: "16px" }}>
            <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#9fb4c7", fontSize: "0.82rem", letterSpacing: "0.06em" }}>⚠️ DICAS IMPORTANTES</p>
            <ul style={{ ...estiloLista, color: "#9fb4c7" }}>
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

const estiloCard = (cor) => ({
  background: `rgba(${cor === "#ffd166" ? "255,209,102" : cor === "#49e68b" ? "73,230,139" : cor === "#b89cff" ? "184,156,255" : cor === "#4fd1ff" ? "79,209,255" : "255,143,171"},0.06)`,
  border: `1px solid ${cor}44`,
  borderRadius: "14px",
  padding: "16px",
});
const estiloTitulo = (cor) => ({ margin: "0 0 10px", fontWeight: 800, color: cor, fontSize: "0.85rem" });
const estiloTexto = { margin: "0 0 8px", color: "#d3e4f8", fontSize: "0.88rem", lineHeight: 1.7 };
const estiloLista = { margin: "0", paddingLeft: "18px", fontSize: "0.85rem", lineHeight: 1.9, color: "#d3e4f8" };

function ToleranceCard({ title, description, valores, tipo, onChange, onCalculate, buttonLabel }) {
  const baseId = `tolerancia-${tipo}`;
  const teoricaId = `${baseId}-teorica`;
  const realId = `${baseId}-real`;
  const resultadoId = `${baseId}-resultado`;

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(113,159,219,0.2)", borderRadius: "14px", padding: "18px" }}>
      <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.95rem" }}>{title}</p>
      <p style={{ margin: "0 0 16px", color: "#9fb4c7", fontSize: "0.82rem", lineHeight: 1.5 }}>{description}</p>

      <label htmlFor={teoricaId} style={{ display: "block", marginBottom: "12px" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#a8bad2", display: "block", marginBottom: "5px" }}>
          Medida no arquivo STL (teórica)
        </span>
        <input
          id={teoricaId} type="text" inputMode="decimal" autoComplete="off"
          value={valores.teorica} onChange={(e) => onChange(tipo, "teorica", e.target.value)}
          placeholder="Ex.: 20,000"
          style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(4,12,24,0.55)", color: "#eaf3ff", fontSize: "14px", boxSizing: "border-box" }}
        />
      </label>

      <label htmlFor={realId} style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#a8bad2", display: "block", marginBottom: "5px" }}>
          Medida no paquímetro (real impressa)
        </span>
        <input
          id={realId} type="text" inputMode="decimal" autoComplete="off"
          value={valores.real} onChange={(e) => onChange(tipo, "real", e.target.value)}
          placeholder="Ex.: 20,140"
          style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(4,12,24,0.55)", color: "#eaf3ff", fontSize: "14px", boxSizing: "border-box" }}
        />
      </label>

      <button
        type="button" onClick={onCalculate}
        style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #1a73e8, #1565c0)", color: "white", fontWeight: 900, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit" }}>
        {buttonLabel}
      </button>

      <div
        id={resultadoId} role="status" aria-live="polite"
        style={{
          marginTop: "12px", padding: "12px 14px", borderRadius: "10px", textAlign: "center",
          background: valores.erro ? "rgba(255,107,107,0.1)" : valores.resultado !== null ? "rgba(73,230,139,0.1)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${valores.erro ? "rgba(255,107,107,0.35)" : valores.resultado !== null ? "rgba(73,230,139,0.35)" : "rgba(113,159,219,0.15)"}`,
          color: valores.erro ? "#ff8fab" : valores.resultado !== null ? "#49e68b" : "#9fb4c7",
          fontWeight: valores.resultado !== null ? 800 : "normal",
          fontSize: valores.resultado !== null ? "1.1rem" : "0.85rem",
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
    <div className="modal-rich-content">
      <Guia />

      <p style={{ margin: "0 0 16px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.95rem", letterSpacing: "0.04em" }}>
        📐 CALCULADORA
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <ToleranceCard
          title="COMPENSAÇÃO EXTERNA — campo a"
          description="Para paredes externas, pinos macho, cubos e qualquer dimensão de fora para dentro."
          valores={externo} tipo="externo" onChange={alterar}
          onCalculate={calcularExterno} buttonLabel="Calcular Compensação Externa"
        />
        <ToleranceCard
          title="COMPENSAÇÃO INTERNA — campo b"
          description="Para furos, encaixes fêmea, canais e qualquer dimensão de dentro para fora."
          valores={interno} tipo="interno" onChange={alterar}
          onCalculate={calcularInterno} buttonLabel="Calcular Compensação Interna"
        />
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          type="button" onClick={limpar}
          style={{ padding: "10px 28px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(255,255,255,0.05)", color: "#9fb4c7", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem" }}>
          Limpar campos
        </button>
      </div>
    </div>
  );
}
