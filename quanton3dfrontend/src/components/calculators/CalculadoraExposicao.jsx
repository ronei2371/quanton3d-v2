import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Compass, Ruler, ClipboardList, Lightbulb, Search, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../lib/api";

const TEMPERATURAS = [
{ value: "quente", label: "Quente — acima de 28°C", fator: 0.90, dica: "Ambiente quente acelera a cura. Reduza levemente a exposicao." },
{ value: "normal", label: "Normal — 20 a 28°C", fator: 1.00, dica: "Temperatura ideal. Use os parametros base como referencia." },
{ value: "fria", label: "Fria — 15 a 20°C", fator: 1.12, dica: "Ambiente frio desacelera a cura. Aumente levemente a exposicao." },
{ value: "muito_fria", label: "Muito fria — abaixo de 15°C", fator: 1.25, dica: "Pre-aqueca a resina (max 40°C) antes de imprimir. Aumento significativo necessario." },
];

const CAMADAS = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10];

function tituloResina(nome = "") { return String(nome || "").trim() || "Sem nome"; }
function tituloImpressora(nome = "") { return String(nome || "").trim() || "Sem impressora"; }
function displayNome(nome = "") {
  const s = String(nome || "").trim();
  if (!s) return "—";
  return s.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}
function num(v, fb = 0) { const n = parseFloat(String(v || "").replace(",", ".")); return isFinite(n) ? n : fb; }

export default function CalculadoraExposicao({ onIrParametros }) {
const [parametros, setParametros] = useState([]);
const [carregando, setCarregando] = useState(true);
const [erro, setErro] = useState("");
const [resina, setResina] = useState("");
const [impressora, setImpressora] = useState("");
const [temperatura, setTemperatura] = useState("normal");
const [camadaIdx, setCamadaIdx] = useState(4);
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
} catch {
if (!ativo) return;
setErro("Nao foi possivel carregar os parametros da Quanton3D.");
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
const mesmaCamada = Math.abs(camadaSelecionada - camadaBase) < 0.001;
const tempNormal = temperatura === "normal";
const fatorCamada = camadaBase > 0 ? camadaSelecionada / camadaBase : 1;
const fatorTemp = tempObj.fator;
const expNormalAjustada = expNormalBase * fatorCamada * fatorTemp;
const expBaseAjustada = expBaseBase * fatorTemp;
return {
expNormalBase, expBaseBase, camadasBase, camadaBase,
expNormalAjustada: expNormalAjustada.toFixed(2),
expBaseAjustada: expBaseAjustada.toFixed(1),
mesmaCamada, tempNormal,
semAjuste: mesmaCamada && tempNormal,
camadaSelecionada,
fatorCamada: fatorCamada.toFixed(2),
fatorTemp: fatorTemp.toFixed(2),
};
}, [base, camadaIdx, temperatura]);

return (
<section className="calc-section">
<div className="calc-header">
<span className="calc-badge"><Compass size={12} /> Parametros de exposicao</span>
<h2 className="calc-title">Calculadora de Exposicao UV</h2>
<p className="calc-subtitle">
Mostra os <strong style={{ color: "var(--primary)" }}>parametros reais testados</strong> para cada resina e impressora cadastrada.
Ajuste temperatura e camada para estimar variacoes — mas sempre faca o teste de calibracao na sua maquina.
{onIrParametros && (
<>
{" "}Quer a configuracao base completa da sua combinacao?{" "}
<button type="button" onClick={onIrParametros} style={{ padding: 0, border: 0, background: "transparent", color: "var(--primary)", fontWeight: 700, fontSize: "inherit", cursor: "pointer" }}>
Veja a secao Parametros →
</button>
</>
)}
</p>
</div>
<div className="q-alert q-alert--warning" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
<AlertTriangle size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
<div>
<strong>Exposicao nao e so altura de camada.</strong> Depende da potencia do LED, tipo de tela (mono vs RGB), sensibilidade da resina e temperatura.
Os valores abaixo sao <strong>referencias reais</strong> para iniciar — o ajuste fino e sempre feito por calibracao na sua maquina.
</div>
</div>
<div className="calc-form-card">
{erro && <div className="q-alert q-alert--error">{erro}</div>}
{carregando && <div className="calc-hint" style={{ marginBottom: "10px" }}>Carregando parametros...</div>}
<div className="calc-grid-2">
<div className="calc-field">
<label className="calc-label">1. Resina Quanton3D</label>
<select className="calc-select" value={resina} onChange={e => { setResina(e.target.value); }} disabled={carregando}>
{opcoesResina.map(o => <option key={o.value} value={o.value}>{displayNome(o.label)}</option>)}
</select>
</div>
<div className="calc-field">
<label className="calc-label">2. Impressora</label>
<select className="calc-select" value={impressora} onChange={e => setImpressora(e.target.value)} disabled={carregando || !opcoesImpressora.length}>
{opcoesImpressora.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
</select>
</div>
</div>
<button type="button" className="q-btn q-btn--ghost q-btn--block" onClick={() => setModoAvancado(v => !v)}>
{modoAvancado ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
{modoAvancado ? "Ocultar ajustes de temperatura e camada" : "Quero ajustar temperatura ou altura de camada"}
</button>
{modoAvancado && (
<div style={{ marginTop: "16px" }}>
<div className="calc-field">
<label className="calc-label">Temperatura ambiente</label>
<select className="calc-select" value={temperatura} onChange={e => setTemperatura(e.target.value)}>
{TEMPERATURAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
</select>
<span className="calc-hint">{tempObj.dica}</span>
</div>
<div className="calc-field" style={{ marginTop: "14px" }}>
<div style={{ display: "flex", justifyContent: "space-between" }}>
<label className="calc-label">Altura de camada desejada</label>
<span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "1rem" }}>{camadaSelecionada.toFixed(2)} mm</span>
</div>
<input type="range" min={0} max={CAMADAS.length - 1} step={1} value={camadaIdx} onChange={e => setCamadaIdx(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }} />
<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-muted)" }}>
<span>0.01 mm (max detalhe)</span><span>0.10 mm (mais rapido)</span>
</div>
<span className="calc-hint">Camada base cadastrada para essa combinacao: <strong style={{ color: "var(--primary)" }}>{base ? num(base.alturaCamada, 0.05).toFixed(2) : "—"} mm</strong></span>
</div>
</div>
)}
</div>
{resultado && base ? (
<div>
<div style={{ marginBottom: "10px" }}>
<span className="calc-badge" style={{ color: resultado.semAjuste ? "var(--q-verde)" : "var(--primary-strong)" }}>
{resultado.semAjuste ? <CheckCircle2 size={13} /> : <Ruler size={13} />}
{resultado.semAjuste ? "Parametros reais testados e aprovados" : "Parametros ajustados (estimativa)"}
</span>
</div>
{resultado.semAjuste ? (
<div className="q-alert q-alert--success" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
<CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
<div>Mostrando os <strong>parametros reais testados</strong> para <strong style={{ color: "var(--primary)" }}>{displayNome(resina)}</strong> na <strong style={{ color: "var(--primary)" }}>{impressora}</strong>. Esses valores foram validados pela Quanton3D — use como ponto de partida confiavel.</div>
</div>
) : (
<div className="q-alert q-alert--info" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
<Ruler size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
<div>Estimativa calculada a partir do parametro base (camada {num(base.alturaCamada, 0.05).toFixed(2)}mm, temperatura normal). Fator camada: <strong>{resultado.fatorCamada}x</strong> | Fator temperatura: <strong>{resultado.fatorTemp}x</strong>.<strong> Sempre faca um teste de calibracao antes de imprimir o job completo.</strong></div>
</div>
)}
<div className="calc-metrics-grid">
<div className="calc-metric-card is-highlight">
<p className="calc-metric-label">Exposicao Normal</p>
<p className="calc-metric-value">{resultado.semAjuste ? resultado.expNormalBase : resultado.expNormalAjustada}</p>
<span className="calc-metric-unit">segundos / camada</span>
{!resultado.semAjuste && <p className="calc-hint" style={{ marginTop: "6px", borderTop: "1px solid var(--border-soft)", paddingTop: "6px" }}>Base real: {resultado.expNormalBase}s</p>}
</div>
<div className="calc-metric-card is-highlight">
<p className="calc-metric-label">Exposicao Base (Bottom)</p>
<p className="calc-metric-value">{resultado.semAjuste ? resultado.expBaseBase : resultado.expBaseAjustada}</p>
<span className="calc-metric-unit">segundos / primeiras camadas</span>
{!resultado.semAjuste && <p className="calc-hint" style={{ marginTop: "6px", borderTop: "1px solid var(--border-soft)", paddingTop: "6px" }}>Base real: {resultado.expBaseBase}s</p>}
</div>
<div className="calc-metric-card">
<p className="calc-metric-label">Altura de camada</p>
<p className="calc-metric-value">{resultado.camadaSelecionada.toFixed(2)}</p>
<span className="calc-metric-unit">mm</span>
</div>
<div className="calc-metric-card">
<p className="calc-metric-label">Camadas base</p>
<p className="calc-metric-value">{resultado.camadasBase}</p>
<span className="calc-metric-unit">camadas iniciais</span>
</div>
</div>
<div className="calc-guide-card">
<p className="calc-guide-card-title"><ClipboardList size={15} /> Parametros completos cadastrados — {displayNome(resina)} + {impressora}</p>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
{[
{ label: "Exposicao normal", value: base.exposicaoNormal || "-" },
{ label: "Exposicao base", value: base.exposicaoBase || "-" },
{ label: "Camadas base", value: base.camadasBase || "-" },
{ label: "Altura camada", value: base.alturaCamada || "-" },
{ label: "Retardo UV", value: base.lightOffDelay || "-" },
{ label: "Lift Distance", value: base.liftDistance || "-" },
{ label: "Vel. elevacao", value: base.liftSpeed || "-" },
{ label: "Vel. retracao", value: base.retractSpeed || "-" },
].map(({ label, value }) => value !== "-" ? (
<div key={label} style={{ background: "var(--bg-void)", borderRadius: "var(--r-sm)", padding: "8px 10px" }}>
<span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>{label}</span>
<strong style={{ color: "var(--text-primary)", fontSize: "0.88rem" }}>{value}</strong>
</div>
) : null)}
</div>
</div>
<div className="calc-guide-card">
<p className="calc-guide-card-title" style={{ color: "var(--q-laranja)" }}><Lightbulb size={15} /> Como calibrar na sua maquina</p>
<ol style={{ margin: 0, paddingLeft: "18px", color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.8 }}>
<li>Use os parametros acima como ponto de partida</li>
<li>Imprima o <strong>Gabarito Quanton3D</strong> (disponivel nos guias do site)</li>
<li>Se a peca nao adere: aumente a exposicao base em 5s por vez</li>
<li>Se a peca adere demais a plataforma: reduza a exposicao base em 3s</li>
<li>Se suporte dificil de remover: reduza exposicao normal em 0,2s</li>
<li>Temperatura abaixo de 20°C: ative o ajuste de temperatura acima</li>
</ol>
</div>
</div>
) : !carregando && !erro ? (
<div className="q-empty">
<Search size={28} style={{ marginBottom: "8px", opacity: 0.6 }} />
<p>Selecione uma resina e impressora para ver os parametros.</p>
</div>
) : null}
</section>
);
}
