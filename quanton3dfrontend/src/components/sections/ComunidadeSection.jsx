import { useEffect, useState } from "react";
import { Users, Camera, MapPin, AtSign, Globe, Briefcase, X, MessageCircle } from "lucide-react";
import api from "../../lib/api";

const RESINAS_QUANTON = [
  "ALCHEMIST", "IRON", "IRON 70/30", "FLEXFORM", "POSEIDON",
  "PYROBLAST", "VULCAN CAST", "SPIN", "SPARK", "LOW SMELL", "VELVET SKIN",
  "ATHOM DENTAL", "ATHOM ALINHADORES", "ATHOM WASHABLE",
];

const IMPRESSORAS_COMUNS = [
  "Anycubic Photon Mono", "Anycubic Photon Mono X", "Anycubic Photon Mono X 6K",
  "Anycubic Photon M3", "Anycubic Photon M3 Max", "Anycubic Photon M3 Plus",
  "Anycubic Photon M5", "Anycubic Photon M5s", "Anycubic Photon M7",
  "Elegoo Mars 2", "Elegoo Mars 3", "Elegoo Mars 4", "Elegoo Mars 4 Ultra",
  "Elegoo Saturn", "Elegoo Saturn 2", "Elegoo Saturn 3 Ultra", "Elegoo Saturn 4 Ultra",
  "Elegoo Jupiter", "Elegoo Jupiter SE",
  "Creality Halot One", "Creality Halot Mage", "Creality Halot Mage Pro",
  "Phrozen Sonic Mini 8K", "Phrozen Sonic Mighty 8K",
  "Bambu Lab",
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

function ParceirosLista({ onAbrirParceiroModal }) {
  const [parceiros, setParceiros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/partner-requests/public/aprovados")
      .then((res) => setParceiros(Array.isArray(res.data?.partners) ? res.data.partners : []))
      .catch(() => setErro("Não foi possível carregar os parceiros agora. Tente novamente em instantes."))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <p style={{ margin: 0, fontSize: "0.85rem" }}>Conheça profissionais e serviços da comunidade Quanton3D.</p>
        <button type="button" className="q-btn q-btn--primary" onClick={onAbrirParceiroModal}><Users size={15} /> Divulgar meu trabalho</button>
      </div>

      {carregando && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Carregando parceiros...</p>}
      {erro && <div className="q-alert q-alert--error">{erro}</div>}

      {!carregando && !erro && parceiros.length === 0 && (
        <div className="q-empty"><h3>Ainda não há trabalhos divulgados</h3><p>Seja o primeiro. Publique seu trabalho e receba contatos de interessados.</p></div>
      )}

      {!carregando && parceiros.length > 0 && (
        <div className="q-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 420px), 1fr))" }}>
          {parceiros.map((p) => (
            <div key={p._id} className="q-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {p.fotos?.[0]?.url && (
                <div style={{ width: "100%", height: "320px", borderRadius: "var(--r-sm)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={p.fotos[0].url} alt={p.titulo} style={{ width: "100%", width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              )}
              <div>
                <span className="q-badge">{p.categoria || "Profissional"}</span>
                <h3 style={{ margin: "8px 0 5px", fontSize: "1.12rem" }}>{p.titulo}</h3>
                <p style={{ margin: "0 0 8px", color: "var(--primary)", fontSize: "0.86rem", fontWeight: 800 }}>{p.nome}</p>
                <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.55 }}>{p.descricao}</p>
              </div>
              {(p.cidade || p.estado) && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.76rem", color: "var(--text-muted)" }}><MapPin size={12} /> {p.cidade}{p.cidade && p.estado ? " - " : ""}{p.estado}</span>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border-soft)" }}>
                {p.telefone && <a className="q-btn q-btn--primary q-btn--sm" href={`https://wa.me/${String(p.telefone).replace(/\\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> Solicitar orçamento</a>}
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

function GaleriaTab({ cliente }) {
  const [aba, setAba] = useState("enviar");
  const [form, setForm] = useState({ resina: "", impressora: "", observacao: "", parametros: criarConfiguracaoVazia(), redes: { instagram: "", tiktok: "", facebook: "", youtube: "" }, autorizaDivulgacao: false });
  const [foto, setFoto] = useState(null);
  const [itens, setItens] = useState([]);
  const [carregandoItens, setCarregandoItens] = useState(false);
  const [erroItens, setErroItens] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [itemSelecionado, setItemSelecionado] = useState(null);

  useEffect(() => {
    if (aba !== "ver") return undefined;
    let ativo = true;
    api.get("/gallery").then((res) => { if (ativo) setItens(Array.isArray(res.data?.data) ? res.data.data : []); })
      .catch(() => { if (ativo) setErroItens("Não foi possível carregar as fotos aprovadas agora."); })
      .finally(() => { if (ativo) setCarregandoItens(false); });
    setCarregandoItens(true);
    return () => { ativo = false; };
  }, [aba]);

  function alterar(campo, valor) { setForm((a) => ({ ...a, [campo]: valor })); }
  function alterarParametro(campo, valor) { setForm((a) => ({ ...a, parametros: { ...a.parametros, [campo]: valor } })); }
  function alterarRede(campo, valor) { setForm((a) => ({ ...a, redes: { ...a.redes, [campo]: valor } })); }

  async function enviar(event) {
    event.preventDefault();
    setErroEnvio("");
    const resinaFinal = form.resina === "outra" ? form.resinaCustom : form.resina;
    const impressoraFinal = form.impressora === "outra" ? form.impressoraCustom : form.impressora;
    if (!resinaFinal?.trim() || !impressoraFinal?.trim() || !foto) { setErroEnvio("Preencha a resina, a impressora e envie uma foto."); return; }
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
      formData.append("fotos", foto);
      formData.append("autorizaDivulgacao", form.autorizaDivulgacao ? "true" : "false");
      Object.entries(form.parametros).forEach(([campo, valor]) => formData.append(`parametros.${campo}`, valor));
      Object.entries(form.redes).forEach(([campo, valor]) => formData.append(`redesSociais.${campo}`, valor));
      await api.post("/gallery", formData);
      setSucesso(true);
      setForm({ resina: "", impressora: "", observacao: "", parametros: criarConfiguracaoVazia(), redes: { instagram: "", tiktok: "", facebook: "", youtube: "" }, autorizaDivulgacao: false });
      setFoto(null);
    } catch (err) { console.error("Erro ao enviar para galeria:", err); setErroEnvio("Erro ao enviar para galeria. Tente novamente."); }
    finally { setEnviando(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", borderBottom: "1px solid var(--border-soft)" }}>
        <button type="button" onClick={() => setAba("enviar")} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "12px 8px", background: "none", border: "none", borderBottom: aba === "enviar" ? "2px solid var(--primary)" : "2px solid transparent", color: aba === "enviar" ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 700, fontSize: "0.95rem" }}><Camera size={16} /> Enviar configuração</button>
        <button type="button" onClick={() => setAba("ver")} style={{ padding: "12px 8px", background: "none", border: "none", borderBottom: aba === "ver" ? "2px solid var(--primary)" : "2px solid transparent", color: aba === "ver" ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 700, fontSize: "0.95rem" }}>Ver fotos de clientes</button>
      </div>

      {aba === "enviar" ? (
        <form onSubmit={enviar}>
          {sucesso && <div className="q-alert q-alert--success">Enviado! Aguarda aprovação para aparecer para outros clientes.</div>}
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
                {IMPRESSORAS_COMUNS.map((i) => <option key={i} value={i}>{i}</option>)}
                <option value="outra">Outra (não listada)</option>
              </select>
              {form.impressora === "outra" && <input className="q-input" style={{ marginTop: "6px" }} value={form.impressoraCustom || ""} onChange={(e) => alterar("impressoraCustom", e.target.value)} placeholder="Digite o modelo da impressora" />}
            </label>
            <label className="q-field q-field-full"><span>Foto do trabalho *</span><input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} /></label>
          </div>

          <div style={{ background: "rgba(0,146,255,0.04)", border: "1px solid var(--border-soft)", borderRadius: "var(--r-md)", padding: "16px", marginBottom: "16px" }}>
            <h4 style={{ fontSize: "0.9rem", margin: "0 0 4px" }}>Configurações do Chitubox</h4>
            <p style={{ fontSize: "0.78rem", margin: "0 0 12px" }}>Preencha o que souber. Deixe em branco o que não souber.</p>
            <div className="q-form-grid">
              {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => (
                <label key={campo.name} className="q-field"><span>{campo.label}</span>
                  <input className="q-input" value={form.parametros[campo.name]} onChange={(e) => alterarParametro(campo.name, e.target.value)} placeholder={campo.placeholder} />
                </label>
              ))}
            </div>
          </div>

          <label className="q-field" style={{ marginBottom: "16px" }}><span>Observações para o próximo cliente</span>
            <textarea className="q-textarea" rows="4" value={form.observacao} onChange={(e) => alterar("observacao", e.target.value)} placeholder="Ex.: temperatura ambiente, suporte usado, ajustes que fez..." />
          </label>

          <div style={{ padding: "14px", borderRadius: "var(--r-md)", background: "rgba(150,80,245,0.05)", border: "1px solid var(--border-accent)", marginBottom: "16px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.autorizaDivulgacao} onChange={(e) => alterar("autorizaDivulgacao", e.target.checked)} style={{ marginTop: "3px" }} />
              <span style={{ fontSize: "0.85rem" }}>Autorizo a Quanton3D a divulgar essa peça nas redes sociais oficiais, dando os créditos a mim.</span>
            </label>
            {form.autorizaDivulgacao && (
              <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <input className="q-input" value={form.redes.instagram} onChange={(e) => alterarRede("instagram", e.target.value)} placeholder="@ do Instagram" />
                <input className="q-input" value={form.redes.tiktok} onChange={(e) => alterarRede("tiktok", e.target.value)} placeholder="@ do TikTok" />
                <input className="q-input" value={form.redes.facebook} onChange={(e) => alterarRede("facebook", e.target.value)} placeholder="Facebook" />
                <input className="q-input" value={form.redes.youtube} onChange={(e) => alterarRede("youtube", e.target.value)} placeholder="Canal do YouTube" />
              </div>
            )}
          </div>

          <button type="submit" className="q-btn q-btn--primary q-btn--block" disabled={enviando}>{enviando ? "Enviando..." : "Enviar para aprovação"}</button>
        </form>
      ) : (
        <div>
          {carregandoItens && <div className="q-empty">Carregando fotos aprovadas...</div>}
          {erroItens && <div className="q-alert q-alert--error">{erroItens}</div>}
          {!carregandoItens && !erroItens && itens.length === 0 && <div className="q-empty">Ainda não há fotos aprovadas.</div>}
          <div className="q-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 600px), 1fr))" }}>
            {itens.map((item) => (
              <article key={item._id || item.imagem} className="q-card" style={{ overflow: "hidden" }}>
                {item.imagem && <button type="button" onClick={() => setItemSelecionado(item)} aria-label="Ampliar foto da peça" style={{ display: "block", width: "100%", padding: 0, border: 0, background: "rgba(0,0,0,0.3)", cursor: "zoom-in" }}><img src={item.imagem} alt={`Peça impressa com ${item.resina || "resina"}`} style={{ width: "100%", height: "380px", objectFit: "contain", display: "block" }} /></button>}
                <div style={{ padding: "14px" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem" }}>{item.resina || "Resina não informada"}</h3>
                  <p style={{ margin: "0 0 8px", fontSize: "0.8rem" }}>{item.impressora || "Impressora não informada"}</p>
                  {item.observacao && <p style={{ fontSize: "0.8rem", fontStyle: "italic", margin: "0 0 8px" }}>{item.observacao}</p>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                      const valor = item.parametros?.[campo.name];
                      return valor ? <span key={campo.name} className="q-badge" style={{ fontSize: "0.68rem" }}><strong>{campo.label}:</strong> {valor}</span> : null;
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {itemSelecionado && (
            <div role="dialog" aria-modal="true" aria-label="Foto ampliada da peça" onClick={() => setItemSelecionado(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(0, 0, 0, 0.86)", cursor: "zoom-out" }}>
              <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "96vw", maxHeight: "92dvh", padding: "12px", borderRadius: "var(--r-md)", background: "var(--bg-raised)", boxShadow: "0 24px 70px rgba(0,0,0,0.6)", cursor: "default" }}>
                <button type="button" onClick={() => setItemSelecionado(null)} aria-label="Fechar foto ampliada" className="q-btn q-btn--ghost q-btn--sm" style={{ position: "absolute", top: "20px", right: "20px", zIndex: 1, background: "rgba(5,7,13,0.82)" }}><X size={18} /> Fechar</button>
                <img src={itemSelecionado.imagem} alt={`Peça impressa com ${itemSelecionado.resina || "resina"}`} style={{ display: "block", maxWidth: "calc(96vw - 48px)", maxHeight: "calc(92dvh - 48px)", objectFit: "contain", borderRadius: "var(--r-sm)" }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ABAS = [
  { id: "parceiros", label: "Divulgue seu Trabalho", icon: Users },
  { id: "galeria", label: "Fotos e Peças", icon: Camera },
];

function ComunidadeSection({ cliente, onAbrirParceiroModal }) {
  const [aba, setAba] = useState("parceiros");
  return (
    <section className="q-card q-panel">
      <span className="q-eyebrow">Rede Quanton3D</span>
      <h2 className="q-section-title">Comunidade</h2>
      <p className="q-section-desc">Profissionais, serviços e as peças que a comunidade está criando.</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", borderBottom: "1px solid var(--border-soft)" }}>
        {ABAS.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.id} type="button" onClick={() => setAba(a.id)}
              style={{ display: "flex", alignItems: "center", gap: "7px", padding: "12px 8px", background: "none", border: "none", borderBottom: aba === a.id ? "2px solid var(--primary)" : "2px solid transparent", color: aba === a.id ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 700, fontSize: "0.95rem" }}>
              <Icon size={16} /> {a.label}
            </button>
          );
        })}
      </div>

      {aba === "parceiros" && <ParceirosLista onAbrirParceiroModal={onAbrirParceiroModal} />}
      {aba === "galeria" && <GaleriaTab cliente={cliente} />}
    </section>
  );
}

export default ComunidadeSection;
