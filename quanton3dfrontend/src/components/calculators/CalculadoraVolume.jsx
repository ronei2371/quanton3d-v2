import { useEffect, useMemo, useState } from "react";
import { Zap, Printer, CheckCircle2, Info } from "lucide-react";
import api from "../../lib/api";

function tituloResina(nome = "") {
  return String(nome || "").trim() || "Sem nome";
}

// Potencia aproximada de cada impressora (consumo medio imprimindo; a etiqueta da fonte
// mostra o maximo). Serve so para estimar a energia, que pesa pouco no custo.
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
  const [parametros, setParametros]               = useState([]);
  const [carregando, setCarregando]               = useState(true);
  const [erro, setErro]                           = useState("");
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [volumePecaMl, setVolumePecaMl]           = useState(10);
  const [quantidade, setQuantidade]               = useState(1);
  const [densidadeGml, setDensidadeGml]           = useState(1.1);
  const [valorKg, setValorKg]                     = useState(120);
  const [potenciaW, setPotenciaW]                 = useState(0);
  const [horasImpressao, setHorasImpressao]       = useState(3);
  const [valorKwh, setValorKwh]                   = useState(1.1);
  const [taxaFalha, setTaxaFalha]                 = useState(10);
  const [custoConsumiveis, setCustoConsumiveis]   = useState(3);
  const [custoPosProcesso, setCustoPosProcesso]   = useState(2);

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
      } catch {
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

  // Quando muda impressora, preenche a potencia automaticamente
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
    const densidade = Math.max(0.5, Number(densidadeGml) || 1.1);
    const vrKg      = Math.max(0, Number(valorKg) || 0);
    const potencia  = Math.max(0, Number(potenciaW) || 0);
    const horas     = Math.max(0, Number(horasImpressao) || 0);
    const kwh       = Math.max(0, Number(valorKwh) || 0);
    const falha     = Math.max(0, Number(taxaFalha) || 0);
    const cons      = Math.max(0, Number(custoConsumiveis) || 0);
    const pos       = Math.max(0, Number(custoPosProcesso) || 0);

    const volumeBruto         = volume * qtd;
    const margemSeguranca     = volumeBruto * 0.05;
    const volumeTotal         = volumeBruto + margemSeguranca;
    // conversao ml -> kg usando densidade real da resina
    const pesoResina_g        = volumeTotal * densidade;
    const pesoResina_kg       = pesoResina_g / 1000;
    const custoResina         = pesoResina_kg * vrKg;
    const consumoEnergiaKwh   = (potencia / 1000) * horas;
    const custoEnergia        = consumoEnergiaKwh * kwh;
    const subtotalOperacional = custoResina + custoEnergia + cons + pos;
    const custoFalha          = subtotalOperacional * (falha / 100);
    const custoTotalReal      = subtotalOperacional + custoFalha;
    const custoPorPeca        = qtd > 0 ? custoTotalReal / qtd : 0;

    return {
      volumeBruto: volumeBruto.toFixed(1),
      margemSeguranca: margemSeguranca.toFixed(1),
      volumeTotal: volumeTotal.toFixed(1),
      pesoResina_g: pesoResina_g.toFixed(1),
      pesoResina_kg: pesoResina_kg.toFixed(3),
      custoResina: custoResina.toFixed(2),
      consumoEnergiaKwh: consumoEnergiaKwh.toFixed(2),
      custoEnergia: custoEnergia.toFixed(2),
      subtotalOperacional: subtotalOperacional.toFixed(2),
      custoFalha: custoFalha.toFixed(2),
      custoTotalReal: custoTotalReal.toFixed(2),
      custoPorPeca: custoPorPeca.toFixed(2),
      taxaFalha: falha.toFixed(0),
    };
  }, [volumePecaMl, quantidade, densidadeGml, valorKg, potenciaW, horasImpressao, valorKwh, taxaFalha, custoConsumiveis, custoPosProcesso]);

  return (
    <section className="calc-section">
      <div className="calc-header">
        <span className="calc-badge"><Zap size={12} /> Calculadora simples</span>
        <h2 className="calc-title">Custo Real de Impressão</h2>
        <p className="calc-subtitle">Escolha a impressora (a potência é preenchida sozinha), informe o volume que o fatiador mostra e o preço que você pagou na resina. O custo aparece na hora.</p>
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
                      <option key={m.label} value={m.label}>{m.label} — cerca de {m.watts} W</option>
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
                  <CheckCircle2 size={12} /> Valor aproximado para {impressoraSelecionada}. Se souber o consumo real, pode trocar
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
          <NumberField label="Valor da resina por kg" value={valorKg}
            onChange={setValorKg} min={0} step={0.01} suffix="R$/kg" />
          <NumberField label="Volume da peça" value={volumePecaMl}
            onChange={setVolumePecaMl} min={0.1} step={0.1} suffix="ml" />
        </div>
        <div className="calc-grid-3" style={{ marginTop: "0" }}>
          <NumberField label="Densidade da resina" value={densidadeGml}
            onChange={(v) => setDensidadeGml(Math.max(0.5, v))} min={0.5} step={0.01} suffix="g/ml" />
          <div className="calc-field" style={{ gridColumn: "2 / -1" }}>
            <label className="calc-label" style={{ opacity: 0 }}>.</label>
            <span className="calc-hint" style={{ marginTop: "8px" }}>
              <strong>Densidade típica:</strong> resinas standard 1,08–1,12 g/ml · castable/cera 1,05–1,10 g/ml · tough/ABS-like 1,12–1,18 g/ml.
              Consulte o TDS da resina para o valor exato.
            </span>
          </div>
        </div>
        <p className="calc-hint" style={{ marginTop: "4px", marginBottom: "14px" }}>
          <strong>Preço por kg</strong> = o que você pagou no frasco ÷ peso em kg (frasco de 500 g por R$ 65 → R$ 130/kg).{" "}
          <strong>Volume</strong> = o valor em ml que o fatiador mostra, já com os suportes. A calculadora converte para gramas usando a densidade.
        </p>

        <div className="calc-grid-2">
          <NumberField label="Quantidade de cópias" value={quantidade}
            onChange={(v) => setQuantidade(Math.max(1, v))} min={1} step={1} suffix="peças" />
          <NumberField label="Horas totais de impressão" value={horasImpressao}
            onChange={setHorasImpressao} min={0} step={0.1} suffix="h" />
          <span className="calc-hint" style={{ gridColumn: "1 / -1", marginTop: "-6px" }}>Quantidade de cópias: o volume da peça é multiplicado por ela. Horas: tempo da impressão inteira (todas as cópias juntas na plataforma).</span>
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
            onChange={(v) => setTaxaFalha(Math.min(100, Math.max(0, v)))} min={0} step={1} suffix="%" />
          <div className="calc-tip">
            <Info size={16} />
            <div>
              Resina = <strong>volume × densidade × quantidade + 5% de perda</strong> (resina que fica na cuba e nos suportes).<br />
              Depois somamos energia, consumíveis e pós-processo, e a taxa de falha entra sobre esse total (reserva para reimpressão).
            </div>
          </div>
        </div>
      </div>

      <span className="calc-badge">Resultados</span>
      <div className="calc-metrics-grid">
        <MetricCard label="Volume bruto"         value={resultado.volumeBruto}              unit="ml" />
        <MetricCard label="Margem 5%"            value={resultado.margemSeguranca}           unit="ml" />
        <MetricCard label="Total de resina"      value={resultado.volumeTotal}               unit="ml"  highlight />
        <MetricCard label="Peso da resina"       value={`${resultado.pesoResina_g} g`}       unit={`${resultado.pesoResina_kg} kg`} />
        <MetricCard label="Custo da resina"      value={`R$ ${resultado.custoResina}`}       unit="matéria-prima" />
        <MetricCard label="Energia consumida"    value={resultado.consumoEnergiaKwh}         unit="kWh" />
        <MetricCard label="Custo da energia"     value={`R$ ${resultado.custoEnergia}`}      unit="elétrica" />
        <MetricCard label="Subtotal"             value={`R$ ${resultado.subtotalOperacional}`} unit="antes da falha" />
        <MetricCard label="Impacto da falha"     value={`R$ ${resultado.custoFalha}`}        unit={`${resultado.taxaFalha}%`} />
        <MetricCard label="Custo total real"     value={`R$ ${resultado.custoTotalReal}`}    unit="estimado" highlight />
        <MetricCard label="Custo por peça"       value={`R$ ${resultado.custoPorPeca}`}      unit="/ peça" highlight />
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
