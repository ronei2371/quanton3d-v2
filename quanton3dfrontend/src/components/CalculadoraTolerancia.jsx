import { useState } from "react";

/**
 * Normaliza o input do usuário para número, aceitando vírgula ou ponto decimal.
 * Rejeita valores negativos, vazios ou não numéricos.
 */
function normalizarMedida(valor) {
  const texto = String(valor || "").trim().replace(/\s/g, "");

  if (!texto || texto.startsWith("-")) return NaN;

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : NaN;
}

/**
 * Formata o valor para exibição em mm com 3 casas decimais e vírgula.
 */
function formatarMm(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";
  return `${numero.toFixed(3).replace(".", ",")} mm`;
}

function ToleranceCard({ title, description, valores, tipo, onChange, onCalculate, buttonLabel }) {
  return (
    <div className="field">
      <span style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>{title}</span>
      <p style={{ margin: "0 0 12px 0", color: "#9fb4c7", fontSize: "0.85rem", lineHeight: 1.4 }}>{description}</p>
      
      <label>
        <span style={{ fontSize: "0.88rem", display: "block", marginBottom: "4px" }}>Medida Teórica do Arquivo STL (mm)</span>
        <input 
          type="text" 
          inputMode="decimal" 
          value={valores.teorica} 
          onChange={(e) => onChange(tipo, "teorica", e.target.value)} 
          placeholder="Ex.: 10,000" 
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #2c3e50", background: "#1a2533", color: "white" }}
        />
      </label>

      <label style={{ marginTop: "12px", display: "block" }}>
        <span style={{ fontSize: "0.88rem", display: "block", marginBottom: "4px" }}>Medida Real no Paquímetro (mm)</span>
        <input 
          type="text" 
          inputMode="decimal" 
          value={valores.real} 
          onChange={(e) => onChange(tipo, "real", e.target.value)} 
          placeholder="Ex.: 10,140" 
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #2c3e50", background: "#1a2533", color: "white" }}
        />
      </label>

      <button 
        type="button" 
        className="submit-registration" 
        onClick={onCalculate}
        style={{ marginTop: "16px", width: "100%" }}
      >
        {buttonLabel}
      </button>

      <div 
        className={valores.erro ? "modal-error" : "modal-success"}
        role="status"
        aria-live="polite"
        style={{ 
          marginTop: "12px", 
          padding: "12px", 
          borderRadius: "6px", 
          textAlign: "center",
          background: valores.erro ? "rgba(231, 76, 60, 0.1)" : "rgba(46, 204, 113, 0.15)",
          border: valores.erro ? "1px solid #e74c3c" : "1px solid #2ecc71",
          color: valores.erro ? "#ff6b6b" : "#2ecc71",
          fontWeight: valores.resultado !== null ? "bold" : "normal",
          fontSize: valores.resultado !== null ? "1.1rem" : "0.9rem"
        }}
      >
        {valores.erro || (valores.resultado === null ? "O resultado aparecerá aqui." : `Resultado para o campo ${tipo === 'externo' ? 'a' : 'b'}: ${formatarMm(valores.resultado)}`)}
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
    const vTeorica = normalizarMedida(externo.teorica);
    const vReal = normalizarMedida(externo.real);

    if (Number.isNaN(vTeorica) || Number.isNaN(vReal)) {
      setExterno((atual) => ({ 
        ...atual, 
        resultado: null, 
        erro: "Informe medidas positivas válidas. O sinal negativo aparece somente no resultado final." 
      }));
      return;
    }

    const erro = vReal - vTeorica;
    // Arredondando para 6 casas para evitar imprecisão de ponto flutuante (0.07000000000000028)
    const resultado = Number((-(erro / 2)).toFixed(6));
    setExterno((atual) => ({ ...atual, resultado, erro: "" }));
  }

  function calcularInterno() {
    const vTeorica = normalizarMedida(interno.teorica);
    const vReal = normalizarMedida(interno.real);

    if (Number.isNaN(vTeorica) || Number.isNaN(vReal)) {
      setInterno((atual) => ({ 
        ...atual, 
        resultado: null, 
        erro: "Informe medidas positivas válidas. O sinal negativo aparece somente no resultado final." 
      }));
      return;
    }

    const erro = vTeorica - vReal;
    // Arredondando para 6 casas para evitar imprecisão de ponto flutuante
    const resultado = Number((erro / 2).toFixed(6));
    setInterno((atual) => ({ ...atual, resultado, erro: "" }));
  }

  function limparCampos() {
    setExterno({ teorica: "", real: "", resultado: null, erro: "" });
    setInterno({ teorica: "", real: "", resultado: null, erro: "" });
  }

  return (
    <div className="modal-rich-content">
      <p style={{ marginBottom: "15px" }}>
        Use esta calculadora para definir a compensação X/Y Offset no fatiador dividindo o erro por 2, 
        porque a variação acontece nas duas extremidades da parede.
      </p>
      
      <div className="selector-grid" style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <ToleranceCard
          title="CÁLCULO EXTERNO — campo a"
          description="Uso: paredes de fora, dentes, pinos macho e blocos externos."
          valores={externo}
          tipo="externo"
          onChange={alterar}
          onCalculate={calcularExterno}
          buttonLabel="Calcular Compensação Externa"
        />
        <ToleranceCard
          title="CÁLCULO INTERNO — campo b"
          description="Uso: furos, encaixes, troquel fêmea e paredes internas."
          valores={interno}
          tipo="interno"
          onChange={alterar}
          onCalculate={calcularInterno}
          buttonLabel="Calcular Compensação Interna"
        />
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button 
          type="button" 
          className="submit-registration" 
          onClick={limparCampos}
          style={{ background: "#34495e", border: "1px solid #2c3e50" }}
        >
          Limpar Campos
        </button>
      </div>

      <div className="notice-box" style={{ marginTop: "20px", padding: "15px", background: "rgba(52, 152, 219, 0.1)", borderLeft: "4px solid #3498db", borderRadius: "4px", fontSize: "0.9rem" }}>
        Se a peça saiu maior, o campo 'a' (externo) encolhe o arquivo digitando o valor negativo. 
        O campo 'b' (interno) serve para reabrir os furos que fecharam com a luz.
      </div>
    </div>
  );
}
