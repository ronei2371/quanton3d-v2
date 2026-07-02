import { useMemo, useState } from "react";

const RESINAS = [
  ["Quanton3D Pyroblast", 150],
  ["Quanton3D Spark", 168],
  ["Quanton3D Alchemist", 175],
  ["Quanton3D Athom Dental", 179],
  ["Quanton3D Spin", 200],
  ["Quanton3D Athom Alinhadores", 210],
  ["Quanton3D Low Smell", 242],
  ["Quanton3D Poseidon", 255],
  ["Quanton3D 70/30", 259],
  ["Quanton3D Iron", 263],
  ["Quanton3D Flexform", 309],
  ["Quanton3D Vulcan Cast", 539],
];

const CAMPOS_INICIAIS = {
  resina: "",
  priceKg: "",
  qtyG: "",
  lossPct: "5",
  failurePct: "5",
  alcoholMl: "",
  alcoholValue: "",
  disposables: "",
  printerW: "",
  printMin: "",
  kwhValue: "",
  finishSupplies: "",
  finishMin: "",
  laborHour: "",
  printerValue: "",
  fepCost: "",
  lcdCost: "",
  printerLifeH: "4000",
  lcdLifeH: "1500",
  fepLifePrints: "40",
  jobPrints: "1",
  alcoholReusePct: "0",
  cureW: "60",
  cureMin: "30",
  extraEnergyCost: "0",
  packaging: "0",
  prepMin: "0",
  adminCost: "0",
  profitMargin: "20",
  taxPct: "0",
  commissionPct: "0",
  marginMode: "real",
  roundTo: "5",
};

const EXEMPLO = {
  ...CAMPOS_INICIAIS,
  resina: "179",
  priceKg: "179,00",
  qtyG: "1580",
  alcoholMl: "300",
  alcoholValue: "32,00",
  disposables: "5,00",
  printerW: "120",
  printMin: "180",
  kwhValue: "0,90",
  finishSupplies: "25,00",
  finishMin: "720",
  laborHour: "100,00",
  printerValue: "3500,00",
  fepCost: "120,00",
  lcdCost: "900,00",
  prepMin: "30",
};

function parseBR(value) {
  if (value === null || value === undefined) return 0;
  let texto = String(value).trim();
  if (!texto) return 0;
  texto = texto.replace(/R\$|\s/g, "");
  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }
  const numero = Number(texto.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numero) ? numero : 0;
}

function dinheiro(valor) {
  return (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percentual(valor) {
  return `${(Number(valor) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function limitar(valor, min, max) {
  return Math.min(max, Math.max(min, Number(valor) || 0));
}

function dividirSeguro(a, b) {
  const divisor = Number(b) || 0;
  return divisor > 0 ? (Number(a) || 0) / divisor : 0;
}

function arredondarParaCima(valor, passo) {
  const step = Number(passo) || 0;
  return step ? Math.ceil(valor / step) * step : valor;
}


function Campo({ label, name, form, onChange, placeholder, required = false }) {
  return (
    <label className="field">
      <span>{label}{required ? " *" : ""}</span>
      <input
        value={form[name]}
        onChange={(e) => onChange(name, e.target.value)}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function CalculadoraCustos() {
  const [form, setForm] = useState(CAMPOS_INICIAIS);

  const alterar = (campo, valor) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const selecionarResina = (valor) => {
    const preco = valor ? Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "";
    setForm((atual) => ({ ...atual, resina: valor, priceKg: preco || atual.priceKg }));
  };

  const resultado = useMemo(() => {
    const d = Object.fromEntries(Object.entries(form).map(([chave, valor]) => [chave, parseBR(valor)]));
    const printH = d.printMin / 60;
    const finishH = d.finishMin / 60;
    const prepH = d.prepMin / 60;
    const cureH = d.cureMin / 60;
    const resinGWithLoss = d.qtyG * (1 + limitar(d.lossPct, 0, 100) / 100);
    const resinCost = (d.priceKg / 1000) * resinGWithLoss;
    const alcoholCost = (d.alcoholMl / 1000) * d.alcoholValue * (1 - limitar(d.alcoholReusePct, 0, 100) / 100);
    const printerKwh = (d.printerW / 1000) * printH;
    const cureKwh = (d.cureW / 1000) * cureH;
    const energyKwh = printerKwh + cureKwh;
    const energyCost = energyKwh * d.kwhValue + Math.max(0, d.extraEnergyCost || 0);
    const laborCost = (finishH + prepH) * d.laborHour;
    const printerDep = dividirSeguro(d.printerValue, d.printerLifeH) * printH;
    const lcdDep = dividirSeguro(d.lcdCost, d.lcdLifeH) * printH;
    const fepDep = dividirSeguro(d.fepCost, d.fepLifePrints) * Math.max(1, d.jobPrints || 1);
    const baseCost = resinCost + alcoholCost + d.disposables + energyCost + d.finishSupplies + laborCost + printerDep + lcdDep + fepDep + d.packaging + d.adminCost;
    const fail = limitar(d.failurePct, 0, 95) / 100;
    const costWithFailure = fail >= 0.95 ? baseCost : baseCost / (1 - fail);
    const taxPct = limitar(d.taxPct, 0, 90) / 100;
    const commissionPct = limitar(d.commissionPct, 0, 90) / 100;
    const margem = limitar(d.profitMargin, -95, 95) / 100;
    const breakEvenSale = 1 - taxPct - commissionPct <= 0 ? 0 : costWithFailure / (1 - taxPct - commissionPct);
    const rawSale = form.marginMode === "real"
      ? (1 - taxPct - commissionPct - margem <= 0 ? 0 : costWithFailure / (1 - taxPct - commissionPct - margem))
      : costWithFailure * (1 + margem);
    const sale = arredondarParaCima(rawSale, d.roundTo);
    const taxValue = sale * taxPct;
    const commissionValue = sale * commissionPct;
    const netProfit = sale - costWithFailure - taxValue - commissionValue;
    const realMargin = sale > 0 ? (netProfit / sale) * 100 : 0;

    return {
      ...d,
      resinGWithLoss,
      resinCost,
      alcoholCost,
      energyKwh,
      energyCost,
      laborCost,
      printerDep,
      lcdDep,
      fepDep,
      baseCost,
      failureReserve: costWithFailure - baseCost,
      costWithFailure,
      breakEvenSale,
      sale,
      taxValue,
      commissionValue,
      netProfit,
      realMargin,
      costPerGram: d.qtyG > 0 ? costWithFailure / d.qtyG : 0,
      salePerGram: d.qtyG > 0 ? sale / d.qtyG : 0,
    };
  }, [form]);

  const resumo = [
    "Resumo do orçamento — Impressão 3D em resina",
    `Custo técnico estimado: ${dinheiro(resultado.costWithFailure)}`,
    `Preço mínimo sem lucro: ${dinheiro(resultado.breakEvenSale)}`,
    `Preço sugerido de venda: ${dinheiro(resultado.sale)}`,
    `Lucro líquido estimado: ${dinheiro(resultado.netProfit)} (${percentual(resultado.realMargin)})`,
    `Energia estimada: ${resultado.energyKwh.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kWh / ${dinheiro(resultado.energyCost)}`,
    "Observação: cálculo considera resina, lavagem, descartáveis, energia, acabamento, mão de obra, desgaste e risco de falha.",
  ].join("\n");

  const copiarResumo = async () => {
    await navigator.clipboard?.writeText(resumo);
  };

  return (
    <div className="modal-rich-content">
      <p>Calcule o custo real da peça considerando resina, álcool, descartáveis, energia, acabamento, mão de obra, desgaste de FEP/LCD/impressora, risco de falha e margem.</p>

      <div className="selector-grid">
        <label className="field">
          <span>Produto / Resina</span>
          <select value={form.resina} onChange={(e) => selecionarResina(e.target.value)}>
            <option value="">Selecione ou preencha manualmente</option>
            {RESINAS.map(([nome, preco]) => (
              <option key={nome} value={preco}>{nome} — {dinheiro(preco)}/kg</option>
            ))}
          </select>
        </label>
        <Campo label="Preço por quilo (R$/kg)" name="priceKg" form={form} onChange={alterar} placeholder="Ex: 179,00" required />
        <Campo label="Quantidade utilizada (g)" name="qtyG" form={form} onChange={alterar} placeholder="Ex: 1580" required />
        <Campo label="Perda técnica de resina (%)" name="lossPct" form={form} onChange={alterar} placeholder="Ex: 5" />
        <Campo label="Risco de falha/refação (%)" name="failurePct" form={form} onChange={alterar} placeholder="Ex: 5" />
        <Campo label="Consumo de álcool (mL)" name="alcoholMl" form={form} onChange={alterar} placeholder="Ex: 300" required />
        <Campo label="Valor do álcool (R$/L)" name="alcoholValue" form={form} onChange={alterar} placeholder="Ex: 32,00" required />
        <Campo label="Descartáveis (R$)" name="disposables" form={form} onChange={alterar} placeholder="Ex: 5,00" required />
        <Campo label="Consumo da impressora (W)" name="printerW" form={form} onChange={alterar} placeholder="Ex: 120" required />
        <Campo label="Tempo de impressão (min)" name="printMin" form={form} onChange={alterar} placeholder="Ex: 180" required />
        <Campo label="Valor do kWh (R$)" name="kwhValue" form={form} onChange={alterar} placeholder="Ex: 0,90" required />
        <Campo label="Insumos p/ acabamento (R$)" name="finishSupplies" form={form} onChange={alterar} placeholder="Ex: 25,00" required />
        <Campo label="Tempo acabamento (min)" name="finishMin" form={form} onChange={alterar} placeholder="Ex: 720" required />
        <Campo label="Mão de obra (R$/h)" name="laborHour" form={form} onChange={alterar} placeholder="Ex: 100,00" required />
        <Campo label="Valor da impressora (R$)" name="printerValue" form={form} onChange={alterar} placeholder="Ex: 3500,00" required />
        <Campo label="Custo do FEP (R$)" name="fepCost" form={form} onChange={alterar} placeholder="Ex: 120,00" required />
        <Campo label="Custo da tela LCD (R$)" name="lcdCost" form={form} onChange={alterar} placeholder="Ex: 900,00" required />
        <Campo label="Margem desejada (%)" name="profitMargin" form={form} onChange={alterar} placeholder="Ex: 20" required />
      </div>

      <details open style={{ marginTop: "16px" }}>
        <summary>Configurações avançadas de custo</summary>
        <div className="selector-grid" style={{ marginTop: "12px" }}>
          <Campo label="Vida útil impressora (h)" name="printerLifeH" form={form} onChange={alterar} />
          <Campo label="Vida útil LCD (h)" name="lcdLifeH" form={form} onChange={alterar} />
          <Campo label="Vida útil FEP (impressões)" name="fepLifePrints" form={form} onChange={alterar} />
          <Campo label="Impressões usadas no job" name="jobPrints" form={form} onChange={alterar} />
          <Campo label="Reaproveitamento álcool (%)" name="alcoholReusePct" form={form} onChange={alterar} />
          <Campo label="Lavadora/cura UV (W)" name="cureW" form={form} onChange={alterar} />
          <Campo label="Tempo lavadora/cura (min)" name="cureMin" form={form} onChange={alterar} />
          <Campo label="Gasto extra de luz (R$)" name="extraEnergyCost" form={form} onChange={alterar} />
          <Campo label="Embalagem final (R$)" name="packaging" form={form} onChange={alterar} />
          <Campo label="Tempo de preparação (min)" name="prepMin" form={form} onChange={alterar} />
          <Campo label="Custo administrativo (R$)" name="adminCost" form={form} onChange={alterar} />
          <Campo label="Impostos / taxas (%)" name="taxPct" form={form} onChange={alterar} />
          <Campo label="Comissão (%)" name="commissionPct" form={form} onChange={alterar} />
          <label className="field">
            <span>Tipo de cálculo da margem</span>
            <select value={form.marginMode} onChange={(e) => alterar("marginMode", e.target.value)}>
              <option value="real">Margem real sobre venda</option>
              <option value="markup">Markup sobre custo</option>
            </select>
          </label>
          <label className="field">
            <span>Arredondar preço para</span>
            <select value={form.roundTo} onChange={(e) => alterar("roundTo", e.target.value)}>
              <option value="0">Não arredondar</option>
              <option value="1">R$ 1,00</option>
              <option value="5">R$ 5,00</option>
              <option value="10">R$ 10,00</option>
              <option value="50">R$ 50,00</option>
            </select>
          </label>
        </div>
      </details>

      <div className="stats-grid" style={{ marginTop: "18px" }}>
        <Kpi label="Preço sugerido" value={resultado.sale > 0 ? dinheiro(resultado.sale) : "Revise a margem"} />
        <Kpi label="Custo real estimado" value={dinheiro(resultado.costWithFailure)} />
        <Kpi label="Lucro líquido" value={dinheiro(resultado.netProfit)} />
        <Kpi label="Energia" value={`${dinheiro(resultado.energyCost)} / ${resultado.energyKwh.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kWh`} />
        <Kpi label="Preço mínimo sem lucro" value={dinheiro(resultado.breakEvenSale)} />
        <Kpi label="Margem líquida real" value={percentual(resultado.realMargin)} />
      </div>

      <div className="modal-action-grid" style={{ marginTop: "18px" }}>
        <button type="button" onClick={() => setForm(EXEMPLO)}>Preencher exemplo</button>
        <button type="button" onClick={() => setForm(CAMPOS_INICIAIS)}>Limpar</button>
        <button type="button" onClick={copiarResumo}>Copiar resumo</button>
      </div>

      <label style={{ marginTop: "18px" }}>
        <span>Resumo para orçamento</span>
        <textarea readOnly rows="7" value={resumo} />
      </label>
    </div>
  );
}
