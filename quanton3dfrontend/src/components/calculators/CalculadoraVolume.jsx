import { useEffect, useMemo, useState } from "react";
import { Zap, Printer, CheckCircle2, Info } from "lucide-react";
import api from "../../lib/api";

function tituloResina(nome = "") {
  return String(nome || "").trim() || "Sem nome";
}

// Lista de impressoras com potência média oficial
const IMPRESSORAS = [
  { grupo: "Anycubic", modelos: [
    { label: "Anycubic Photon Mono",       watts: 45 },
    { label: "Anycubic Photon Mono X",      watts: 50 },
    { label: "Anycubic Photon Mono X 6K",  watts: 55 },
    { label: "Anycubic Photon M3",          watts: 45 },
    { label: "Anycubic Photon M3 Plus",    watts: 55 },
    { label: "Anycubic Photon M3 Max",     watts: 65 },
    { label: "Anycubic Photon M5",         watts: 60 },
    { label: "Anycubic Photon M5s",        watts: 65 },
    { label: "Anycubic Photon M7",         watts: 75 },
    { label: "Anycubic Photon M7 Pro",     watts: 80 },
  ]},
  { grupo: "Elegoo", modelos: [
    { label: "Elegoo Mars 2",              watts: 40 },
    { label: "Elegoo Mars 3",              watts: 45 },
    { label: "Elegoo Mars 4",              watts: 50 },
    { label: "Elegoo Mars 4 Ultra",        watts: 55 },
    { label: "Elegoo Saturn",              watts: 60 },
    { label: "Elegoo Saturn 2",            watts: 65 },
    { label: "Elegoo Saturn 3 Ultra",      watts: 70 },
    { label: "Elegoo Saturn 4 Ultra",      watts: 75 },
    { label: "Elegoo Jupiter",             watts: 90 },
    { label: "Elegoo Jupiter SE",          watts: 95 },
  ]},
  { grupo: "Creality", modelos: [
    { label: "Creality Halot One",         watts: 45 },
    { label: "Creality Halot Mage",        watts: 70 },
    { label: "Creality Halot Mage Pro",    watts: 75 },
    { label: "Creality Halot Mage S",      watts: 80 },
  ]},
  { grupo: "Phrozen", modelos: [
    { label: "Phrozen Sonic Mini 8K",      watts: 60 },
    { label: "Phrozen Sonic Mighty 8K",   watts: 75 },
  ]},
  { grupo: "Bambu Lab", modelos: [
    { label: "Bambu Lab",                  watts: 50 },
  ]},
];

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <div className="calc-field">
      <label className="calc-label">{label}</label>
      <select className="calc-select" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0, step = 1, suffix = "" }) {
  return (
    <div className="calc-field">
      <label className="calc-label">{label}</label>
      <div className="calc-input-wrap">
        <input type="number" className="calc-input" value={value} min={min} step={step}
          onChange={(e) => onChange(Number(e.target.value))} />
        {suffix ? <span className="calc-suffix">{suffix}</span> : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, highlight = false }) {
  return (
    <div className={"calc-metric-card" + (highlight ? " is-highlight" : "")}>
      <p className="calc-metric-label">{label}</p>
      <p className="calc-metric-value">{value}</p>
      {unit ? <span className="calc-metric-unit">{unit}</span> : null}
    </div>
  );
}

export default function CalculadoraVolume() {
  const [parametros, setParametros]           = useState([]);
  const [carregando, setCarregando]           = useState(true);
  const [erro, setErro]                       = useState("");
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [volumePecaMl, setVolumePecaMl]       = useState(10);
  const [quantidade, setQuantidade]           = useState(1);
  const [valorLitro, setValorLitro]           = useState(120);
  const [potenciaW, setPotenciaW]             = useState(0);
  const [horasImpressao, setHorasImpressao]   = useState(3);
  const [valorKwh, setValorKwh]               = useState(1.1);
  const [taxaFalha, setTaxaFalha]             = useState(10);
  const [custoConsumiveis, setCustoConsumiveis] = useState(3);
  const [custoPosProcesso, setCustoPosProcesso] = useState(2);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        setCarregando(true); setErro("");
        const res = await api.get("/parametros");
        const lista = Array.isArray(res.data?.data) ? res.data.data
          : Array.isArray(res.data?.parametros) ? res.data.parametros
          : Array.isArray(res.data) ? res.data : [];
        if (!ativo) return;
        setParametros(lista);
        const resinas = [...new Set(lista.map((i) => tituloResina(i.resina)))];
        setResinaSelecionada((atual) => atual || resinas[0] || "");
      } catch (e) {
        if (!ativo) return;
        setErro("Não foi possível carregar as resinas da Quanton3D.");
      } finally { if (ativo) setCarregando(false); }
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  const opcoesResina = useMemo(() =>
    [...new Set(parametros.map((i) => tituloResina(i.resina)))].map((i) => ({ value: i, label: i }))
  , [parametros]);

  useEffect(() => {
    if (!opcoesResina.length || opcoesResina.some((i) => i.value === resinaSelecionada)) return;
    const t = setTimeout(() => setResinaSelecionada(opcoesResina[0].value), 0);
    return () => clearTimeout(t);
  }, [opcoesResina, resinaSelecionada]);

  // Quando muda impressora, preenche a potência automaticamente
  function handleImpressoraChange(val) {
    setImpressoraSelecionada(val);
    if (!val) return;
    for (const grupo of IMPRESSORAS) {
      const modelo = grupo.modelos.find(m => m.label === val);
      if (modelo) { setPotenciaW(modelo.watts); break; }
    }
  }

  const resultado = useMemo(() => {
    const volume    = Math.max(0, Number(volumePecaMl) || 0);
    const qtd       = Math.max(1, Number(quantidade) || 1);
    const vrResina  = Math.max(0, Number(valorLitro) || 0);
    const potencia  = Math.max(0, Number(potenciaW) || 0);
    const horas     = Math.max(0, Number(horasImpressao) || 0);
    const kwh       = Math.max(0, Number(valorKwh) || 0);
    const falha     = Math.max(0, Number(taxaFalha) || 0);
    const cons      = Math.max(0, Number(custoConsumiveis) || 0);
    const pos       = Math.max(0, Number(custoPosProcesso) || 0);

    const volumeBruto          = volume * qtd;
    const margemSeguranca      = volumeBruto * 0.05;
    const volumeTotal          = volumeBruto + margemSeguranca;
    const litrosTotal          = volumeTotal / 1000;
    const custoResina          = litrosTotal * vrResina;
    const consumoEnergiaKwh    = (potencia / 1000) * horas;
    const custoEnergia         = consumoEnergiaKwh * kwh;
    const subtotalOperacional  = custoResina + custoEnergia + cons + pos;
    const custoFalha           = subtotalOperacional * (falha / 100);
    const custoTotalReal       = subtotalOperacional + custoFalha;
    const custoPorPeca         = qtd > 0 ? custoTotalReal / qtd : 0;

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
  }, [volumePecaMl, quantidade, valorLitro, potenciaW, horasImpressao, valorKwh, taxaFalha, custoConsumiveis, custoPosProcesso]);

  return (
    <section className="calc-section">
      <div className="calc-header">
        <span className="calc-badge"><Zap size={12} /> Calculadora simples</span>
        <h2 className="calc-title">Custo Real de Impressão</h2>
        <p className="calc-subtitle">Selecione sua impressora e resina — os valores típicos são preenchidos automaticamente. Ajuste o que precisar e veja o custo na hora.</p>
      </div>

      <div className="calc-form-card">
        {erro && <div className="q-alert q-alert--error">{erro}</div>}

        <div className="calc-highlight-box">
          <p className="calc-mini-title" style={{ color: "var(--primary)" }}><Printer size={13} /> Selecione sua impressora</p>
          <div className="calc-grid-2">
            <div className="calc-field">
              <label className="calc-label">Modelo da impressora</label>
              <select className="calc-select" value={impressoraSelecionada} onChange={e => handleImpressoraChange(e.target.value)}>
                <option value="">-- Selecione ou preencha manualmente --</option>
                {IMPRESSORAS.map(g => (
                  <optgroup key={g.grupo} label={g.grupo}>
                    {g.modelos.map(m => (
                      <option key={m.label} value={m.label}>{m.label} — {m.watts}W</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="calc-field">
              <label className="calc-label">Potência da máquina (W)</label>
              <div className="calc-input-wrap">
                <input type="number" className="calc-input" value={potenciaW} min={0} step={1}
                  onChange={e => { setImpressoraSelecionada(""); setPotenciaW(Number(e.target.value)); }}
                  placeholder="Ex: 65" />
                <span className="calc-suffix">W</span>
              </div>
              {impressoraSelecionada && (
                <span className="calc-hint" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--q-verde)" }}>
                  <CheckCircle2 size={12} /> Preenchido automaticamente para {impressoraSelecionada}
                </span>
              )}
              {!impressoraSelecionada && (
                <span className="calc-hint">Selecione a impressora acima para preencher automaticamente</span>
              )}
            </div>
          </div>
        </div>

        <p className="calc-mini-title">Matéria-prima</p>
        <div className="calc-grid-3">
          <SelectField label="Resina Quanton3D" value={resinaSelecionada}
            onChange={setResinaSelecionada} options={opcoesResina}
            disabled={carregando || !opcoesResina.length} />
          <NumberField label="Valor da resina por litro" value={valorLitro}
            onChange={setValorLitro} min={0} step={0.01} suffix="R$/L" />
          <NumberField label="Volume da peça" value={volumePecaMl}
            onChange={setVolumePecaMl} min={0.1} step={0.1} suffix="ml" />
        </div>

        <div className="calc-grid-2">
          <NumberField label="Quantidade de cópias" value={quantidade}
            onChange={(v) => setQuantidade(Math.max(1, v))} min={1} step={1} suffix="peças" />
          <NumberField label="Horas totais de impressão" value={horasImpressao}
            onChange={setHorasImpressao} min={0} step={0.1} suffix="h" />
        </div>

        <p className="calc-mini-title">Custos adicionais</p>
        <div className="calc-grid-3">
          <NumberField label="Valor da energia (kWh)" value={valorKwh}
            onChange={setValorKwh} min={0} step={0.01} suffix="R$" />
          <NumberField label="Desgaste / consumíveis" value={custoConsumiveis}
            onChange={setCustoConsumiveis} min={0} step={0.01} suffix="R$" />
          <NumberField label="Pós-processo" value={custoPosProcesso}
            onChange={setCustoPosProcesso} min={0} step={0.01} suffix="R$" />
        </div>

        <div className="calc-grid-2">
          <NumberField label="Taxa de falha / reimpressão" value={taxaFalha}
            onChange={setTaxaFalha} min={0} step={1} suffix="%" />
          <div className="calc-tip">
            <Info size={16} />
            <div>
              Fórmula: <strong>(volume × quantidade) + 5% margem</strong>.<br />
              Depois somamos energia, consumíveis, pós-processo e taxa de falha.
            </div>
          </div>
        </div>
      </div>

      <span className="calc-badge">Resultados</span>
      <div className="calc-metrics-grid">
        <MetricCard label="Volume bruto"         value={resultado.volumeBruto}         unit="ml" />
        <MetricCard label="Margem 5%"            value={resultado.margemSeguranca}      unit="ml" />
        <MetricCard label="Total de resina"      value={resultado.volumeTotal}          unit="ml"  highlight />
        <MetricCard label="Total em litros"      value={resultado.litrosTotal}          unit="L" />
        <MetricCard label="Custo da resina"      value={`R$ ${resultado.custoResina}`}  unit="matéria-prima" />
        <MetricCard label="Energia consumida"    value={resultado.consumoEnergiaKwh}    unit="kWh" />
        <MetricCard label="Custo da energia"     value={`R$ ${resultado.custoEnergia}`} unit="elétrica" />
        <MetricCard label="Subtotal"             value={`R$ ${resultado.subtotalOperacional}`} unit="antes da falha" />
        <MetricCard label="Impacto da falha"     value={`R$ ${resultado.custoFalha}`}   unit={`${resultado.taxaFalha}%`} />
        <MetricCard label="Custo total real"     value={`R$ ${resultado.custoTotalReal}`} unit="estimado" highlight />
        <MetricCard label="Custo por peça"       value={`R$ ${resultado.custoPorPeca}`} unit="/ peça" highlight />
      </div>

      <p className="calc-hint" style={{ marginTop: "16px", textAlign: "center" }}>
        Precisa de orçamento completo com dados do cliente, mão de obra, frete, PDF e histórico?{" "}
        <a href="/calculadora-custos.html" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 700 }}>
          Use o Modo Avançado →
        </a>
      </p>
    </section>
  );
}
