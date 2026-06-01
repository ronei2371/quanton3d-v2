
import { useEffect, useMemo, useState } from "react";
import api from "../api";

function tituloResina(nome = "") {
  return String(nome || "").trim() || "Sem nome";
}

function estiloOption() {
  return { color: "#111827", backgroundColor: "#ffffff" };
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.select}
        disabled={disabled}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={estiloOption()}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix = "",
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrap}>
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          style={styles.input}
        />
        {suffix ? <span style={styles.inputSuffix}>{suffix}</span> : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, highlight = false, sub = "" }) {
  return (
    <div style={{ ...styles.metricCard, ...(highlight ? styles.metricHL : {}) }}>
      <p style={{ ...styles.metricLabel, ...(highlight ? styles.metricLabelHL : {}) }}>{label}</p>
      <p style={{ ...styles.metricVal, ...(highlight ? styles.metricValHL : {}) }}>{value}</p>
      {unit ? <span style={styles.metricUnit}>{unit}</span> : null}
      {sub ? <p style={styles.metricSub}>{sub}</p> : null}
    </div>
  );
}

export default function CalculadoraVolume() {
  const [parametros, setParametros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [volumePecaMl, setVolumePecaMl] = useState(10);
  const [quantidade, setQuantidade] = useState(1);
  const [valorLitro, setValorLitro] = useState(120);

  const [potenciaW, setPotenciaW] = useState(80);
  const [horasImpressao, setHorasImpressao] = useState(3);
  const [valorKwh, setValorKwh] = useState(1.1);
  const [taxaFalha, setTaxaFalha] = useState(10);
  const [custoConsumiveis, setCustoConsumiveis] = useState(3);
  const [custoPosProcesso, setCustoPosProcesso] = useState(2);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");
        const resposta = await api.get("/parametros");
        const lista = Array.isArray(resposta.data?.data)
          ? resposta.data.data
          : Array.isArray(resposta.data?.parametros)
          ? resposta.data.parametros
          : Array.isArray(resposta.data)
          ? resposta.data
          : [];

        if (!ativo) return;

        setParametros(lista);
        const resinas = [...new Set(lista.map((item) => tituloResina(item.resina)))];
        setResinaSelecionada((atual) => atual || resinas[0] || "");
      } catch (error) {
        console.error("Erro ao carregar resinas para calculadora:", error);
        if (!ativo) return;
        setErro("Não foi possível carregar as resinas da Quanton3D.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const opcoesResina = useMemo(() => {
    return [...new Set(parametros.map((item) => tituloResina(item.resina)))].map((item) => ({
      value: item,
      label: item,
    }));
  }, [parametros]);

  useEffect(() => {
    if (!opcoesResina.length) return;
    if (!opcoesResina.some((item) => item.value === resinaSelecionada)) {
      setResinaSelecionada(opcoesResina[0].value);
    }
  }, [opcoesResina, resinaSelecionada]);

  const resultado = useMemo(() => {
    const volume = Math.max(0, Number(volumePecaMl) || 0);
    const qtd = Math.max(1, Number(quantidade) || 1);
    const valorResina = Math.max(0, Number(valorLitro) || 0);

    const potencia = Math.max(0, Number(potenciaW) || 0);
    const horas = Math.max(0, Number(horasImpressao) || 0);
    const kwh = Math.max(0, Number(valorKwh) || 0);
    const falha = Math.max(0, Number(taxaFalha) || 0);
    const consumiveis = Math.max(0, Number(custoConsumiveis) || 0);
    const pos = Math.max(0, Number(custoPosProcesso) || 0);

    const volumeBruto = volume * qtd;
    const margemSeguranca = volumeBruto * 0.05;
    const volumeTotal = volumeBruto + margemSeguranca;
    const litrosTotal = volumeTotal / 1000;

    const custoResina = litrosTotal * valorResina;
    const consumoEnergiaKwh = (potencia / 1000) * horas;
    const custoEnergia = consumoEnergiaKwh * kwh;

    const subtotalOperacional = custoResina + custoEnergia + consumiveis + pos;
    const custoFalha = subtotalOperacional * (falha / 100);
    const custoTotalReal = subtotalOperacional + custoFalha;
    const custoPorPeca = qtd > 0 ? custoTotalReal / qtd : 0;

    return {
      volumeBruto: volumeBruto.toFixed(1),
      margemSeguranca: margemSeguranca.toFixed(1),
      volumeTotal: volumeTotal.toFixed(1),
      litrosTotal: litrosTotal.toFixed(3),
      custoResina: custoResina.toFixed(2),
      consumoEnergiaKwh: consumoEnergiaKwh.toFixed(2),
      custoEnergia: custoEnergia.toFixed(2),
      subtotalOperacional: subtotalOperacional.toFixed(2),
      custoFalha: custoFalha.toFixed(2),
      custoTotalReal: custoTotalReal.toFixed(2),
      custoPorPeca: custoPorPeca.toFixed(2),
      taxaFalha: falha.toFixed(0),
    };
  }, [
    volumePecaMl,
    quantidade,
    valorLitro,
    potenciaW,
    horasImpressao,
    valorKwh,
    taxaFalha,
    custoConsumiveis,
    custoPosProcesso,
  ]);

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <span style={styles.badge}>CALCULADORA AVANÇADA</span>
        <h2 style={styles.title}>Calculadora de Custo Real de Impressão</h2>
        <p style={styles.subtitle}>
          Some resina, energia, desgaste, pós-processo e margem de falha para
          estimar um custo mais realista da sua impressão 3D em resina.
        </p>
      </div>

      <div style={styles.card}>
        {erro ? <div style={styles.errorBox}>{erro}</div> : null}

        <div style={styles.sectionMiniTitle}>Matéria-prima</div>

        <div style={styles.grid3}>
          <SelectField
            label="Resina Quanton3D"
            value={resinaSelecionada}
            onChange={setResinaSelecionada}
            options={opcoesResina}
            disabled={carregando || !opcoesResina.length}
          />

          <NumberField
            label="Valor da resina por litro"
            value={valorLitro}
            onChange={setValorLitro}
            min={0}
            step={0.01}
            suffix="R$/L"
          />

          <NumberField
            label="Volume da peça"
            value={volumePecaMl}
            onChange={setVolumePecaMl}
            min={0.1}
            step={0.1}
            suffix="ml"
          />
        </div>

        <div style={styles.grid3}>
          <NumberField
            label="Quantidade de cópias"
            value={quantidade}
            onChange={(v) => setQuantidade(Math.max(1, v))}
            min={1}
            step={1}
            suffix="peças"
          />

          <NumberField
            label="Potência média da máquina"
            value={potenciaW}
            onChange={setPotenciaW}
            min={0}
            step={1}
            suffix="W"
          />

          <NumberField
            label="Horas totais de impressão"
            value={horasImpressao}
            onChange={setHorasImpressao}
            min={0}
            step={0.1}
            suffix="h"
          />
        </div>

        <div style={styles.sectionMiniTitle}>Custos adicionais</div>

        <div style={styles.grid3}>
          <NumberField
            label="Valor da energia"
            value={valorKwh}
            onChange={setValorKwh}
            min={0}
            step={0.01}
            suffix="R$/kWh"
          />

          <NumberField
            label="Desgaste / consumíveis"
            value={custoConsumiveis}
            onChange={setCustoConsumiveis}
            min={0}
            step={0.01}
            suffix="R$"
          />

          <NumberField
            label="Pós-processo"
            value={custoPosProcesso}
            onChange={setCustoPosProcesso}
            min={0}
            step={0.01}
            suffix="R$"
          />
        </div>

        <div style={styles.grid2}>
          <NumberField
            label="Taxa estimada de falha / reimpressão"
            value={taxaFalha}
            onChange={setTaxaFalha}
            min={0}
            step={1}
            suffix="%"
          />

          <div style={styles.tipBox}>
            <span style={styles.tipIcon}>ℹ️</span>
            <div>
              Fórmula base:
              {" "}
              <strong>(volume por peça × quantidade) + 5% de margem</strong>.
              Depois somamos energia, consumíveis, pós-processo e a taxa de falha
              escolhida por você.
            </div>
          </div>
        </div>
      </div>

      <div style={styles.resultHeader}>
        <span style={styles.badge}>RESULTADOS</span>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard label="Volume bruto" value={resultado.volumeBruto} unit="ml" />
        <MetricCard label="Margem 5%" value={resultado.margemSeguranca} unit="ml" />
        <MetricCard label="Total de resina" value={resultado.volumeTotal} unit="ml" highlight />
        <MetricCard label="Total em litros" value={resultado.litrosTotal} unit="L" />

        <MetricCard
          label="Custo da resina"
          value={`R$ ${resultado.custoResina}`}
          unit="matéria-prima"
        />
        <MetricCard
          label="Energia consumida"
          value={resultado.consumoEnergiaKwh}
          unit="kWh"
        />
        <MetricCard
          label="Custo da energia"
          value={`R$ ${resultado.custoEnergia}`}
          unit="elétrica"
        />
        <MetricCard
          label="Subtotal operacional"
          value={`R$ ${resultado.subtotalOperacional}`}
          unit="antes da falha"
        />
        <MetricCard
          label="Impacto da falha"
          value={`R$ ${resultado.custoFalha}`}
          unit={`${resultado.taxaFalha}%`}
        />
        <MetricCard
          label="Custo total real"
          value={`R$ ${resultado.custoTotalReal}`}
          unit="estimado"
          highlight
        />
        <MetricCard
          label="Custo por peça"
          value={`R$ ${resultado.custoPorPeca}`}
          unit="/ peça"
          highlight
        />
      </div>
    </section>
  );
}

const styles = {
  section: {
    background: "transparent",
    color: "#ffffff",
    padding: "2rem 0",
    fontFamily: "'Inter', sans-serif",
  },
  header: { marginBottom: "1.5rem" },
  badge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#00d4ff",
    marginBottom: "8px",
  },
  title: {
    fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
    fontWeight: 700,
    margin: "0 0 12px",
    color: "#ffffff",
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.65)",
    maxWidth: "780px",
    lineHeight: 1.6,
    margin: 0,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "18px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  },
  sectionMiniTitle: {
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    marginBottom: "14px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    alignItems: "start",
    marginBottom: "16px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    alignItems: "start",
    marginBottom: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#d6e1f5",
  },
  select: {
    width: "100%",
    height: "46px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(15,23,42,0.72)",
    color: "#ffffff",
    padding: "0 14px",
    outline: "none",
    fontSize: "15px",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: "46px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(15,23,42,0.72)",
    color: "#ffffff",
    padding: "0 14px",
    paddingRight: "68px",
    outline: "none",
    fontSize: "15px",
  },
  inputSuffix: {
    position: "absolute",
    right: "12px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
    pointerEvents: "none",
  },
  tipBox: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    background: "rgba(0,212,255,0.08)",
    border: "1px solid rgba(0,212,255,0.16)",
    borderRadius: "16px",
    padding: "14px 16px",
    color: "#cfefff",
    minHeight: "46px",
  },
  tipIcon: { fontSize: "18px", lineHeight: 1.2 },
  resultHeader: { marginBottom: "12px" },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  metricCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "16px",
    minHeight: "118px",
  },
  metricHL: {
    border: "1px solid rgba(0,212,255,0.35)",
    boxShadow: "0 0 0 1px rgba(0,212,255,0.08) inset",
  },
  metricLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.58)",
    margin: 0,
  },
  metricLabelHL: { color: "#00d4ff" },
  metricVal: {
    fontSize: "clamp(1.5rem, 2vw, 2rem)",
    fontWeight: 700,
    color: "#ffffff",
    margin: "10px 0 4px",
    lineHeight: 1,
  },
  metricValHL: { color: "#8be9ff" },
  metricUnit: {
    display: "inline-block",
    fontSize: "12px",
    color: "rgba(255,255,255,0.62)",
  },
  metricSub: {
    marginTop: "10px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.55)",
  },
  errorBox: {
    marginBottom: "16px",
    background: "rgba(255, 99, 132, 0.12)",
    border: "1px solid rgba(255, 99, 132, 0.28)",
    color: "#ffd4dd",
    padding: "12px 14px",
    borderRadius: "14px",
  },
};
