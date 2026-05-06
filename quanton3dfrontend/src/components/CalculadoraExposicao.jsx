
import { useEffect, useMemo, useState } from "react";
import api from "../api";

const TEMPERATURAS = [
  { value: "hot", label: "Quente — acima de 28°C", fator: 0.9 },
  { value: "normal", label: "Normal — 20 a 28°C", fator: 1.0 },
  { value: "cold", label: "Fria — abaixo de 20°C", fator: 1.12 },
];

const CAMADAS = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1];

function numero(texto, fallback = 0) {
  const n = parseFloat(String(texto || "").replace(",", ".").replace(/[^\d.]+/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function tituloResina(nome = "") {
  return String(nome || "").trim() || "Sem nome";
}

function tituloImpressora(nome = "") {
  return String(nome || "").trim() || "Sem impressora";
}

function estiloOption() {
  return { color: "#111827", backgroundColor: "#ffffff" };
}

function indiceCamadaReceita(receita) {
  if (!receita) return 4;
  const camadaBase = numero(receita.alturaCamada, 0.05);
  const idx = CAMADAS.findIndex((item) => Math.abs(item - camadaBase) < 0.001);
  return idx >= 0 ? idx : 4;
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

function MetricCard({ label, value, unit, highlight = false, sub = "" }) {
  return (
    <div style={{ ...styles.metricCard, ...(highlight ? styles.metricHighlight : {}) }}>
      <p style={{ ...styles.metricLabel, ...(highlight ? styles.metricLabelHL : {}) }}>{label}</p>
      <p style={{ ...styles.metricVal, ...(highlight ? styles.metricValHL : {}) }}>{value}</p>
      <span style={styles.metricUnit}>{unit}</span>
      {sub ? <p style={styles.metricSub}>{sub}</p> : null}
    </div>
  );
}

export default function CalculadoraExposicao() {
  const [parametros, setParametros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [layerIdx, setLayerIdx] = useState(4);
  const [temp, setTemp] = useState("normal");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");
        const resposta = await api.get("/parametros");
        const lista = Array.isArray(resposta.data?.parametros)
          ? resposta.data.parametros
          : Array.isArray(resposta.data)
          ? resposta.data
          : [];

        if (!ativo) return;

        setParametros(lista);
      } catch (error) {
        console.error("Erro ao carregar parâmetros para calculadora:", error);
        if (!ativo) return;
        setErro("Não foi possível carregar resinas e impressoras da Quanton3D.");
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

  const resinaAtual = opcoesResina.some((item) => item.value === resinaSelecionada)
    ? resinaSelecionada
    : opcoesResina[0]?.value || "";

  const opcoesImpressora = useMemo(() => {
    return [...new Set(
      parametros
        .filter((item) => tituloResina(item.resina) === resinaAtual)
        .map((item) => tituloImpressora(item.impressora))
    )].map((item) => ({
      value: item,
      label: item,
    }));
  }, [parametros, resinaAtual]);

  const impressoraAtual = opcoesImpressora.some((item) => item.value === impressoraSelecionada)
    ? impressoraSelecionada
    : opcoesImpressora[0]?.value || "";

  const receitaBase = useMemo(() => {
    return (
      parametros.find(
        (item) =>
          tituloResina(item.resina) === resinaAtual &&
          tituloImpressora(item.impressora) === impressoraAtual
      ) || null
    );
  }, [parametros, resinaAtual, impressoraAtual]);

  function alterarResina(valor) {
    setResinaSelecionada(valor);

    const primeiraImpressora = parametros.find(
      (item) => tituloResina(item.resina) === valor
    );
    const impressora = primeiraImpressora ? tituloImpressora(primeiraImpressora.impressora) : "";
    setImpressoraSelecionada(impressora);
    setLayerIdx(indiceCamadaReceita(primeiraImpressora));
  }

  function alterarImpressora(valor) {
    setImpressoraSelecionada(valor);

    const receita = parametros.find(
      (item) =>
        tituloResina(item.resina) === resinaAtual &&
        tituloImpressora(item.impressora) === valor
    );
    setLayerIdx(indiceCamadaReceita(receita));
  }

  const resultado = useMemo(() => {
    if (!receitaBase) return null;

    const camadaSelecionada = CAMADAS[layerIdx];
    const camadaBase = numero(receitaBase.alturaCamada, 0.05);
    const exposicaoBase = numero(receitaBase.exposicaoNormal, 2.5);
    const baseBottom = numero(receitaBase.exposicaoBase, 25);
    const baseLayers = Math.max(1, Math.round(numero(receitaBase.camadasBase, 5)));
    const tempFactor = TEMPERATURAS.find((item) => item.value === temp)?.fator ?? 1.0;
    const layerFactor = camadaBase > 0 ? camadaSelecionada / camadaBase : 1;

    const exposicaoNormal = Math.max(0.8, exposicaoBase * layerFactor * tempFactor);
    const exposicaoBottom = Math.max(8, baseBottom * tempFactor);

    return {
      exposicaoNormal: exposicaoNormal.toFixed(2),
      exposicaoBottom: exposicaoBottom.toFixed(1),
      camadasBase: baseLayers,
      alturaCamada: camadaSelecionada.toFixed(2),
      referencia: {
        exposicaoNormal: receitaBase.exposicaoNormal || "-",
        exposicaoBase: receitaBase.exposicaoBase || "-",
        camadasBase: receitaBase.camadasBase || "-",
        alturaCamada: receitaBase.alturaCamada || "-",
      },
    };
  }, [receitaBase, layerIdx, temp]);

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <span style={styles.badge}>CALCULADORA</span>
        <h2 style={styles.title}>Calculadora de Exposição</h2>
        <p style={styles.subtitle}>
          Baseada nas resinas e impressoras já cadastradas na Quanton3D.
          Ajuste temperatura e camada para obter uma referência inicial segura.
        </p>
      </div>

      <div style={styles.card}>
        {erro ? <div style={styles.errorBox}>{erro}</div> : null}

        <div style={styles.grid2}>
          <SelectField
            label="Resina Quanton3D"
            value={resinaAtual}
            onChange={alterarResina}
            options={opcoesResina}
            disabled={carregando || !opcoesResina.length}
          />

          <SelectField
            label="Impressora"
            value={impressoraAtual}
            onChange={alterarImpressora}
            options={opcoesImpressora}
            disabled={carregando || !opcoesImpressora.length}
          />
        </div>

        <div style={styles.field}>
          <div style={styles.sliderHeader}>
            <label style={styles.label}>Espessura de camada</label>
            <span style={styles.sliderVal}>{CAMADAS[layerIdx].toFixed(2)} mm</span>
          </div>
          <input
            type="range"
            min={0}
            max={CAMADAS.length - 1}
            step={1}
            value={layerIdx}
            onChange={(e) => setLayerIdx(Number(e.target.value))}
            style={styles.slider}
          />
          <div style={styles.sliderLegend}>
            <span>0.01 mm</span>
            <span>0.10 mm</span>
          </div>
        </div>

        <div style={styles.grid2}>
          <SelectField
            label="Temperatura ambiente"
            value={temp}
            onChange={setTemp}
            options={TEMPERATURAS.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />

          <div style={styles.field}>
            <label style={styles.label}>Receita base cadastrada</label>
            <div style={styles.infoBox}>
              {receitaBase ? (
                <>
                  <strong style={styles.infoMain}>{tituloResina(receitaBase.resina)}</strong>
                  <span style={styles.infoSub}>{tituloImpressora(receitaBase.impressora)}</span>
                </>
              ) : (
                <span style={styles.infoSub}>Selecione uma combinação válida.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {resultado ? (
        <>
          <div style={styles.resultHeader}>
            <span style={styles.badge}>RESULTADOS ESTIMADOS</span>
          </div>

          <div style={styles.metricsGrid}>
            <MetricCard
              label="Exposição normal"
              value={resultado.exposicaoNormal}
              unit="seg / camada"
              highlight
            />
            <MetricCard
              label="Exposição bottom"
              value={resultado.exposicaoBottom}
              unit="seg / camada"
              highlight
            />
            <MetricCard label="Camadas base" value={resultado.camadasBase} unit="camadas" />
            <MetricCard label="Altura de camada" value={resultado.alturaCamada} unit="mm" />
          </div>

          <div style={styles.tipBox}>
            <span style={styles.tipIcon}>💡</span>
            <div>
              Referência real cadastrada para essa combinação:
              {" "}
              normal <strong>{resultado.referencia.exposicaoNormal}</strong>,
              {" "}base <strong>{resultado.referencia.exposicaoBase}</strong>,
              {" "}camadas <strong>{resultado.referencia.camadasBase}</strong>,
              {" "}altura <strong>{resultado.referencia.alturaCamada}</strong>.
            </div>
          </div>
        </>
      ) : (
        <div style={styles.tipBox}>
          <span style={styles.tipIcon}>ℹ️</span>
          <div>Selecione uma resina e uma impressora cadastradas para calcular.</div>
        </div>
      )}
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
    maxWidth: "700px",
    lineHeight: 1.6,
    margin: 0,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.65)",
    fontWeight: 500,
  },
  select: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    color: "#ffffff",
    padding: "10px 12px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    width: "100%",
  },
  sliderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sliderVal: { fontSize: "15px", fontWeight: 700, color: "#00d4ff" },
  slider: { width: "100%", accentColor: "#00d4ff", cursor: "pointer", height: "4px" },
  sliderLegend: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "rgba(255,255,255,0.35)",
  },
  infoBox: {
    minHeight: "46px",
    borderRadius: "8px",
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  infoMain: { color: "#00d4ff", fontSize: "15px" },
  infoSub: { color: "rgba(255,255,255,0.55)", fontSize: "12px" },
  resultHeader: { marginBottom: "12px" },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  metricCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "14px 16px",
  },
  metricHighlight: {
    background: "rgba(0,212,255,0.08)",
    border: "1px solid rgba(0,212,255,0.25)",
  },
  metricLabel: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    margin: "0 0 4px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  metricLabelHL: { color: "rgba(0,212,255,0.7)" },
  metricVal: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 2px",
    lineHeight: 1.1,
  },
  metricValHL: { color: "#00d4ff" },
  metricUnit: { fontSize: "11px", color: "rgba(255,255,255,0.35)" },
  metricSub: { fontSize: "11px", color: "rgba(255,255,255,0.25)", margin: "4px 0 0" },
  tipBox: {
    background: "rgba(255,255,255,0.03)",
    borderLeft: "3px solid rgba(0,212,255,0.5)",
    borderRadius: "0 8px 8px 0",
    padding: "12px 16px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
    marginBottom: "16px",
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    lineHeight: 1.6,
  },
  tipIcon: { fontSize: "16px", flexShrink: 0 },
  errorBox: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    color: "#fecaca",
    padding: "12px 14px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
};
