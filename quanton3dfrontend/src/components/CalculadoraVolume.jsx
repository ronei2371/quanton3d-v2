import { useEffect, useMemo, useState } from "react";
import api from "../api";

function tituloResina(nome = "") {
  return String(nome || "").trim() || "Sem nome";
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={S.select} disabled={disabled}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0, step = 1, suffix = "" }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <div style={S.inputWrap}>
        <input type="number" value={value} min={min} step={step} onChange={(e) => onChange(Number(e.target.value))} style={S.input} />
        {suffix ? <span style={S.suffix}>{suffix}</span> : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, highlight = false }) {
  return (
    <div style={{ ...S.card, ...(highlight ? S.cardHL : {}) }}>
      <p style={{ ...S.metricLabel, ...(highlight ? S.metricLabelHL : {}) }}>{label}</p>
      <p style={{ ...S.metricVal, ...(highlight ? S.metricValHL : {}) }}>{value}</p>
      {unit ? <span style={S.metricUnit}>{unit}</span> : null}
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
        setCarregando(true); setErro("");
        const res = await api.get("/parametros");
        const lista = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data?.parametros) ? res.data.parametros : Array.isArray(res.data) ? res.data : [];
        if (!ativo) return;
        setParametros(lista);
        const resinas = [...new Set(lista.map((i) => tituloResina(i.resina)))];
        setResinaSelecionada((atual) => atual || resinas[0] || "");
      } catch (e) { console.error(e); if (!ativo) return; setErro("Não foi possível carregar as resinas da Quanton3D."); }
      finally { if (ativo) setCarregando(false); }
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  const opcoesResina = useMemo(() => [...new Set(parametros.map((i) => tituloResina(i.resina)))].map((i) => ({ value: i, label: i })), [parametros]);

  useEffect(() => {
    if (!opcoesResina.length || opcoesResina.some((i) => i.value === resinaSelecionada)) return;
    const t = setTimeout(() => setResinaSelecionada(opcoesResina[0].value), 0);
    return () => clearTimeout(t);
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
      volumeBruto: volumeBruto.toFixed(1), margemSeguranca: margemSeguranca.toFixed(1),
      volumeTotal: volumeTotal.toFixed(1), litrosTotal: litrosTotal.toFixed(3),
      custoResina: custoResina.toFixed(2), consumoEnergiaKwh: consumoEnergiaKwh.toFixed(2),
      custoEnergia: custoEnergia.toFixed(2), subtotalOperacional: subtotalOperacional.toFixed(2),
      custoFalha: custoFalha.toFixed(2), custoTotalReal: custoTotalReal.toFixed(2),
      custoPorPeca: custoPorPeca.toFixed(2), taxaFalha: falha.toFixed(0),
    };
  }, [volumePecaMl, quantidade, valorLitro, potenciaW, horasImpressao, valorKwh, taxaFalha, custoConsumiveis, custoPosProcesso]);

  return (
    <section style={S.section}>
      <div style={S.header}>
        <span style={S.badge}>CALCULADORA AVANÇADA</span>
        <h2 style={S.title}>Calculadora de Custo Real de Impressão</h2>
        <p style={S.subtitle}>Some resina, energia, desgaste, pós-processo e margem de falha para estimar o custo real da sua impressão 3D em resina.</p>
      </div>

      <div style={S.formCard}>
        {erro && <div style={S.errorBox}>{erro}</div>}
        <p style={S.miniTitle}>Matéria-prima</p>
        <div style={S.grid3}>
          <SelectField label="Resina Quanton3D" value={resinaSelecionada} onChange={setResinaSelecionada} options={opcoesResina} disabled={carregando || !opcoesResina.length} />
          <NumberField label="Valor da resina por litro" value={valorLitro} onChange={setValorLitro} min={0} step={0.01} suffix="R$/L" />
          <NumberField label="Volume da peça" value={volumePecaMl} onChange={setVolumePecaMl} min={0.1} step={0.1} suffix="ml" />
        </div>
        <div style={S.grid3}>
          <NumberField label="Quantidade de cópias" value={quantidade} onChange={(v) => setQuantidade(Math.max(1, v))} min={1} step={1} suffix="peças" />
          <NumberField label="Potência média da máquina" value={potenciaW} onChange={setPotenciaW} min={0} step={1} suffix="W" />
          <NumberField label="Horas totais de impressão" value={horasImpressao} onChange={setHorasImpressao} min={0} step={0.1} suffix="h" />
        </div>
        <p style={S.miniTitle}>Custos adicionais</p>
        <div style={S.grid3}>
          <NumberField label="Valor da energia" value={valorKwh} onChange={setValorKwh} min={0} step={0.01} suffix="R$/kWh" />
          <NumberField label="Desgaste / consumíveis" value={custoConsumiveis} onChange={setCustoConsumiveis} min={0} step={0.01} suffix="R$" />
          <NumberField label="Pós-processo" value={custoPosProcesso} onChange={setCustoPosProcesso} min={0} step={0.01} suffix="R$" />
        </div>
        <div style={S.grid2}>
          <NumberField label="Taxa estimada de falha / reimpressão" value={taxaFalha} onChange={setTaxaFalha} min={0} step={1} suffix="%" />
          <div style={S.tip}>
            <span style={{ fontSize: "18px" }}>ℹ️</span>
            <div>Fórmula: <strong>(volume × quantidade) + 5% margem</strong>. Depois somamos energia, consumíveis, pós-processo e taxa de falha.</div>
          </div>
        </div>
      </div>

      <span style={S.badge}>RESULTADOS</span>
      <div style={S.metricsGrid}>
        <MetricCard label="Volume bruto" value={resultado.volumeBruto} unit="ml" />
        <MetricCard label="Margem 5%" value={resultado.margemSeguranca} unit="ml" />
        <MetricCard label="Total de resina" value={resultado.volumeTotal} unit="ml" highlight />
        <MetricCard label="Total em litros" value={resultado.litrosTotal} unit="L" />
        <MetricCard label="Custo da resina" value={`R$ ${resultado.custoResina}`} unit="matéria-prima" />
        <MetricCard label="Energia consumida" value={resultado.consumoEnergiaKwh} unit="kWh" />
        <MetricCard label="Custo da energia" value={`R$ ${resultado.custoEnergia}`} unit="elétrica" />
        <MetricCard label="Subtotal operacional" value={`R$ ${resultado.subtotalOperacional}`} unit="antes da falha" />
        <MetricCard label="Impacto da falha" value={`R$ ${resultado.custoFalha}`} unit={`${resultado.taxaFalha}%`} />
        <MetricCard label="Custo total real" value={`R$ ${resultado.custoTotalReal}`} unit="estimado" highlight />
        <MetricCard label="Custo por peça" value={`R$ ${resultado.custoPorPeca}`} unit="/ peça" highlight />
      </div>
    </section>
  );
}

const S = {
  section: { background: "transparent", color: "#eaf3ff", padding: "1.5rem 0", fontFamily: "'Inter', sans-serif" },
  header: { marginBottom: "1.5rem" },
  badge: { display: "inline-block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#4fd1ff", marginBottom: "8px" },
  title: { fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, margin: "0 0 10px", color: "#ffffff", lineHeight: 1.2 },
  subtitle: { fontSize: "14px", color: "#b8cfe8", maxWidth: "700px", lineHeight: 1.6, margin: 0 },
  formCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(113,159,219,0.2)", borderRadius: "16px", padding: "20px", marginBottom: "20px" },
  miniTitle: { fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", color: "#9fb4c7", textTransform: "uppercase", margin: "0 0 12px" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", alignItems: "start", marginBottom: "14px" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", alignItems: "start", marginBottom: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: 700, color: "#ccdaec" },
  select: { width: "100%", height: "44px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(4,12,24,0.7)", color: "#ffffff", padding: "0 12px", outline: "none", fontSize: "14px" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  input: { width: "100%", height: "44px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(4,12,24,0.7)", color: "#ffffff", padding: "0 60px 0 12px", outline: "none", fontSize: "14px" },
  suffix: { position: "absolute", right: "10px", fontSize: "12px", color: "#b8cfe8", pointerEvents: "none", fontWeight: 700 },
  tip: { display: "flex", gap: "10px", alignItems: "flex-start", background: "rgba(79,209,255,0.07)", border: "1px solid rgba(79,209,255,0.15)", borderRadius: "12px", padding: "12px 14px", color: "#a8c4e8", fontSize: "13px", lineHeight: 1.55 },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginTop: "12px" },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(113,159,219,0.18)", borderRadius: "14px", padding: "14px" },
  cardHL: { background: "rgba(79,209,255,0.08)", border: "1px solid rgba(79,209,255,0.3)" },
  metricLabel: { fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em", color: "#9fb4c7", margin: "0 0 6px" },
  metricLabelHL: { color: "#4fd1ff" },
  metricVal: { fontSize: "clamp(1.3rem, 2vw, 1.8rem)", fontWeight: 700, color: "#ffffff", margin: "0 0 3px", lineHeight: 1.1 },
  metricValHL: { color: "#8be9ff" },
  metricUnit: { fontSize: "11px", color: "#b8cfe8" },
  errorBox: { marginBottom: "14px", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", color: "#ffd4dd", padding: "10px 14px", borderRadius: "10px" },
};
