import { useState, useEffect, useCallback } from "react";

const RESINAS = [
  { value: "standard", label: "Standard / Comum",       densidade: 1.10, precoKg: 120, waste: 0.20 },
  { value: "abs",      label: "ABS-like / Rígida",      densidade: 1.12, precoKg: 140, waste: 0.22 },
  { value: "castable", label: "Castable (cera)",         densidade: 1.05, precoKg: 280, waste: 0.28 },
  { value: "dental",   label: "Dental / Biocompatível", densidade: 1.15, precoKg: 350, waste: 0.18 },
  { value: "flexible", label: "Flexível / Borracha",    densidade: 1.08, precoKg: 160, waste: 0.25 },
  { value: "water",    label: "Water Washable",          densidade: 1.09, precoKg: 130, waste: 0.20 },
];

function calcCusto(resina, volumeCm3, suportesPct, quantidade, precoCustom) {
  const volSuportes = volumeCm3 * (suportesPct / 100);
  const volTotal = (volumeCm3 + volSuportes) * quantidade;
  const volComWaste = volTotal * (1 + resina.waste);
  const massaG = volComWaste * resina.densidade;
  const massaKg = massaG / 1000;
  const preco = precoCustom > 0 ? precoCustom : resina.precoKg;
  const custoTotal = massaKg * preco;
  const custoPorPeca = custoTotal / quantidade;
  const impressoesPor500 = Math.floor(500 / volComWaste);
  return {
    volMl: parseFloat(volComWaste.toFixed(1)),
    massaG: parseFloat(massaG.toFixed(1)),
    custoTotal: parseFloat(custoTotal.toFixed(2)),
    custoPorPeca: parseFloat(custoPorPeca.toFixed(2)),
    impressoesPor500: impressoesPor500 > 0 ? impressoesPor500 : "<1",
    precoUsado: preco,
  };
}

export default function ComparadorCusto() {
  const [volumeCm3,   setVolumeCm3]   = useState(10);
  const [suportesPct, setSuportesPct] = useState(15);
  const [quantidade,  setQuantidade]  = useState(1);
  const [selecionadas, setSelecionadas] = useState(["standard", "abs", "castable"]);
  const [precosCustom, setPrecosCustom] = useState({});
  const [resultados, setResultados] = useState([]);

  const recalc = useCallback(() => {
    const res = RESINAS
      .filter(r => selecionadas.includes(r.value))
      .map(r => ({
        ...r,
        resultado: calcCusto(r, volumeCm3, suportesPct, quantidade, precosCustom[r.value] || 0),
      }))
      .sort((a, b) => a.resultado.custoPorPeca - b.resultado.custoPorPeca);
    setResultados(res);
  }, [volumeCm3, suportesPct, quantidade, selecionadas, precosCustom]);

  useEffect(() => { recalc(); }, [recalc]);

  const toggleResina = v => {
    setSelecionadas(s =>
      s.includes(v)
        ? s.length > 1 ? s.filter(x => x !== v) : s
        : [...s, v]
    );
  };

  const melhor = resultados[0];

  return (
    <section style={s.section}>
      <div style={s.header}>
        <span style={s.badge}>COMPARADOR</span>
        <h2 style={s.title}>Comparador de Custo entre Resinas</h2>
        <p style={s.subtitle}>
          Compare o custo real de impressão entre diferentes tipos de resina
          para a mesma peça e tome a melhor decisão de compra.
        </p>
      </div>

      {/* Parâmetros da peça */}
      <div style={s.card}>
        <p style={s.cardLabel}>PARÂMETROS DA PEÇA</p>
        <div style={s.grid3}>
          <NumberField label="Volume da peça" value={volumeCm3} onChange={setVolumeCm3} min={0.1} max={5000} step={0.1} suffix="cm³" />
          <NumberField label="Suportes" value={suportesPct} onChange={setSuportesPct} min={0} max={60} step={5} suffix="%" />
          <NumberField label="Quantidade" value={quantidade} onChange={setQuantidade} min={1} max={500} step={1} suffix="peças" />
        </div>
      </div>

      {/* Seleção de resinas */}
      <div style={s.card}>
        <p style={s.cardLabel}>SELECIONE AS RESINAS PARA COMPARAR</p>
        <div style={s.resinasGrid}>
          {RESINAS.map(r => (
            <button key={r.value}
              style={{ ...s.resinBtn, ...(selecionadas.includes(r.value) ? s.resinBtnActive : {}) }}
              onClick={() => toggleResina(r.value)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preços customizados */}
      <div style={s.card}>
        <p style={s.cardLabel}>AJUSTE OS PREÇOS (opcional — deixe 0 para usar referência)</p>
        <div style={s.grid3}>
          {RESINAS.filter(r => selecionadas.includes(r.value)).map(r => (
            <div key={r.value} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={s.label}>{r.label}</label>
              <div style={s.inputWrap}>
                <input
                  type="number" min={0} step={1}
                  value={precosCustom[r.value] || ""}
                  placeholder={`R$ ${r.precoKg}/kg`}
                  onChange={e => setPrecosCustom(p => ({ ...p, [r.value]: parseFloat(e.target.value) || 0 }))}
                  style={s.input}
                />
                <span style={s.inputSuffix}>R$/kg</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <>
          <span style={s.badge}>RESULTADO DA COMPARAÇÃO</span>

          {/* Destaque melhor opção */}
          {melhor && (
            <div style={s.melhorBox}>
              <span style={{ fontSize: 20 }}>🏆</span>
              <div>
                <p style={s.melhorTitle}>Melhor custo-benefício: {melhor.label}</p>
                <p style={s.melhorSub}>
                  R$ {melhor.resultado.custoPorPeca.toFixed(2)}/peça —
                  {resultados.length > 1 && ` ${Math.round(((resultados[resultados.length - 1].resultado.custoPorPeca - melhor.resultado.custoPorPeca) / resultados[resultados.length - 1].resultado.custoPorPeca) * 100)}% mais barato que a opção mais cara da lista`}
                </p>
              </div>
            </div>
          )}

          {/* Tabela comparativa */}
          <div style={s.tabelaWrap}>
            <div style={s.tabelaHeader}>
              <span style={{ flex: 2 }}>Resina</span>
              <span style={s.tabelaCol}>Vol. (ml)</span>
              <span style={s.tabelaCol}>Massa (g)</span>
              <span style={s.tabelaCol}>Custo total</span>
              <span style={s.tabelaCol}>Por peça</span>
              <span style={s.tabelaCol}>Imp/500ml</span>
            </div>
            {resultados.map((r, i) => (
              <div key={r.value} style={{ ...s.tabelaRow, ...(i === 0 ? s.tabelaRowBest : {}) }}>
                <span style={{ flex: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  {i === 0 && <span style={s.crownIcon}>🏆</span>}
                  <span style={{ fontSize: "13px", fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "#00d4ff" : "#fff" }}>{r.label}</span>
                </span>
                <span style={s.tabelaVal}>{r.resultado.volMl}</span>
                <span style={s.tabelaVal}>{r.resultado.massaG}</span>
                <span style={s.tabelaVal}>R$ {r.resultado.custoTotal.toFixed(2)}</span>
                <span style={{ ...s.tabelaVal, color: i === 0 ? "#00d4ff" : i === resultados.length - 1 ? "#ff6b6b" : "#fff", fontWeight: i === 0 ? 700 : 400 }}>
                  R$ {r.resultado.custoPorPeca.toFixed(2)}
                </span>
                <span style={s.tabelaVal}>{r.resultado.impressoesPor500}</span>
              </div>
            ))}
          </div>

          {/* Barras visuais */}
          <div style={s.card}>
            <p style={s.cardLabel}>CUSTO POR PEÇA — COMPARAÇÃO VISUAL</p>
            {resultados.map((r, i) => {
              const maxCusto = resultados[resultados.length - 1].resultado.custoPorPeca;
              const pct = maxCusto > 0 ? (r.resultado.custoPorPeca / maxCusto) * 100 : 100;
              return (
                <div key={r.value} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "12px", color: i === 0 ? "#00d4ff" : "rgba(255,255,255,.7)" }}>{r.label}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: i === 0 ? "#00d4ff" : "#fff" }}>R$ {r.resultado.custoPorPeca.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,.07)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      width: `${pct}%`,
                      background: i === 0 ? "#00d4ff" : i === resultados.length - 1 ? "#ff6b6b" : "rgba(255,255,255,.3)",
                      transition: "width .5s ease"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dica final */}
          <div style={s.tipBox}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <span>
              O menor custo por peça nem sempre é a melhor escolha —
              considere também a resistência mecânica, acabamento superficial
              e aplicação final da peça antes de decidir.
            </span>
          </div>
        </>
      )}

      <p style={s.disclaimer}>
        * Preços de referência do mercado brasileiro. Atualize com os preços reais do seu fornecedor para resultados precisos.
      </p>
    </section>
  );
}

function NumberField({ label, value, onChange, min, max, step, suffix }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "13px", color: "rgba(255,255,255,.5)" }}>{label}</label>
      <div style={s.inputWrap}>
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(Number(e.target.value))}
          style={s.input} />
        {suffix && <span style={s.inputSuffix}>{suffix}</span>}
      </div>
    </div>
  );
}

const s = {
  section: { background: "transparent", color: "#fff", padding: "2rem 0", fontFamily: "'Inter',sans-serif" },
  header: { marginBottom: "1.5rem" },
  badge: { display: "inline-block", fontSize: "11px", fontWeight: 600, letterSpacing: ".1em", color: "#00d4ff", marginBottom: 8 },
  title: { fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, margin: "0 0 12px", color: "#fff", lineHeight: 1.1 },
  subtitle: { fontSize: "14px", color: "rgba(255,255,255,.55)", maxWidth: 640, lineHeight: 1.6, margin: 0 },
  card: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "1.25rem", marginBottom: 12 },
  cardLabel: { fontSize: "11px", color: "rgba(255,255,255,.3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 },
  label: { fontSize: "13px", color: "rgba(255,255,255,.5)" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  inputWrap: { display: "flex", alignItems: "center", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, overflow: "hidden" },
  input: { flex: 1, background: "transparent", border: "none", color: "#fff", padding: "10px 12px", fontSize: "14px", outline: "none" },
  inputSuffix: { fontSize: "12px", color: "rgba(255,255,255,.3)", padding: "0 10px", whiteSpace: "nowrap" },
  resinasGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  resinBtn: { padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.55)", fontSize: "13px", cursor: "pointer", transition: "all .2s" },
  resinBtnActive: { background: "rgba(0,212,255,.1)", border: "1px solid rgba(0,212,255,.35)", color: "#00d4ff" },
  melhorBox: { display: "flex", gap: 12, alignItems: "flex-start", background: "rgba(0,212,255,.07)", border: "1px solid rgba(0,212,255,.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 14, marginTop: 10 },
  melhorTitle: { fontSize: "14px", fontWeight: 700, color: "#00d4ff", margin: "0 0 3px" },
  melhorSub: { fontSize: "12px", color: "rgba(255,255,255,.5)", margin: 0 },
  tabelaWrap: { background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  tabelaHeader: { display: "flex", padding: "10px 14px", background: "rgba(255,255,255,.05)", fontSize: "10px", color: "rgba(255,255,255,.35)", letterSpacing: ".07em", textTransform: "uppercase", gap: 8 },
  tabelaCol: { flex: 1, textAlign: "right" },
  tabelaRow: { display: "flex", padding: "11px 14px", borderTop: "1px solid rgba(255,255,255,.05)", gap: 8, alignItems: "center" },
  tabelaRowBest: { background: "rgba(0,212,255,.05)" },
  tabelaVal: { flex: 1, textAlign: "right", fontSize: "13px", color: "#fff", fontVariantNumeric: "tabular-nums" },
  crownIcon: { fontSize: 13 },
  tipBox: { display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,.03)", borderLeft: "3px solid rgba(0,212,255,.4)", borderRadius: "0 8px 8px 0", padding: "10px 12px", marginBottom: 12, fontSize: "13px", color: "rgba(255,255,255,.55)", lineHeight: 1.6 },
  disclaimer: { fontSize: "11px", color: "rgba(255,255,255,.2)", lineHeight: 1.6, margin: 0 },
};
