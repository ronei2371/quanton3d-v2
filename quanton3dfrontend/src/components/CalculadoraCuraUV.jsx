import { useState, useEffect, useCallback } from "react";

const RESINAS = [
  { value: "standard", label: "Standard / Comum" },
  { value: "abs",      label: "ABS-like / Rígida" },
  { value: "castable", label: "Castable (cera)" },
  { value: "dental",   label: "Dental / Biocompatível" },
  { value: "flexible", label: "Flexível / Borracha" },
  { value: "water",    label: "Water Washable" },
];

const TAMANHOS = [
  { value: "micro",  label: "Micro — até 2 cm",    fator: 0.7 },
  { value: "pequeno",label: "Pequeno — 2 a 5 cm",  fator: 1.0 },
  { value: "medio",  label: "Médio — 5 a 10 cm",   fator: 1.4 },
  { value: "grande", label: "Grande — 10 a 20 cm", fator: 1.8 },
  { value: "xlarge", label: "Extra grande — 20cm+", fator: 2.4 },
];

const FONTES = [
  { value: "405_6w",  label: "Câmara UV 405nm — até 6W",   potencia: 6 },
  { value: "405_36w", label: "Câmara UV 405nm — 36W",      potencia: 36 },
  { value: "405_60w", label: "Câmara UV 405nm — 60W+",     potencia: 60 },
  { value: "sol",     label: "Sol direto (exterior)",       potencia: 80 },
  { value: "lamp",    label: "Lâmpada UV genérica — 9W",   potencia: 9 },
];

const BASE_CURE = {
  standard: { minutos: 3,  emAgua: false, estagio2: false },
  abs:      { minutos: 4,  emAgua: false, estagio2: false },
  castable: { minutos: 6,  emAgua: true,  estagio2: true  },
  dental:   { minutos: 8,  emAgua: true,  estagio2: true  },
  flexible: { minutos: 5,  emAgua: false, estagio2: false },
  water:    { minutos: 3,  emAgua: false, estagio2: false },
};

const TEMP_MULT = { hot: 0.85, normal: 1.0, cold: 1.25 };

const DICAS = {
  standard: "Gire a peça na metade do tempo para cura uniforme.",
  abs:      "Peças ABS-like ficam mais rígidas com cura completa. Não interrompa antes do tempo.",
  castable: "Cure em dois estágios: primeiro em água por metade do tempo, depois ao ar. Evita deformação.",
  dental:   "Siga rigorosamente o protocolo do fabricante. A cura insuficiente compromete a biocompatibilidade.",
  flexible: "Não cure demais — peças flexíveis ficam quebradiças com excesso de UV. Teste a flexibilidade antes.",
  water:    "Lave em água limpa antes de curar. Resíduos de resina na superfície causam manchas.",
};

function calcular({ resina, tamanho, fonte, temp }) {
  const base = BASE_CURE[resina];
  const tam = TAMANHOS.find(t => t.value === tamanho);
  const fon = FONTES.find(f => f.value === fonte);
  const tm  = TEMP_MULT[temp] ?? 1.0;
  const potenciaFator = 36 / (fon?.potencia ?? 36);

  const minutos = parseFloat((base.minutos * tam.fator * tm * potenciaFator).toFixed(1));
  const estagio1 = base.estagio2 ? parseFloat((minutos * 0.5).toFixed(1)) : minutos;
  const estagio2 = base.estagio2 ? parseFloat((minutos * 0.5).toFixed(1)) : null;
  const distancia = fon?.potencia >= 60 ? "15-20 cm" : fon?.potencia >= 36 ? "8-12 cm" : "5-8 cm";

  return { minutos, estagio1, estagio2, distancia, emAgua: base.emAgua, estagio2flag: base.estagio2 };
}

export default function CalculadoraCuraUV() {
  const [resina,  setResina]  = useState("standard");
  const [tamanho, setTamanho] = useState("pequeno");
  const [fonte,   setFonte]   = useState("405_36w");
  const [temp,    setTemp]    = useState("normal");
  const [result,  setResult]  = useState(null);

  const recalc = useCallback(() => {
    setResult(calcular({ resina, tamanho, fonte, temp }));
  }, [resina, tamanho, fonte, temp]);

  useEffect(() => { recalc(); }, [recalc]);

  return (
    <section style={s.section}>
      <div style={s.header}>
        <span style={s.badge}>CALCULADORA</span>
        <h2 style={s.title}>Calculadora de Cura UV</h2>
        <p style={s.subtitle}>
          Descubra o tempo ideal de cura para sua peça conforme o tipo de resina, tamanho e fonte UV disponível.
        </p>
      </div>

      <div style={s.card}>
        <div style={s.grid2}>
          <Field label="Tipo de resina" value={resina} onChange={setResina} options={RESINAS} />
          <Field label="Tamanho da peça" value={tamanho} onChange={setTamanho} options={TAMANHOS} />
        </div>
        <div style={s.grid2}>
          <Field label="Fonte de cura UV" value={fonte} onChange={setFonte} options={FONTES} />
          <Field label="Temperatura ambiente" value={temp} onChange={setTemp} options={[
            { value: "hot",    label: "Quente — acima de 28°C" },
            { value: "normal", label: "Normal — 20 a 28°C" },
            { value: "cold",   label: "Fria — abaixo de 20°C" },
          ]} />
        </div>
      </div>

      {result && (
        <>
          <span style={s.badge}>RESULTADO</span>

          {/* Destaque principal */}
          <div style={s.mainResult}>
            <div style={s.mainLeft}>
              <p style={s.mainLabel}>TEMPO TOTAL DE CURA</p>
              <p style={s.mainVal}>{result.minutos} min</p>
              <p style={s.mainSub}>distância recomendada: {result.distancia}</p>
            </div>
            {result.estagio2flag && (
              <div style={s.estagios}>
                <div style={s.estagio}>
                  <span style={s.estagioNum}>1</span>
                  <div>
                    <p style={s.estagioLabel}>{result.emAgua ? "Em água" : "Estágio 1"}</p>
                    <p style={s.estagioVal}>{result.estagio1} min</p>
                  </div>
                </div>
                <div style={s.estagioDivider} />
                <div style={s.estagio}>
                  <span style={s.estagioNum}>2</span>
                  <div>
                    <p style={s.estagioLabel}>Ao ar</p>
                    <p style={s.estagioVal}>{result.estagio2} min</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cards secundários */}
          <div style={s.metricsGrid}>
            <MetricCard label="Estágio em água" value={result.emAgua ? "Sim" : "Não"} color={result.emAgua ? "cyan" : "neutral"} />
            <MetricCard label="Dois estágios" value={result.estagio2flag ? "Sim" : "Não"} color={result.estagio2flag ? "warn" : "neutral"} />
            <MetricCard label="Distância fonte" value={result.distancia} color="neutral" />
          </div>

          {/* Passos */}
          <div style={s.card}>
            <p style={s.stepsTitle}>PROTOCOLO RECOMENDADO</p>
            <Step n={1} texto={`Lave a peça em ${result.emAgua ? "água corrente" : "álcool isopropílico 95%+"} por 2-5 minutos antes de curar.`} />
            {result.estagio2flag
              ? <>
                  <Step n={2} texto={`Coloque a peça submersa em água limpa e cure por ${result.estagio1} minutos a ${result.distancia} da fonte UV.`} />
                  <Step n={3} texto={`Retire da água, seque com papel toalha e cure ao ar por mais ${result.estagio2} minutos.`} />
                </>
              : <Step n={2} texto={`Posicione a peça a ${result.distancia} da fonte UV e cure por ${result.minutos} minutos. Gire na metade do tempo.`} />
            }
            <Step n={result.estagio2flag ? 4 : 3} texto="Verifique se a superfície não está mais pegajosa. Se estiver, adicione 1-2 minutos extras." />

            <div style={s.tipBox}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
              <span>{DICAS[resina]}</span>
            </div>
          </div>
        </>
      )}

      <p style={s.disclaimer}>
        * Tempos estimados com base em parâmetros técnicos da comunidade. Fontes UV de diferentes marcas
        podem variar. Sempre teste uma peça pequena antes de curar peças críticas.
      </p>
    </section>
  );
}

function Field({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: "13px", color: "rgba(255,255,255,.55)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={s.select}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  const colors = {
    cyan:    { bg: "rgba(0,212,255,.08)",  border: "rgba(0,212,255,.2)",  val: "#00d4ff" },
    warn:    { bg: "rgba(255,170,0,.07)",  border: "rgba(255,170,0,.2)",  val: "#ffaa00" },
    neutral: { bg: "rgba(255,255,255,.04)", border: "rgba(255,255,255,.08)", val: "#fff" },
  };
  const c = colors[color] || colors.neutral;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: "20px", fontWeight: 700, color: c.val, margin: 0 }}>{value}</p>
    </div>
  );
}

function Step({ n, texto }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,212,255,.15)", border: "1px solid rgba(0,212,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#00d4ff" }}>{n}</span>
      </div>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,.65)", lineHeight: 1.55, margin: 0 }}>{texto}</p>
    </div>
  );
}

const s = {
  section: { background: "transparent", color: "#fff", padding: "2rem 0", fontFamily: "'Inter',sans-serif" },
  header: { marginBottom: "1.5rem" },
  badge: { display: "inline-block", fontSize: "11px", fontWeight: 600, letterSpacing: ".1em", color: "#00d4ff", marginBottom: 8 },
  title: { fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, margin: "0 0 12px", color: "#fff", lineHeight: 1.1 },
  subtitle: { fontSize: "14px", color: "rgba(255,255,255,.55)", maxWidth: 600, lineHeight: 1.6, margin: 0 },
  card: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1rem" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  select: { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#fff", padding: "10px 12px", fontSize: "14px", outline: "none", cursor: "pointer", width: "100%" },
  mainResult: { display: "flex", gap: 16, background: "rgba(0,212,255,.07)", border: "1px solid rgba(0,212,255,.2)", borderRadius: 16, padding: "20px", marginBottom: 12 },
  mainLeft: { flex: 1 },
  mainLabel: { fontSize: "11px", color: "rgba(0,212,255,.6)", letterSpacing: ".1em", margin: "0 0 6px" },
  mainVal: { fontSize: "48px", fontWeight: 800, color: "#00d4ff", margin: "0 0 4px", lineHeight: 1 },
  mainSub: { fontSize: "12px", color: "rgba(255,255,255,.4)", margin: 0 },
  estagios: { display: "flex", alignItems: "center", gap: 12 },
  estagio: { display: "flex", alignItems: "center", gap: 10 },
  estagioNum: { width: 28, height: 28, borderRadius: "50%", background: "rgba(0,212,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#00d4ff" },
  estagioLabel: { fontSize: "11px", color: "rgba(255,255,255,.4)", margin: "0 0 2px" },
  estagioVal: { fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 },
  estagioDivider: { width: 1, height: 40, background: "rgba(255,255,255,.1)" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 },
  stepsTitle: { fontSize: "11px", color: "rgba(255,255,255,.3)", letterSpacing: ".08em", marginBottom: 12 },
  tipBox: { display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,.03)", borderLeft: "3px solid rgba(0,212,255,.4)", borderRadius: "0 8px 8px 0", padding: "10px 12px", marginTop: 12, fontSize: "13px", color: "rgba(255,255,255,.55)", lineHeight: 1.6 },
  disclaimer: { fontSize: "11px", color: "rgba(255,255,255,.2)", lineHeight: 1.6, margin: "12px 0 0" },
};
