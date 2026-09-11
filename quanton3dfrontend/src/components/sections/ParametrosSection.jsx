import { useEffect, useState } from "react";
import { trackViewProfile, trackCopyProfile } from "../../utils/analytics";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "../../lib/api";

function limparTexto(valor) { return String(valor || "").trim(); }
function toTitleCase(str) {
return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}
function corrigirNomeResina(nome) {
const limpo = limparTexto(nome);
if (!limpo) return limpo;
const corrigido = limpo
.replace(/^FERRO\s*70\/30\b/i, "70/30")
.replace(/^IRON\s*70\/30\b/i, "70/30")
.replace(/^FERRO\s*7030\b/i, "Iron 7030")
.replace(/^FERRO\b/i, "IRON")
.replace(/^Iron\b/i, "IRON")
.replace(/^iron\b/i, "IRON");
return toTitleCase(corrigido);
}
function chaveResina(nome) { return corrigirNomeResina(nome).toUpperCase(); }

const METODO_LABELS = {
"teste-fisico": "Validado em teste fisico",
"calculado": "Parametros calculados",
"fornecedor": "Dados do fornecedor",
};

function ParamItem({ label, value }) {
return (
<div style={{ padding: "12px 14px", borderRadius: "var(--r-sm)", background: "rgba(0,146,255,0.05)", border: "1px solid var(--border-soft)" }}>
<span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</span>
<strong style={{ color: "var(--text-primary)", fontSize: "1rem" }}>{value || "-"}</strong>
</div>
);
}

function ParametrosSection({ onAbrirExposicao }) {
const [parametros, setParametros] = useState([]);
const [todasImpressoras, setTodasImpressoras] = useState([]);
const [fotosImpressoras, setFotosImpressoras] = useState(new Map());
const [carregando, setCarregando] = useState(true);
const [erro, setErro] = useState("");
const [resinaSelecionada, setResinaSelecionada] = useState("");
const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
const [buscaImpressora, setBuscaImpressora] = useState("");
const [resultado, setResultado] = useState(null);
const [semParametros, setSemParametros] = useState(false);
const [copiado, setCopiado] = useState(false);

async function carregarParametros() {
try {
setCarregando(true); setErro("");
const [resParametros, resImpressoras] = await Promise.all([
api.get("/parametros"),
api.get("/parametros/impressoras"),
]);
const lista = resParametros.data?.data || resParametros.data?.parametros || [];
setParametros(lista.map((item) => ({
...item,
resina: corrigirNomeResina(item.resina),
impressora: limparTexto(item.impressora),
marca: limparTexto(item.marca),
})));
const nomes = resImpressoras.data?.data || resImpressoras.data?.impressoras || [];
setTodasImpressoras(nomes.map(limparTexto).filter(Boolean).sort((a, b) => a.localeCompare(b)));
try {
const resFotos = await api.get("/parametros/impressoras-com-foto");
const rawList = resFotos.data?.data || [];
if (rawList.length > 0 && typeof rawList[0] === 'object') {
const mapa = new Map(rawList.map(i => [i.nome.trim().toLowerCase(), i.fotoImpressora || '']));
setFotosImpressoras(mapa);
}
} catch { }
} catch (err) {
console.error("Erro ao carregar parametros:", err);
setErro("Nao foi possivel carregar os parametros tecnicos.");
} finally { setCarregando(false); }
}

useEffect(() => { const t = setTimeout(carregarParametros, 0); return () => clearTimeout(t); }, []);

const RESINAS_OCULTAR = ["ATHOM CASTABLE", "ATHOM CASTABLE 2"];
const resinas = Array.from(new Set(parametros.map((item) => corrigirNomeResina(item.resina)).filter(Boolean)))
.filter(r => !RESINAS_OCULTAR.includes(r.toUpperCase()))
.sort((a, b) => a.localeCompare(b));

const impressoras = buscaImpressora && !impressoraSelecionada
? todasImpressoras.filter(i => i.toLowerCase().includes(buscaImpressora.toLowerCase()))
: todasImpressoras;

function selecionarResina(nome) { setResinaSelecionada(nome); setImpressoraSelecionada(""); setBuscaImpressora(""); setResultado(null); setSemParametros(false); }
function selecionarImpressora(valor) {
setImpressoraSelecionada(valor);
setBuscaImpressora(valor);
if (!valor) { setResultado(null); setSemParametros(false); return; }
const nomeModelo = valor.includes(" - ") ? valor.split(" - ").slice(1).join(" - ") : valor;
const marcaModelo = valor.includes(" - ") ? valor.split(" - ")[0] : "";
const p = parametros.find((item) =>
chaveResina(item.resina) === chaveResina(resinaSelecionada) &&
limparTexto(item.impressora).toLowerCase() === nomeModelo.toLowerCase() &&
(!marcaModelo || limparTexto(item.marca).toLowerCase() === marcaModelo.toLowerCase())
);
if (p) { setResultado(p); setSemParametros(false); trackViewProfile({ resin_name: p.resina, printer_name: p.impressora }); }
else { setResultado(null); setSemParametros(true); }
}

function getFotoImpressora(nomeImpressora) {
if (!nomeImpressora) return '';
const chave = nomeImpressora.trim().toLowerCase();
if (fotosImpressoras.has(chave)) return fotosImpressoras.get(chave);
for (const [catalogNome, foto] of fotosImpressoras) {
if (catalogNome.endsWith(chave) || catalogNome.includes(chave)) return foto;
}
return '';
}

const perfilChituboxTeste = chaveResina(resultado?.resina) === "SPIN+"
&& limparTexto(resultado?.impressora).toUpperCase() === "SATURN 3 ULTRA";
const codigoChitubox = limparTexto(resultado?.codigoChitubox);

async function copiarCodigoChitubox() {
if (!codigoChitubox) return;
await navigator.clipboard.writeText(codigoChitubox);
trackCopyProfile({ resin_name: resultado?.resina, printer_name: resultado?.impressora });
setCopiado(true);
setTimeout(() => setCopiado(false), 2500);
}

return (
<section className="q-card q-panel">
<div className="q-section-head">
<span className="q-eyebrow">Consulta rapida</span>
</div>
<h2 className="q-section-title">Parametros de impressao</h2>
<p className="q-section-desc">
Selecione sua resina e impressora para ver a configuracao inicial recomendada pela Quanton3D.
{" "}Quer entender o que cada parametro faz? <a href="/guias/secao-parametros-detalhados.html" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Veja a referencia completa</a>
</p>

<div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
{carregando && <span className="q-badge">Carregando...</span>}
<button type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={carregarParametros}>Atualizar</button>
</div>
{erro && <div className="q-alert q-alert--error">{erro}</div>}

<div className="q-form-grid" style={{ marginBottom: "20px" }}>
<label className="q-field">
<span>1. Selecione a Resina</span>
<select className="q-select" value={resinaSelecionada} onChange={(e) => selecionarResina(e.target.value)} disabled={carregando}>
<option value="">Selecione a resina</option>
{resinas.map((r) => <option key={r} value={r}>{r}</option>)}
</select>
</label>
<div className="q-field">
<span>2. Selecione a Impressora</span>
<input
type="text"
className="q-select"
placeholder="Filtrar impressora..."
value={buscaImpressora}
disabled={!resinaSelecionada}
onChange={(e) => { setBuscaImpressora(e.target.value); setImpressoraSelecionada(""); setResultado(null); setSemParametros(false); }}
style={{ marginBottom: "6px" }}
/>
<select className="q-select" value={impressoraSelecionada} onChange={(e) => selecionarImpressora(e.target.value)} disabled={!resinaSelecionada || impressoras.length === 0}>
<option value="">{resinaSelecionada ? "Selecione a impressora" : "Escolha uma resina primeiro"}</option>
{impressoras.map((i) => <option key={i} value={i}>{i}</option>)}
</select>
</div>
</div>

{!resultado && !semParametros && (
<div className="q-empty">
<h3>Selecione resina e impressora</h3>
<p>A configuracao inicial recomendada aparecera aqui automaticamente.</p>
</div>
)}

{semParametros && (
<div className="q-empty" style={{ borderColor: "rgba(255,165,0,0.3)", background: "rgba(255,165,0,0.05)" }}>
{(() => { const foto = getFotoImpressora(impressoraSelecionada); return foto ? <img src={foto} alt={impressoraSelecionada} onError={e => e.target.style.display='none'} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', marginBottom: '10px' }} /> : null; })()}
<AlertTriangle size={28} style={{ color: "orange", marginBottom: 8 }} />
<h3 style={{ color: "var(--text-primary)" }}>Parametros ainda nao disponiveis</h3>
<p>
Ainda nao temos parametros validados para <strong>{impressoraSelecionada}</strong> com a resina <strong>{resinaSelecionada}</strong>.
</p>
</div>
)}

{resultado && (
<div style={{ background: "rgba(0,146,255,0.04)", border: "1px solid var(--border-soft)", borderRadius: "var(--r-md)", padding: "20px" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
{(() => { const foto = resultado.fotoImpressora || getFotoImpressora(resultado.impressora); return foto ? <img src={foto} alt={resultado.impressora} onError={e => e.target.style.display='none'} style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', flexShrink: 0 }} /> : null; })()}
<h3 style={{ fontSize: "1.05rem" }}>{corrigirNomeResina(resultado.resina)} + {resultado.marca} {resultado.impressora}</h3>
</div>
{perfilChituboxTeste && (
<button type="button" className={"q-btn q-btn--sm " + (copiado ? "q-btn--success" : "q-btn--primary")} onClick={copiarCodigoChitubox} disabled={!codigoChitubox}>
{copiado ? <><CheckCircle2 size={13} /> Codigo copiado!</> : "Copiar Codigo CHITUBOX"}
</button>
)}
</div>

<span className={"q-badge " + (resultado.confianca === "estimado" ? "q-badge--warning" : "q-badge--success")} style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
{resultado.confianca === "estimado" ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
{resultado.confianca === "estimado" ? "Estimativa inicial" : "Testado pela Quanton3D"}
</span>
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", fontSize: "0.71rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
{resultado.updatedAt && (
<span>Atualizado: {new Date(resultado.updatedAt).toLocaleDateString("pt-BR")}</span>
)}
{resultado.versao && (
<span>&#xB7; v{resultado.versao}</span>
)}
{resultado.metodoValidacao && (
<span>&#xB7; {METODO_LABELS[resultado.metodoValidacao] || resultado.metodoValidacao}</span>
)}
</div>

<div className="q-grid" style={{ marginTop: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
<ParamItem label="Altura de Camada" value={resultado.alturaCamada} />
<ParamItem label="Tempo de Exposicao" value={resultado.exposicaoNormal} />
<ParamItem label="Exposicao Base" value={resultado.exposicaoBase} />
<ParamItem label="Camadas de Base" value={resultado.camadasBase} />
</div>

<p style={{ margin: "16px 0 0", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
Essa e uma configuracao inicial recomendada. Pequenos ajustes podem ser necessarios conforme temperatura ambiente, manutencao da impressora e estado do FEP.
{onAbrirExposicao && (
<>
{" "}Ambiente fora de 20-25 C?{" "}
<button type="button" onClick={onAbrirExposicao} style={{ padding: 0, border: 0, background: "transparent", color: "var(--primary)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
Ajuste a exposicao na calculadora
</button>
</>
)}
</p>
</div>
)}
</section>
);
}

export default ParametrosSection;
