import { useState } from "react";

function formatarMm(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";
  return `${numero.toFixed(3).replace(".", ",")} mm`;
}

function normalizarMedida(valor) {
  const texto = String(valor || "").trim().replace(/\s/g, "");

  if (!texto || texto.startsWith("-")) return NaN;

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : NaN;
}

export default function CalculadoraTolerancia() {
  const [externo, setExterno] = useState({ teorica: "", real: "", resultado: null, erro: "" });
  const [interno, setInterno] = useState({ teorica: "", real: "", resultado: null, erro: "" });

  function alterar(tipo, campo, valor) {
    const setter = tipo === "externo" ? setExterno : setInterno;
    setter((atual) => ({ ...atual, [campo]: valor, erro: "" }));
  }

  function validar(teorica, real) {
    const medidaTeorica = normalizarMedida(teorica);
    const medidaReal = normalizarMedida(real);

    if (!Number.isFinite(medidaTeorica) || !Number.isFinite(medidaReal)) {
      return { erro: "Informe medidas positivas válidas. Exemplo: 10,000 ou 10.000." };
    }

    return { medidaTeorica, medidaReal };
  }

  function calcularExterno() {
    const validacao = validar(externo.teorica, externo.real);

    if (validacao.erro) {
      setExterno((atual) => ({ ...atual, resultado: null, erro: validacao.erro }));
      return;
    }

    const erro = validacao.medidaReal - validacao.medidaTeorica;
    setExterno((atual) => ({ ...atual, resultado: -(erro / 2), erro: "" }));
  }

  function calcularInterno() {
    const validacao = validar(interno.teorica, interno.real);

    if (validacao.erro) {
      setInterno((atual) => ({ ...atual, resultado: null, erro: validacao.erro }));
      return;
    }

    const erro = validacao.medidaTeorica - validacao.medidaReal;
    setInterno((atual) => ({ ...atual, resultado: erro / 2, erro: "" }));
  }

  function limparCampos() {
    setExterno({ teorica: "", real: "", resultado: null, erro: "" });
    setInterno({ teorica: "", real: "", resultado: null, erro: "" });
  }

  return (
    <div className="modal-rich-content">
      <p>
        Use esta calculadora para definir a compensação X/Y Offset no fatiador dividindo o erro por 2, porque a variação acontece nas duas extremidades da parede.
      </p>
      <div className="notice-box" style={{ marginTop: "14px" }}>
        Digite somente medidas positivas. O sinal positivo ou negativo aparece apenas no resultado final.
      </div>
      <div className="selector-grid" style={{ marginTop: "20px" }}>
        <ToleranceCard
          title="Cálculo Externo — campo a"
          description="Paredes de fora, dentes e pinos macho. Fórmula: Resultado = -((Medida Real - Medida Teórica) / 2)."
          valores={externo}
          tipo="externo"
          onChange={alterar}
          onCalculate={calcularExterno}
          buttonLabel="Calcular Compensação Externa"
          resultLabel="Resultado para o campo a"
        />
        <ToleranceCard
          title="Cálculo Interno — campo b"
          description="Furos, encaixes e troquel fêmea. Fórmula: Resultado = (Medida Teórica - Medida Real) / 2."
          valores={interno}
          tipo="interno"
          onChange={alterar}
          onCalculate={calcularInterno}
          buttonLabel="Calcular Compensação Interna"
          resultLabel="Resultado para o campo b"
        />
      </div>
      <button type="button" className="submit-registration" style={{ marginTop: "18px" }} onClick={limparCampos}>
        Limpar Campos
      </button>
      <div className="notice-box">
        Se a peça saiu maior, o campo 'a' (externo) encolhe o arquivo digitando o valor negativo. O campo 'b' (interno) serve para reabrir os furos que fecharam com a luz.
      </div>
    </div>
  );
}

function ToleranceCard({ title, description, valores, tipo, onChange, onCalculate, buttonLabel, resultLabel }) {
  const temResultado = valores.resultado !== null;

  return (
    <div className="field">
      <span>{title}</span>
      <p style={{ margin: 0, color: "#9fb4c7", lineHeight: 1.5 }}>{description}</p>
      <label>
        <span style={{ fontSize: "0.92rem" }}>Medida Teórica do Arquivo STL (mm)</span>
        <input
          type="text"
          inputMode="decimal"
          value={valores.teorica}
          onChange={(e) => onChange(tipo, "teorica", e.target.value)}
          placeholder="Ex.: 10,000"
        />
      </label>
      <label>
        <span style={{ fontSize: "0.92rem" }}>Medida Real no Paquímetro (mm)</span>
        <input
          type="text"
          inputMode="decimal"
          value={valores.real}
          onChange={(e) => onChange(tipo, "real", e.target.value)}
          placeholder="Ex.: 10,140"
        />
      </label>
      <button type="button" className="submit-registration" onClick={onCalculate}>
        {buttonLabel}
      </button>
      <div
        className={valores.erro ? "modal-error" : "modal-success"}
        style={{
          marginTop: "8px",
          marginBottom: 0,
          padding: "14px 16px",
          borderRadius: "14px",
          background: valores.erro ? "#fee2e2" : "#dcfce7",
          color: valores.erro ? "#991b1b" : "#064e3b",
          border: valores.erro ? "1px solid #fecaca" : "1px solid #86efac",
          fontSize: temResultado ? "1.25rem" : "1rem",
          fontWeight: 950,
          lineHeight: 1.35,
        }}
      >
        {valores.erro || (temResultado ? `${resultLabel}: ${formatarMm(valores.resultado)}` : "O resultado aparecerá aqui.")}
      </div>
    </div>
  );
}
