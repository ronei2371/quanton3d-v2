import { useEffect, useMemo, useState } from "react";
import { Users, Camera, MapPin, AtSign, Globe, Briefcase, X, MessageCircle, Upload, ShieldCheck, Megaphone, SlidersHorizontal, Plus, Play } from "lucide-react";
import api from "../../lib/api";
import CarrosselComunidade from "./CarrosselComunidade";
import AvisoFotoPrivacidade from "../AvisoFotoPrivacidade";
import { comprimirImagem } from "../../utils/comprimirImagem";
import PedirCadastro from "../PedirCadastro";

const RESINAS_QUANTON = [
  "ALCHEMIST", "IRON", "IRON 70/30", "FLEXFORM", "POSEIDON",
  "PYROBLAST", "VULCAN CAST", "SPIN", "SPARK", "LOW SMELL", "VELVET SKIN",
  "ATHOM DENTAL", "ATHOM ALINHADORES", "ATHOM WASHABLE",
];

// Nome usado na pagina de Parametros quando e diferente do nome da galeria
const NOME_NOS_PARAMETROS = { SPIN: "SPIN+", "LOW SMELL": "LOWSMELL", "IRON 70/30": "70/30" };

// Usada so se a lista completa (a mesma da pagina de Parametros) nao carregar
const IMPRESSORAS_RESERVA = [
  "Anycubic Photon Mono", "Anycubic Photon Mono X", "Anycubic Photon Mono X 6K",
  "Anycubic Photon M3", "Anycubic Photon M3 Max", "Anycubic Photon M3 Plus",
  "Anycubic Photon M5", "Anycubic Photon M5s", "Anycubic Photon M7",
  "Elegoo Mars 2", "Elegoo Mars 3", "Elegoo Mars 4", "Elegoo Mars 4 Ultra",
  "Elegoo Saturn", "Elegoo Saturn 2", "Elegoo Saturn 3 Ultra", "Elegoo Saturn 4 Ultra",
  "Elegoo Jupiter", "Elegoo Jupiter SE",
  "Creality Halot One", "Creality Halot Mage", "Creality Halot Mage Pro",
  "Phrozen Sonic Mini 8K", "Phrozen Sonic Mighty 8K",
];

const CAMPOS_CONFIGURACAO_GALERIA = [
  { name: "alturaCamada", label: "Altura camada", placeholder: "Ex.: 0,050 mm" },
  { name: "camadasBase", label: "Camadas de base", placeholder: "Ex.: 4" },
  { name: "exposicaoNormal", label: "Tempo exposição", placeholder: "Ex.: 2,100 s" },
  { name: "exposicaoBase", label: "Tempo exposição base", placeholder: "Ex.: 37,000 s" },
  { name: "contagemTransicao", label: "Contagem de transição", placeholder: "Ex.: 0" },
  { name: "tipoTransicao", label: "Tipo de transição", placeholder: "Ex.: Linear" },
  { name: "retardoDesligarUV", label: "Retardo desligar UV", placeholder: "Ex.: 2,000 s" },
  { name: "distElevacaoInferior", label: "Dist. elevação inferior", placeholder: "Ex.: 11,000 mm" },
  { name: "distElevacao", label: "Distância elevação", placeholder: "Ex.: 11,000 mm" },
  { name: "distRetracao", label: "Distância de retração", placeholder: "Ex.: 11,000 mm" },
  { name: "velElevacaoInferior", label: "Vel. elevação inferior", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velElevacao", label: "Vel. elevação", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velRetracaoInferior", label: "Vel. retração inferior", placeholder: "Ex.: 135,000 mm/min" },
  { name: "velRetracao", label: "Vel. retração", placeholder: "Ex.: 135,000 mm/min" },
];

function criarConfiguracaoVazia() {
  return CAMPOS_CONFIGURACAO_GALERIA.reduce((acc, campo) => { acc[campo.name] = ""; return acc; }, {});
}

function formularioVazio() {
  return { resina: "", impressora: "", observacao: "", parametros: criarConfiguracaoVazia(), redes: { instagram: "", tiktok: "", facebook: "", youtube: "" }, autorizaDivulgacao: false };
}

function pareceLink(texto) {
  if (!texto) return false;
  const t = texto.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return true;
  return /\.[a-zA-Z]{2,}/.test(t) && !t.includes(" ");
}
function montarLink(texto) {
  const t = texto.trim();
  return t.startsWith("http") ? t : `https://${t}`;
}

function linkParametroOficial(resina) {
  const nome = String(resina || "").trim().toUpperCase();
  if (!RESINAS_QUANTON.includes(nome)) return "";
  return `/parametros?resina=${encodeURIComponent(NOME_NOS_PARAMETROS[nome] || nome)}`;
}

// Credito do autor da peca (so vem da API quando ele autorizou a divulgacao)
function linkRede(rede, valor) {
  const v = String(valor || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  if (rede === "tiktok") return `https://www.tiktok.com/@${handle}`;
  if (rede === "instagram") return `https://instagram.com/${handle}`;
  return "";
}
function nomeRede(valor) {
  const v = String(valor || "").trim();
  const m = v.match(/(?:tiktok\.com|instagram\.com)\/@?([^/?#]+)/i);
  return m ? `@${m[1]}` : (v.startsWith("@") ? v : `@${v}`);
}

function CreditoAutor({ item }) {
  const redes = item.redesSociais || {};
  const tiktok = linkRede("tiktok", redes.tiktok);
  const instagram = linkRede("instagram", redes.instagram);
  if (!item.autor && !tiktok && !instagram) return null;
  const videoTiktok = /\/video\//.test(tiktok);
  return (
    <div className="comunidade-credito">
      <span>Peça de <strong>{item.autor || nomeRede(redes.tiktok || redes.instagram)}</strong></span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {tiktok && <a href={tiktok} target="_blank" rel="noreferrer"><Play size={13} /> {videoTiktok ? "Ver o vídeo no TikTok" : `TikTok ${nomeRede(redes.tiktok)}`}</a>}
        {instagram && <a href={instagram} target="_blank" rel="noreferrer"><AtSign size={13} /> Instagram</a>}
      </div>
    </div>
  );
}

function PassosComoFunciona({ passos }) {
  return (
    <ol className="comunidade-passos">
      {passos.map(({ icon: Icon, titulo, texto }, i) => (
        <li key={titulo}>
          <span className="comunidade-passo-num" aria-hidden="true">{i + 1}</span>
          <div>
            <strong><Icon size={15} /> {titulo}</strong>
            <p>{texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const PASSOS_GALERIA = [
  { icon: Upload, titulo: "Envie sua peça", texto: "Uma foto, a resina e a impressora. Os parâmetros são opcionais." },
  { icon: ShieldCheck, titulo: "A Quanton3D confere", texto: "Cada envio é revisado antes de aparecer aqui." },
  { icon: Megaphone, titulo: "Sua peça aparece", texto: "Fica na galeria e, se você autorizar, pode ir para o Instagram oficial com o seu crédito." },
];

const PASSOS_PROFISSIONAIS = [
  { icon: Briefcase, titulo: "Cadastre seu trabalho", texto: "Impressão sob encomenda, pintura, modelagem, cursos ou projetos." },
  { icon: ShieldCheck, titulo: "A Quanton3D confere", texto: "O cadastro é revisado antes de ser publicado." },
  { icon: MessageCircle, titulo: "Receba contatos", texto: "Seu cartão aparece aqui com botão de orçamento direto no seu WhatsApp. Divulgação gratuita." },
];

function ParceirosLista({ onAbrirParceiroModal }) {
  const [parceiros, setParceiros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/partner-requests/public/aprovados")
      .then((res) => setParceiros(Array.isArray(res.data?.partners) ? res.data.partners : []))
      .catch(() => setErro("Não foi possível carregar os profissionais agora. Tente novamente em instantes."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div>
      <div className="comunidade-intro">
        <div>
          <h3>Profissionais que trabalham com resina</h3>
          <p>Precisa de alguém para imprimir, pintar ou modelar uma peça? Encontre aqui. Trabalha com isso? Divulgue seu serviço de graça.</p>
        </div>
        <button type="button" className="q-btn q-btn--primary" onClick={onAbrirParceiroModal}><Users size={15} /> Divulgar meu trabalho</button>
      </div>

      <PassosComoFunciona passos={PASSOS_PROFISSIONAIS} />

      {carregando && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Carregando profissionais...</p>}
      {erro && <div className="q-alert q-alert--error">{erro}</div>}

      {!carregando && !erro && parceiros.length === 0 && (
        <div className="q-empty comunidade-vazio">
          <h3>A lista de profissionais está começando</h3>
          <p>Seja um dos primeiros a aparecer aqui. Quem procura impressão, pintura ou modelagem em resina vai ver o seu trabalho.</p>
          <button type="button" className="q-btn q-btn--primary" onClick={onAbrirParceiroModal}><Users size={15} /> Quero divulgar meu trabalho</button>
        </div>
      )}

      {!carregando && parceiros.length > 0 && (
        <div className="q-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 540px), 1fr))", maxWidth: "1280px" }}>
          {parceiros.map((p) => (
            <div key={p._id} className="q-card" style={{ padding: "0", display: "flex", flexDirection: "column", gap: "0", overflow: "hidden", border: "1px solid var(--border-strong)", boxShadow: "0 18px 42px rgba(0,0,0,0.2)" }}>
              {p.fotos?.[0]?.url && (
                <div style={{ width: "100%", height: "min(480px, 70vw)", borderRadius: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={p.fotos[0].url} alt={p.titulo} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              )}
              <div style={{ padding: "22px 24px 10px" }}>
                <span className="q-badge">{p.categoria || "Profissional"}</span>
                <h3 style={{ margin: "8px 0 5px", fontSize: "1.12rem" }}>{p.titulo}</h3>
                <p style={{ margin: "0 0 8px", color: "var(--primary)", fontSize: "0.86rem", fontWeight: 800 }}>{p.nome}</p>
                <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.55 }}>{p.descricao}</p>
              </div>
              {(p.cidade || p.estado) && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0 24px", fontSize: "0.8rem", color: "var(--text-muted)" }}><MapPin size={12} /> {p.cidade}{p.cidade && p.estado ? " - " : ""}{p.estado}</span>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px", padding: "16px 24px 22px", borderTop: "1px solid var(--border-soft)", background: "rgba(47,123,255,0.04)" }}>
                {p.telefone && <span style={{ width: "100%", color: "var(--text-secondary)", fontSize: "0.82rem", fontWeight: 700 }}>Gostou deste trabalho? Fale diretamente com o profissional.</span>}
                {p.telefone && <a className="q-btn q-btn--primary" style={{ width: "100%", justifyContent: "center" }} href={`https://wa.me/${String(p.telefone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> Solicitar orçamento</a>}
                {p.instagram && (pareceLink(p.instagram)
                  ? <a href={p.instagram.startsWith("http") ? p.instagram : `https://instagram.com/${p.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--primary)", fontWeight: 700 }}><AtSign size={13} /> Instagram</a>
                  : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--text-muted)" }}><AtSign size={13} /> {p.instagram}</span>)}
                {p.site && (pareceLink(p.site)
                  ? <a href={montarLink(p.site)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--primary)", fontWeight: 700 }}><Globe size={13} /> Site</a>
                  : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--text-muted)" }}><Globe size={13} /> {p.site}</span>)}
                {p.portfolio && (pareceLink(p.portfolio)
                  ? <a href={montarLink(p.portfolio)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--primary)", fontWeight: 700 }}><Briefcase size={13} /> Portfólio</a>
                  : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--text-muted)" }}><Briefcase size={13} /> {p.portfolio}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormularioEnvio({ cliente, onFechar }) {
  const [form, setForm] = useState(formularioVazio);
  const [foto, setFoto] = useState(null);
  const [impressoras, setImpressoras] = useState(IMPRESSORAS_RESERVA);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");

  // Mesma lista de impressoras da pagina de Parametros
  useEffect(() => {
    let ativo = true;
    api.get("/parametros/impressoras")
      .then((res) => {
        const nomes = res.data?.data || res.data?.impressoras || [];
        const limpos = Array.from(new Set(nomes.map((n) => String(n || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        if (ativo && limpos.length > 10) setImpressoras(limpos);
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  function alterar(campo, valor) { setForm((a) => ({ ...a, [campo]: valor })); }
  function alterarParametro(campo, valor) { setForm((a) => ({ ...a, parametros: { ...a.parametros, [campo]: valor } })); }
  function alterarRede(campo, valor) { setForm((a) => ({ ...a, redes: { ...a.redes, [campo]: valor } })); }

  async function enviar(event) {
    event.preventDefault();
    setErroEnvio("");
    const resinaFinal = form.resina === "outra" ? form.resinaCustom : form.resina;
    const impressoraFinal = form.impressora === "outra" ? form.impressoraCustom : form.impressora;
    if (!resinaFinal?.trim() || !impressoraFinal?.trim() || !foto) { setErroEnvio("Preencha a resina, a impressora e escolha uma foto."); return; }
    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append("nome", cliente?.nome || "");
      formData.append("telefone", cliente?.telefone || "");
      formData.append("email", cliente?.email || "");
      formData.append("resina", form.resina === "outra" ? (form.resinaCustom || "Outra") : form.resina);
      formData.append("impressora", form.impressora === "outra" ? (form.impressoraCustom || "Outra") : form.impressora);
      formData.append("observacao", form.observacao);
      formData.append("clienteId", cliente?._id || "");
      formData.append("fotos", await comprimirImagem(foto));
      formData.append("autorizaDivulgacao", form.autorizaDivulgacao ? "true" : "false");
      Object.entries(form.parametros).forEach(([campo, valor]) => formData.append(`parametros.${campo}`, valor));
      Object.entries(form.redes).forEach(([campo, valor]) => formData.append(`redesSociais.${campo}`, valor));
      await api.post("/gallery", formData);
      setSucesso(true);
      setForm(formularioVazio());
      setFoto(null);
    } catch (err) { console.error("Erro ao enviar para galeria:", err); setErroEnvio("Erro ao enviar a foto. Tente novamente."); }
    finally { setEnviando(false); }
  }

  if (sucesso) {
    return (
      <div className="comunidade-form">
        <div className="q-alert q-alert--success" style={{ marginBottom: 12 }}>Recebemos sua peça! Ela aparece na galeria assim que a Quanton3D conferir.</div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" className="q-btn q-btn--primary" onClick={() => setSucesso(false)}><Plus size={15} /> Enviar outra peça</button>
          <button type="button" className="q-btn q-btn--ghost" onClick={onFechar}>Voltar para a galeria</button>
        </div>
      </div>
    );
  }

  return (
    <form className="comunidade-form" onSubmit={enviar}>
      <div className="comunidade-form-topo">
        <h3>Enviar minha peça</h3>
        <button type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={onFechar}><X size={15} /> Fechar</button>
      </div>
      {erroEnvio && <div className="q-alert q-alert--error">{erroEnvio}</div>}
      <div className="q-form-grid" style={{ marginBottom: "16px" }}>
        <label className="q-field"><span>Resina usada *</span>
          <select className="q-select" value={form.resina} onChange={(e) => alterar("resina", e.target.value)}>
            <option value="">Selecione a resina...</option>
            {RESINAS_QUANTON.map((r) => <option key={r} value={r}>{r}</option>)}
            <option value="outra">Outra (não listada)</option>
          </select>
          {form.resina === "outra" && <input className="q-input" style={{ marginTop: "6px" }} value={form.resinaCustom || ""} onChange={(e) => alterar("resinaCustom", e.target.value)} placeholder="Digite o nome da resina" />}
        </label>
        <label className="q-field"><span>Impressora *</span>
          <select className="q-select" value={form.impressora} onChange={(e) => alterar("impressora", e.target.value)}>
            <option value="">Selecione a impressora...</option>
            {impressoras.map((i) => <option key={i} value={i}>{i}</option>)}
            <option value="outra">Outra (não listada)</option>
          </select>
          {form.impressora === "outra" && <input className="q-input" style={{ marginTop: "6px" }} value={form.impressoraCustom || ""} onChange={(e) => alterar("impressoraCustom", e.target.value)} placeholder="Digite o modelo da impressora" />}
        </label>
        <label className="q-field q-field-full"><span>Foto da peça *</span><input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} /></label>
      </div>
      <AvisoFotoPrivacidade publica />

      <label className="q-field" style={{ marginBottom: "16px" }}><span>Conte como foi (opcional)</span>
        <textarea className="q-textarea" rows="3" value={form.observacao} onChange={(e) => alterar("observacao", e.target.value)} placeholder="Ex.: temperatura ambiente, suporte usado, pintura, ajustes que fez..." />
      </label>

      <details className="comunidade-detalhes">
        <summary><SlidersHorizontal size={15} /> Adicionar parâmetros do Chitubox (opcional)</summary>
        <p style={{ fontSize: "0.78rem", margin: "10px 0 12px" }}>Preencha só o que souber. Ajuda outros clientes com a mesma impressora.</p>
        <div className="q-form-grid">
          {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => (
            <label key={campo.name} className="q-field"><span>{campo.label}</span>
              <input className="q-input" value={form.parametros[campo.name]} onChange={(e) => alterarParametro(campo.name, e.target.value)} placeholder={campo.placeholder} />
            </label>
          ))}
        </div>
      </details>

      <div style={{ padding: "14px", borderRadius: "var(--r-md)", background: "rgba(150,80,245,0.05)", border: "1px solid var(--border-accent)", margin: "16px 0" }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
          <input type="checkbox" checked={form.autorizaDivulgacao} onChange={(e) => alterar("autorizaDivulgacao", e.target.checked)} style={{ marginTop: "3px" }} />
          <span style={{ fontSize: "0.85rem" }}>Autorizo a Quanton3D a divulgar essa peça nas redes sociais oficiais, dando os créditos a mim.</span>
        </label>
        {form.autorizaDivulgacao && (
          <div className="comunidade-redes">
            <input className="q-input" value={form.redes.instagram} onChange={(e) => alterarRede("instagram", e.target.value)} placeholder="@ do Instagram" />
            <input className="q-input" value={form.redes.tiktok} onChange={(e) => alterarRede("tiktok", e.target.value)} placeholder="@ do TikTok" />
            <input className="q-input" value={form.redes.facebook} onChange={(e) => alterarRede("facebook", e.target.value)} placeholder="Facebook" />
            <input className="q-input" value={form.redes.youtube} onChange={(e) => alterarRede("youtube", e.target.value)} placeholder="Canal do YouTube" />
          </div>
        )}
      </div>

      <button type="submit" className="q-btn q-btn--primary q-btn--block" disabled={enviando}>{enviando ? "Enviando..." : "Enviar para a Quanton3D conferir"}</button>
    </form>
  );
}

function GaleriaTab({ cliente, onPedirCadastro }) {
  const [itens, setItens] = useState([]);
  const [carregandoItens, setCarregandoItens] = useState(true);
  const [erroItens, setErroItens] = useState("");
  const [filtroResina, setFiltroResina] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);

  useEffect(() => {
    let ativo = true;
    api.get("/gallery").then((res) => { if (ativo) setItens(Array.isArray(res.data?.data) ? res.data.data : []); })
      .catch(() => { if (ativo) setErroItens("Não foi possível carregar as fotos agora."); })
      .finally(() => { if (ativo) setCarregandoItens(false); });
    return () => { ativo = false; };
  }, []);

  const resinasNaGaleria = useMemo(
    () => Array.from(new Set(itens.map((i) => String(i.resina || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [itens],
  );
  const itensVisiveis = filtroResina ? itens.filter((i) => String(i.resina || "").trim() === filtroResina) : itens;

  function abrirForm() {
    setMostrarForm(true);
    setTimeout(() => document.getElementById("comunidade-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <div>
      <div className="comunidade-intro">
        <div>
          <h3>Peças impressas com resinas Quanton3D</h3>
          <p>Veja o que a comunidade está imprimindo, com a resina, a impressora e os parâmetros usados. Imprimiu algo legal? Mostre aqui.</p>
        </div>
        {!mostrarForm && <button type="button" className="q-btn q-btn--primary" onClick={abrirForm}><Camera size={15} /> Enviar minha peça</button>}
      </div>

      <PassosComoFunciona passos={PASSOS_GALERIA} />

      {mostrarForm && <div id="comunidade-form">{cliente
        ? <FormularioEnvio cliente={cliente} onFechar={() => setMostrarForm(false)} />
        : <PedirCadastro texto="Para enviar sua peça para a galeria, faça seu cadastro rápido." onPedirCadastro={onPedirCadastro} />}</div>}

      {carregandoItens && <div className="q-empty">Carregando fotos...</div>}
      {erroItens && <div className="q-alert q-alert--error">{erroItens}</div>}

      {!carregandoItens && !erroItens && itens.length === 0 && !mostrarForm && (
        <div className="q-empty comunidade-vazio">
          <h3>A galeria está começando</h3>
          <p>Mande a foto de uma peça que você imprimiu com resina Quanton3D. Miniatura, peça técnica, modelo odontológico, vale tudo.</p>
          <button type="button" className="q-btn q-btn--primary" onClick={abrirForm}><Camera size={15} /> Enviar a primeira peça</button>
        </div>
      )}

      {!carregandoItens && !erroItens && <CarrosselComunidade variante="galeria" pecas={itens} onAbrirPeca={setItemSelecionado} />}

      {itens.length > 0 && resinasNaGaleria.length > 1 && (
        <div className="comunidade-filtro">
          <span>Filtrar por resina:</span>
          <button type="button" className={`q-badge${filtroResina === "" ? " q-badge--accent" : ""}`} onClick={() => setFiltroResina("")}>Todas ({itens.length})</button>
          {resinasNaGaleria.map((r) => (
            <button key={r} type="button" className={`q-badge${filtroResina === r ? " q-badge--accent" : ""}`} onClick={() => setFiltroResina(r)}>{r}</button>
          ))}
        </div>
      )}

      {itensVisiveis.length > 0 && (
        <div className="q-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))" }}>
          {itensVisiveis.map((item) => {
            const link = linkParametroOficial(item.resina);
            const params = CAMPOS_CONFIGURACAO_GALERIA.filter((campo) => item.parametros?.[campo.name]);
            return (
              <article key={item._id || item.imagem} className="q-card" style={{ overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}>
                {item.imagem && <button type="button" onClick={() => setItemSelecionado(item)} aria-label="Ampliar foto da peça" style={{ display: "block", width: "100%", padding: 0, border: 0, background: "rgba(0,0,0,0.3)", cursor: "zoom-in" }}><img src={item.imagem} alt={`Peça impressa com ${item.resina || "resina"}`} loading="lazy" style={{ width: "100%", height: "300px", objectFit: "contain", display: "block" }} /></button>}
                <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <div>
                    <h3 style={{ margin: "0 0 2px", fontSize: "1rem" }}>{item.resina || "Resina Quanton3D"}</h3>
                    {item.impressora && <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.impressora}</p>}
                  </div>
                  <CreditoAutor item={item} />
                  {item.observacao && <p style={{ fontSize: "0.82rem", fontStyle: "italic", margin: 0 }}>{item.observacao}</p>}
                  {params.length > 0 && (
                    <details className="comunidade-detalhes comunidade-detalhes--card">
                      <summary>Parâmetros usados ({params.length})</summary>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
                        {params.map((campo) => <span key={campo.name} className="q-badge" style={{ fontSize: "0.68rem" }}><strong>{campo.label}:</strong> {item.parametros[campo.name]}</span>)}
                      </div>
                    </details>
                  )}
                  {link && <a href={link} className="q-btn q-btn--ghost q-btn--sm" style={{ marginTop: "auto", alignSelf: "flex-start" }}><SlidersHorizontal size={14} /> Ver parâmetro oficial da {item.resina}</a>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {itemSelecionado && (
        <div role="dialog" aria-modal="true" aria-label="Foto ampliada da peça" onClick={() => setItemSelecionado(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0, 0, 0, 0.86)", cursor: "zoom-out" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "96vw", maxHeight: "92dvh", padding: "12px", borderRadius: "var(--r-md)", background: "var(--bg-raised)", boxShadow: "0 24px 70px rgba(0,0,0,0.6)", cursor: "default" }}>
            <button type="button" onClick={() => setItemSelecionado(null)} aria-label="Fechar foto ampliada" className="q-btn q-btn--ghost q-btn--sm" style={{ position: "absolute", top: "20px", right: "20px", zIndex: 1, background: "rgba(5,7,13,0.82)" }}><X size={18} /> Fechar</button>
            <img src={itemSelecionado.imagem} alt={`Peça impressa com ${itemSelecionado.resina || "resina"}`} style={{ display: "block", maxWidth: "calc(96vw - 48px)", maxHeight: "calc(92dvh - 48px)", objectFit: "contain", borderRadius: "var(--r-sm)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

const ABAS = [
  { id: "galeria", label: "Galeria de peças", icon: Camera },
  { id: "parceiros", label: "Profissionais", icon: Users },
];

function ComunidadeSection({ cliente, onAbrirParceiroModal, onPedirCadastro }) {
  const [aba, setAba] = useState("galeria");
  return (
    <section className="q-card q-panel">
      <span className="q-eyebrow">Rede Quanton3D</span>
      <h2 className="q-section-title">Comunidade</h2>
      <p className="q-section-desc">O espaço de quem imprime com resina Quanton3D: veja peças reais com os parâmetros usados, mostre o seu trabalho e encontre profissionais.</p>

      <div className="comunidade-abas" role="tablist">
        {ABAS.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)}
              className={`comunidade-aba${aba === a.id ? " is-ativa" : ""}`}>
              <Icon size={16} /> {a.label}
            </button>
          );
        })}
      </div>

      {aba === "galeria" && <GaleriaTab cliente={cliente} onPedirCadastro={onPedirCadastro} />}
      {aba === "parceiros" && <ParceirosLista onAbrirParceiroModal={onAbrirParceiroModal} />}
    </section>
  );
}

export default ComunidadeSection;
