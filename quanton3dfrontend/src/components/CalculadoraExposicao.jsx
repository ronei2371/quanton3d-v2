import { useEffect, useMemo, useState } from "react";
import api from "../api";

const TEMPERATURAS = [
  { value: "quente", label: "Quente — acima de 28°C", fator: 0.90, dica: "Ambiente quente acelera a cura. Reduza levemente a exposição." },
  { value: "normal", label: "Normal — 20 a 28°C", fator: 1.00, dica: "Temperatura ideal. Use os parâmetros base como referência." },
  { value: "fria", label: "Fria — 15 a 20°C", fator: 1.12, dica: "Ambiente frio desacelera a cura. Aumente levemente a exposição." },
  { value: "muito_fria", label: "Muito fria — abaixo de 15°C", fator: 1.25, dica: "Pré-aqueça a resina (max 40°C) antes de imprimir. Aumento significativo necessário." },
];

const CAMADAS = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10];

function tituloResina(nome = "") { return String(nome || "").trim() || "Sem nome"; }
function tituloImpressora(nome = "") { return String(nome || "").trim() || "Sem impressora"; }
function num(v, fb = 0) { const n = parseFloat(String(v || "").replace(",", ".")); return isFinite(n) ? n : fb; }

export default function CalculadoraExposicao() {
  const [parametros, setParametros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [resina, setResina] = useState("");
  const [impressora, setImpressora] = useState("");
  const [temperatura, setTemperatura] = useState("normal");
  const [camadaIdx, setCamadaIdx] = useState(4); // 0.05mm padrão
  const [modoAvancado, setModoAvancado] = useState(false);

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
        const primeiraResina = tituloResina(lista[0]?.resina);
        setResina(primeiraResina);
        const primeiraImpressora = lista.find(i => tituloResina(i.resina) === primeiraResina)?.impressora || "";
        setImpressora(tituloImpressora(primeiraImpressora));
      } catch (e) {
        if (!ativo) return;
        setErro("Não foi possível carregar os parâmetros da Quanton3D.");
      } finally { if (ativo) setCarregando(false); }
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  const opcoesResina = useMemo(() =>
    [...new Set(parametros.map(i => tituloResina(i.resina)))].map(v => ({ value: v, label: v }))
  , [parametros]);

  const opcoesImpressora = useMemo(() =>
    [...new Set(parametros.filter(i => tituloResina(i.resina) === resina).map(i => tituloImpressora(i.impressora)))].map(v => ({ value: v, label: v }))
  , [parametros, resina]);

  useEffect(() => {
    const valido = opcoesImpressora.some(i => i.value === impressora);
    if (!valido && opcoesImpressora.length) setImpressora(opcoesImpressora[0].value);
  }, [opcoesImpressora]);

  const base = useMemo(() =>
    parametros.find(i => tituloResina(i.resina) === resina && tituloImpressora(i.impressora) === impressora) || null
  , [parametros, resina, impressora]);

  // Sincroniza slider com camada base quando muda combinação
  useEffect(() => {
    if (!base) return;
    const camadaBase = num(base.alturaCamada, 0.05);
    const idx = CAMADAS.findIndex(c => Math.abs(c - camadaBase) < 0.001);
    setCamadaIdx(idx >= 0 ? idx : 4);
  }, [base]);

  const tempObj = TEMPERATURAS.find(t => t.value === temperatura) || TEMPERATURAS[1];
  const camadaSelecionada = CAMADAS[camadaIdx];

  const resultado = useMemo(() => {
    if (!base) return null;

    const camadaBase = num(base.alturaCamada, 0.05);
    const expNormalBase = num(base.exposicaoNormal, 0);
    const expBaseBase = num(base.exposicaoBase, 0);
    const camadasBase = Math.max(1, Math.round(num(base.camadasBase, 5)));

    // Se mesma camada e temperatura normal — retorna o valor exato do banco
    const mesmaCamada = Math.abs(camadaSelecionada - camadaBase) < 0.001;
    const tempNormal = temperatura === "normal";

    const fatorCamada = camadaBase > 0 ? camadaSelecionada / camadaBase : 1;
    const fatorTemp = tempObj.fator;

    const expNormalAjustada = expNormalBase * fatorCamada * fatorTemp;
    const expBaseAjustada = expBaseBase * fatorTemp;

    return {
      // Valores reais do banco
      expNormalBase,
      expBaseBase,
      camadasBase,
      camadaBase,
      // Valores ajustados
      expNormalAjustada: expNormalAjustada.toFixed(2),
      expBaseAjustada: expBaseAjustada.toFixed(1),
      // Flags
      mesmaCamada,
      tempNormal,
      semAjuste: mesmaCamada && tempNormal,
      camadaSelecionada,
      fatorCamada: fatorCamada.toFixed(2),
      fatorTemp: fatorTemp.toFixed(2),
    };
  }, [base, camadaIdx, temperatura]);

  return (
    <section style={S.section}>
      {/* HEADER */}
      <div style={S.header}>
        <span style={S.badge}>PARÂMETROS DE EXPOSIÇÃO</span>
        <h2 style={S.title}>Calculadora de Exposição UV</h2>
        <p style={S.subtitle}>
          Mostra os <strong style={{ color: "#4fd1ff" }}>parâmetros reais testados</strong> para cada resina e impressora cadastrada.
          Ajuste temperatura e camada para estimar variações — mas sempre faça o teste de calibração na sua máquina.
        </p>
      </div>

      {/* AVISO IMPORTANTE */}
      <div style={S.aviso}>
        <span style={{ fontSize: "1.2rem" }}>⚠️</span>
        <div>
          <strong>Exposição não é só altura de camada.</strong> Depende da potência do LED, tipo de tela (mono vs RGB), sensibilidade da resina e temperatura.
          Os valores abaixo são <strong>referências reais</strong> para iniciar — o ajuste fino é sempre feito por calibração na sua máquina.
        </div>
      </div>

      {/* SELEÇÃO */}
      <div style={S.formCard}>
        {erro && <div style={S.errorBox}>{erro}</div>}
        {carregando && <div style={S.loadingBox}>Carregando parâmetros...</div>}

        <div style={S.grid2}>
          <div style={S.field}>
            <label style={S.label}>1. Resina Quanton3D</label>
            <select value={resina} onChange={e => { setResina(e.target.value); }} style={S.select} disabled={carregando}>
              {opcoesResina.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>2. Impressora</label>
            <select value={impressora} onChange={e => setImpressora(e.target.value)} style={S.select} disabled={carregando || !opcoesImpressora.length}>
              {opcoesImpressora.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Modo avançado toggle */}
        <button
          type="button"
          onClick={() => setModoAvancado(v => !v)}
          style={{ ...S.toggleBtn, background: modoAvancado ? "rgba(79,209,255,0.15)" : "rgba(255,255,255,0.05)", borderColor: modoAvancado ? "rgba(79,209,255,0.4)" : "rgba(113,159,219,0.2)" }}>
          {modoAvancado ? "▲ Ocultar ajustes de temperatura e camada" : "▼ Quero ajustar temperatura ou altura de camada"}
        </button>

        {modoAvancado && (
          <div style={{ marginTop: "16px" }}>
            <div style={S.field}>
              <label style={S.label}>Temperatura ambiente</label>
              <select value={temperatura} onChange={e => setTemperatura(e.target.value)} style={S.select}>
                {TEMPERATURAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <span style={S.dica}>{tempObj.dica}</span>
            </div>

            <div style={{ ...S.field, marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label style={S.label}>Altura de camada desejada</label>
                <span style={{ color: "#4fd1ff", fontWeight: 800, fontSize: "1rem" }}>{camadaSelecionada.toFixed(2)} mm</span>
              </div>
              <input
                type="range" min={0} max={CAMADAS.length - 1} step={1}
                value={camadaIdx} onChange={e => setCamadaIdx(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#4fd1ff", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9fb4c7" }}>
                <span>0.01 mm (máx detalhe)</span>
                <span>0.10 mm (mais rápido)</span>
              </div>
              <span style={S.dica}>
                Camada base cadastrada para essa combinação: <strong style={{ color: "#4fd1ff" }}>{base ? num(base.alturaCamada, 0.05).toFixed(2) : "—"} mm</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* RESULTADO */}
      {resultado && base ? (
        <div>
          {/* Parâmetros reais — destaque principal */}
          <div style={S.resultHeader}>
            <span style={S.badge}>
              {resultado.semAjuste ? "✅ PARÂMETROS REAIS TESTADOS E APROVADOS" : "📐 PARÂMETROS AJUSTADOS (ESTIMATIVA)"}
            </span>
          </div>

          {resultado.semAjuste ? (
            <div style={S.infoReal}>
              <span style={{ fontSize: "1.5rem" }}>✅</span>
              <div>
                Mostrando os <strong>parâmetros reais testados</strong> para <strong style={{ color: "#4fd1ff" }}>{resina}</strong> na <strong style={{ color: "#4fd1ff" }}>{impressora}</strong>.
                Esses valores foram validados pela Quanton3D — use como ponto de partida confiável.
              </div>
            </div>
          ) : (
            <div style={S.infoEstimativa}>
              <span style={{ fontSize: "1.5rem" }}>📐</span>
              <div>
                Estimativa calculada a partir do parâmetro base (camada {num(base.alturaCamada, 0.05).toFixed(2)}mm, temperatura normal).
                Fator camada: <strong>{resultado.fatorCamada}×</strong> | Fator temperatura: <strong>{resultado.fatorTemp}×</strong>.
                <strong> Sempre faça um teste de calibração antes de imprimir o job completo.</strong>
              </div>
            </div>
          )}

          {/* Cards de resultado */}
          <div style={S.cardsGrid}>
            <div style={{ ...S.resultCard, ...S.resultCardHL }}>
              <p style={S.cardLabel}>⚡ Exposição Normal</p>
              <p style={S.cardValHL}>{resultado.semAjuste ? resultado.expNormalBase : resultado.expNormalAjustada}</p>
              <span style={S.cardUnit}>segundos / camada</span>
              {!resultado.semAjuste && <p style={S.cardRef}>Base real: {resultado.expNormalBase}s</p>}
            </div>

            <div style={{ ...S.resultCard, ...S.resultCardHL }}>
              <p style={S.cardLabel}>🔆 Exposição Base (Bottom)</p>
              <p style={S.cardValHL}>{resultado.semAjuste ? resultado.expBaseBase : resultado.expBaseAjustada}</p>
              <span style={S.cardUnit}>segundos / primeiras camadas</span>
              {!resultado.semAjuste && <p style={S.cardRef}>Base real: {resultado.expBaseBase}s</p>}
            </div>

            <div style={S.resultCard}>
              <p style={S.cardLabel}>📏 Altura de camada</p>
              <p style={S.cardVal}>{resultado.camadaSelecionada.toFixed(2)}</p>
              <span style={S.cardUnit}>mm</span>
            </div>

            <div style={S.resultCard}>
              <p style={S.cardLabel}>🔢 Camadas base</p>
              <p style={S.cardVal}>{resultado.camadasBase}</p>
              <span style={S.cardUnit}>camadas iniciais</span>
            </div>
          </div>

          {/* Referência completa do banco */}
          <div style={S.refBox}>
            <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#4fd1ff", fontSize: "0.85rem" }}>
              📋 PARÂMETROS COMPLETOS CADASTRADOS — {resina} + {impressora}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
              {[
                { label: "Exposição normal", value: base.exposicaoNormal || "-" },
                { label: "Exposição base", value: base.exposicaoBase || "-" },
                { label: "Camadas base", value: base.camadasBase || "-" },
                { label: "Altura camada", value: base.alturaCamada || "-" },
                { label: "Retardo UV", value: base.retardoUV || base.retardoDesligarUV || "-" },
                { label: "Potência UV", value: base.potenciaUV || "-" },
                { label: "Vel. elevação", value: base.velElevacao || "-" },
                { label: "Vel. retração", value: base.velRetracao || "-" },
              ].map(({ label, value }) => value !== "-" ? (
                <div key={label} style={S.refItem}>
                  <span style={{ fontSize: "0.72rem", color: "#9fb4c7", display: "block" }}>{label}</span>
                  <strong style={{ color: "#eaf3ff", fontSize: "0.9rem" }}>{value}</strong>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Guia de calibração */}
          <div style={S.guiaBox}>
            <p style={{ margin: "0 0 10px", fontWeight: 800, color: "#ffd166", fontSize: "0.85rem" }}>💡 COMO CALIBRAR NA SUA MÁQUINA</p>
            <ol style={{ margin: 0, paddingLeft: "18px", color: "#d3e4f8", fontSize: "0.85rem", lineHeight: 1.8 }}>
              <li>Use os parâmetros acima como ponto de partida</li>
              <li>Imprima o <strong>Gabarito Quanton3D</strong> (disponível nos guias do site)</li>
              <li>Se a peça não adere: aumente a exposição base em 5s por vez</li>
              <li>Se a peça adere demais à plataforma: reduza a exposição base em 3s</li>
              <li>Se suporte difícil de remover: reduza exposição normal em 0,2s</li>
              <li>Temperatura abaixo de 20°C: ative o ajuste de temperatura acima</li>
            </ol>
          </div>
        </div>
      ) : !carregando && !erro ? (
        <div style={S.emptyBox}>
          <span style={{ fontSize: "2rem" }}>🔍</span>
          <p>Selecione uma resina e impressora para ver os parâmetros.</p>
        </div>
      ) : null}
    </section>
  );
}

const S = {
  section: { background: "transparent", color: "#eaf3ff", padding: "1.5rem 0", fontFamily: "'Inter', sans-serif" },
  header: { marginBottom: "16px" },
  badge: { display: "inline-block", fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", color: "#4fd1ff", marginBottom: "8px" },
  title: { fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, margin: "0 0 10px", color: "#ffffff", lineHeight: 1.2 },
  subtitle: { fontSize: "14px", color: "#b8cfe8", maxWidth: "680px", lineHeight: 1.6, margin: 0 },
  aviso: { display: "flex", gap: "12px", alignItems: "flex-start", background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.25)", borderRadius: "14px", padding: "14px 16px", color: "#ffd166", fontSize: "13px", lineHeight: 1.6, marginBottom: "18px" },
  formCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(113,159,219,0.2)", borderRadius: "16px", padding: "20px", marginBottom: "20px" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: 700, color: "#ccdaec" },
  select: { width: "100%", height: "44px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.25)", background: "rgba(4,12,24,0.7)", color: "#ffffff", padding: "0 12px", outline: "none", fontSize: "14px" },
  dica: { fontSize: "12px", color: "#b8cfe8", lineHeight: 1.5 },
  toggleBtn: { width: "100%", padding: "10px 16px", borderRadius: "10px", border: "1px solid", color: "#9fb4c7", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, fontFamily: "inherit", textAlign: "left" },
  errorBox: { background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", color: "#ffd4dd", padding: "10px 14px", borderRadius: "10px", marginBottom: "14px" },
  loadingBox: { color: "#9fb4c7", padding: "10px 0", fontSize: "14px" },
  resultHeader: { marginBottom: "10px" },
  infoReal: { display: "flex", gap: "12px", alignItems: "flex-start", background: "rgba(73,230,139,0.08)", border: "1px solid rgba(73,230,139,0.25)", borderRadius: "14px", padding: "14px 16px", color: "#a8e6c0", fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" },
  infoEstimativa: { display: "flex", gap: "12px", alignItems: "flex-start", background: "rgba(79,209,255,0.07)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "14px", padding: "14px 16px", color: "#a8c4e8", fontSize: "13px", lineHeight: 1.6, marginBottom: "16px" },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", marginBottom: "18px" },
  resultCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(113,159,219,0.18)", borderRadius: "14px", padding: "16px" },
  resultCardHL: { background: "rgba(79,209,255,0.09)", border: "1px solid rgba(79,209,255,0.32)" },
  cardLabel: { fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em", color: "#b8cfe8", margin: "0 0 8px" },
  cardVal: { fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#ffffff", margin: "0 0 3px", lineHeight: 1 },
  cardValHL: { fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#4fd1ff", margin: "0 0 3px", lineHeight: 1 },
  cardUnit: { fontSize: "12px", color: "#b8cfe8" },
  cardRef: { fontSize: "11px", color: "#9fb4c7", margin: "8px 0 0", borderTop: "1px solid rgba(113,159,219,0.15)", paddingTop: "6px" },
  refBox: { background: "rgba(26,115,232,0.08)", border: "1px solid rgba(26,115,232,0.22)", borderRadius: "14px", padding: "16px", marginBottom: "16px" },
  refItem: { background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 10px" },
  guiaBox: { background: "rgba(255,209,102,0.06)", border: "1px solid rgba(255,209,102,0.18)", borderRadius: "14px", padding: "16px" },
  emptyBox: { textAlign: "center", padding: "32px", color: "#9fb4c7" },
};
