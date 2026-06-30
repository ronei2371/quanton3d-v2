import { useState } from "react";

// ---------- Normalização (padrão BR + ponto) ----------
function normalizarMedida(valor) {
  const texto = String(valor || "").trim().replace(/\s/g, "");

  if (!texto || texto.startsWith("-")) return NaN;

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : NaN;
}

// ---------- Formatação (3 casas, vírgula decimal) ----------
function formatarMm(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";
  return `${numero.toFixed(3).replace(".", ",")} mm`;
}

const MSG_ERRO_NEGATIVO =
  "Informe medidas positivas válidas. O sinal negativo aparece somente no resultado final.";

// ---------- Card de uma seção (externo ou interno) ----------
function ToleranceCard({
  titulo,
  cor,
  usoDescricao,
  labelBotao,
  campoResultado,
  calcular,
}) {
  const [teorica, setTeorica] = useState("");
  const [real, setReal] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  const handleCalcular = () => {
    setErro("");
    setResultado(null);

    const t = normalizarMedida(teorica);
    const r = normalizarMedida(real);

    if (Number.isNaN(t) || Number.isNaN(r)) {
      setErro(MSG_ERRO_NEGATIVO);
      return;
    }

    setResultado(calcular(t, r));
  };

  const handleLimpar = () => {
    setTeorica("");
    setReal("");
    setResultado(null);
    setErro("");
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 15,
    marginBottom: 10,
    boxSizing: "border-box",
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" };

  const btnPrimary = {
    background: cor,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "9px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    marginRight: 8,
  };

  const btnSecondary = {
    background: "#e2e8f0",
    color: "#333",
    border: "none",
    borderRadius: 6,
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  };

  const resultBox = {
    background: "#f0fdf4",
    border: `2px solid ${cor}`,
    borderRadius: 8,
    padding: "14px 18px",
    marginTop: 12,
    fontSize: 20,
    fontWeight: 800,
    color: resultado < 0 ? "#b91c1c" : "#15803d",
    textAlign: "center",
  };

  const erroStyle = {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: 6,
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 6,
    padding: "8px 12px",
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "20px",
    marginBottom: 18,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 14px", fontSize: 16, color: cor }}>{titulo}</h3>
      <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>{usoDescricao}</p>

      <label style={labelStyle}>Medida Teórica do Arquivo STL (mm)</label>
      <input
        type="text"
        inputMode="decimal"
        placeholder="Ex: 20,000"
        value={teorica}
        onChange={(e) => setTeorica(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Medida Real no Paquímetro (mm)</label>
      <input
        type="text"
        inputMode="decimal"
        placeholder="Ex: 20,140"
        value={real}
        onChange={(e) => setReal(e.target.value)}
        style={inputStyle}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
        <button type="button" style={btnPrimary} onClick={handleCalcular}>
          {labelBotao}
        </button>
        <button type="button" style={btnSecondary} onClick={handleLimpar}>
          Limpar Campos
        </button>
      </div>

      {erro && <div style={erroStyle}>⚠️ {erro}</div>}

      {resultado !== null && !erro && (
        <div style={resultBox}>
          Resultado para o campo {campoResultado}: {formatarMm(resultado)}
        </div>
      )}
    </div>
  );
}

// ---------- Componente principal ----------
export default function CalculadoraTolerancia() {
  const ajudaStyle = {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 13,
    color: "#92400e",
    marginBottom: 18,
    lineHeight: 1.5,
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "4px 0" }}>
      <div style={ajudaStyle}>
        💡 <strong>Como usar:</strong> Se a peça saiu <em>maior</em>, o campo{" "}
        <strong>a</strong> (externo) encolhe o arquivo digitando o valor negativo. O campo{" "}
        <strong>b</strong> (interno) serve para reabrir os furos que fecharam com a luz.
      </div>

      <ToleranceCard
        titulo="🔷 Seção A — Cálculo Externo"
        cor="#1d72b8"
        usoDescricao="Uso: paredes externas, dentes, pinos macho, blocos externos."
        labelBotao="Calcular Compensação Externa"
        campoResultado="a"
        calcular={(teorica, real) => {
          const erro = real - teorica;
          return -(erro / 2);
        }}
      />

      <ToleranceCard
        titulo="🔶 Seção B — Cálculo Interno"
        cor="#0f766e"
        usoDescricao="Uso: furos, encaixes, troquel fêmea, paredes internas."
        labelBotao="Calcular Compensação Interna"
        campoResultado="b"
        calcular={(teorica, real) => {
          const erro = teorica - real;
          return erro / 2;
        }}
      />
    </div>
  );
}
