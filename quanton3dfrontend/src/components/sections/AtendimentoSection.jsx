import { useEffect, useState } from "react";
import { Search, Settings2, Thermometer, Camera, Wrench, FlaskConical, MessageCircle, Phone, CheckCircle2, FolderOpen, Stethoscope, ArrowRight, X } from "lucide-react";
import api from "../../lib/api";
import { WHATSAPP_SUPORTE_URL } from "../../data/contact";

const PROBLEMAS = [
  "Peça não adere à plataforma",
  "Peça adere demais / não solta",
  "Delaminação (camadas separando)",
  "Warping / empenamento",
  "Suporte difícil de remover",
  "Peça porosa ou com buracos",
  "Linhas visíveis entre camadas",
  "FEP danificado",
  "Peça racha após alguns dias",
  "Resina vazando da peça",
  "Peça ficou branca / opaca após cura",
  "Peça amarelada após cura UV",
  "Cheiro muito forte / fumaça",
  "Tela LCD com manchas",
  "Outro problema",
];

// Sintomas com correspondência direta no guia de Diagnóstico de Falhas.
// Quem não está aqui não tem uma âncora específica — segue direto para o chamado.
const DIAGNOSTICO_ANCORA = {
  "Peça não adere à plataforma": "problema-1",
  "Peça adere demais / não solta": "problema-3",
  "Peça porosa ou com buracos": "problema-2",
  "Warping / empenamento": "problema-6",
  "Linhas visíveis entre camadas": "problema-7",
  "Peça amarelada após cura UV": "problema-4",
};

function ChamadoTecnico({ cliente }) {
  const [resinas, setResinas] = useState([]);
  const [impressoras, setImpressoras] = useState([]);
  const [form, setForm] = useState({
    problema: "", resina: "", impressora: "",
    alturaCamada: "", exposicaoNormal: "", exposicaoBase: "",
    camadasBase: "", temperatura: "", tentativas: "", observacao: "",
  });
  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [, setMostrarFormularioCompleto] = useState(false);
  const [mostrarDiagnosticoModal, setMostrarDiagnosticoModal] = useState(false);
  const ancoraDiagnostico = DIAGNOSTICO_ANCORA[form.problema];
  useEffect(() => {
    api.get("/parametros").then((res) => {
      const lista = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data?.parametros) ? res.data.parametros : [];
      setResinas([...new Set(lista.map((p) => p.resina).filter(Boolean))].sort());
      setImpressoras([...new Set(lista.map((p) => p.impressora).filter(Boolean))].sort());
    }).catch(() => {});
  }, []);

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }

  async function enviar(e) {
    e.preventDefault();
    if (!form.problema || !form.resina || !form.impressora) {
      setErro("Preencha pelo menos: tipo de problema, resina e impressora.");
      return;
    }
    try {
      setEnviando(true); setErro("");
      const descricao = [
        form.alturaCamada && `Altura de camada: ${form.alturaCamada}mm`,
        form.exposicaoNormal && `Exposição normal: ${form.exposicaoNormal}s`,
        form.exposicaoBase && `Exposição base: ${form.exposicaoBase}s`,
        form.camadasBase && `Camadas base: ${form.camadasBase}`,
        form.temperatura && `Temperatura ambiente: ${form.temperatura}°C`,
        form.tentativas && `O que já tentou: ${form.tentativas}`,
        form.observacao && `Observações: ${form.observacao}`,
      ].filter(Boolean).join(" | ");

      const formData = new FormData();
      formData.append("clienteId", cliente?._id || "");
      formData.append("nome", cliente?.nome || "");
      formData.append("telefone", cliente?.telefone || "");
      formData.append("email", cliente?.email || "");
      formData.append("problema", form.problema);
      formData.append("resina", form.resina === "outra" ? (form.resinaCustom || "Outra") : form.resina);
      formData.append("impressora", form.impressora === "outra" ? (form.impressoraCustom || "Outra") : form.impressora);
      formData.append("descricao", descricao);
      fotos.forEach((foto) => formData.append("fotos", foto));
      await api.post("/bot-tickets", formData);
      setSucesso(true);
    } catch (err) {
      console.error("Erro ao abrir chamado:", err);
      setErro("Erro ao enviar chamado. Tente novamente.");
    } finally { setEnviando(false); }
  }

  if (sucesso) return (
    <div className="q-empty">
      <div style={{ marginBottom: "10px" }}><CheckCircle2 size={38} color="var(--q-verde)" /></div>
      <h3 style={{ color: "var(--q-verde)" }}>Chamado registrado com sucesso!</h3>
      <p>Nossa equipe técnica analisará seu caso e entrará em contato pelo WhatsApp <strong style={{ color: "var(--text-primary)" }}>(31) 3271-6935</strong>.</p>
    </div>
  );

  const mostrarTriagem = false;
  const mostrarRestoForm = true;

  return (
    <form onSubmit={enviar}>
      <p style={{ fontSize: "0.86rem", marginBottom: "16px" }}>Conte pra gente qual problema você teve — se houver um diagnóstico rápido pra ele, mostramos antes de abrir o chamado.</p>
      {erro && <div className="q-alert q-alert--error">{erro}</div>}

      <h4 style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}><Search size={13} /> Identificação do problema</h4>
      <div className="q-form-grid" style={{ marginBottom: "18px" }}>
        <label className="q-field q-field-full"><span>Tipo de problema *</span>
          <select className="q-select" value={form.problema} onChange={(e) => {
            set("problema", e.target.value);
          }}>
            <option value="">Selecione o problema</option>
            {PROBLEMAS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      {mostrarTriagem && (
        <div className="q-alert q-alert--info" style={{ padding: "18px" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-primary)", margin: "0 0 6px" }}>
            <Stethoscope size={15} /> Diagnóstico rápido para este sintoma
          </h4>
          <p style={{ fontSize: "0.82rem", margin: "0 0 14px" }}>Veja a causa provável e a solução no guia técnico antes de abrir um chamado — pode resolver na hora.</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="button" className="q-btn q-btn--primary" onClick={() => setMostrarDiagnosticoModal(true)}>
              <Stethoscope size={15} /> Ver diagnóstico rápido
            </button>
            <button type="button" className="q-btn q-btn--ghost" onClick={() => setMostrarFormularioCompleto(true)}>
              Não resolveu — Abrir chamado técnico <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {mostrarDiagnosticoModal && (
        <div className="q-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setMostrarDiagnosticoModal(false)}>
          <section className="q-modal q-modal--wide calculator-modal" style={{ display: "flex", flexDirection: "column" }}>
            <div className="q-modal-head">
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.05rem" }}>
                <Stethoscope size={17} color="var(--primary)" /> Diagnóstico rápido — {form.problema}
              </h2>
              <button type="button" className="q-modal-close" onClick={() => setMostrarDiagnosticoModal(false)}><X size={13} /> Fechar</button>
            </div>
            <div className="calculator-shell" style={{ flex: 1, display: "flex", padding: 0 }}>
              <iframe
                title="Diagnóstico rápido"
                src={`/guias/guia-diagnostico-problemas.html#${ancoraDiagnostico}`}
                style={{ flex: 1, width: "100%", border: "none", background: "#fff" }}
              />
            </div>
          </section>
        </div>
      )}

      {mostrarRestoForm && (
        <>
          {mostrarTriagem && ancoraDiagnostico && (
            <div className="q-alert q-alert--info" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <span>Já vimos o diagnóstico rápido para este sintoma.</span>
              <button type="button" className="home-text-link" onClick={() => { setMostrarFormularioCompleto(false); setMostrarDiagnosticoModal(true); }}>Ver de novo</button>
            </div>
          )}

          <div className="q-form-grid" style={{ marginBottom: "18px" }}>
            <label className="q-field"><span>Resina usada *</span>
              <select className="q-select" value={form.resina} onChange={(e) => set("resina", e.target.value)}>
                <option value="">Selecione a resina</option>
                {resinas.map((r) => <option key={r} value={r}>{r}</option>)}
                <option value="Outra">Outra (não listada)</option>
              </select>
            </label>
            <label className="q-field"><span>Impressora *</span>
              <select className="q-select" value={form.impressora} onChange={(e) => set("impressora", e.target.value)}>
                <option value="">Selecione a impressora</option>
                {impressoras.map((i) => <option key={i} value={i}>{i}</option>)}
                <option value="Outra">Outra (não listada)</option>
              </select>
            </label>
          </div>

          <h4 style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}><Settings2 size={13} /> Parâmetros que você está usando</h4>
          <div className="q-form-grid" style={{ marginBottom: "18px" }}>
            {[
              { campo: "alturaCamada", label: "Altura de camada", placeholder: "Ex: 0.05mm" },
              { campo: "exposicaoNormal", label: "Exposição normal (s)", placeholder: "Ex: 2.1" },
              { campo: "exposicaoBase", label: "Exposição base (s)", placeholder: "Ex: 35" },
              { campo: "camadasBase", label: "Camadas base", placeholder: "Ex: 6" },
            ].map(({ campo, label, placeholder }) => (
              <label key={campo} className="q-field"><span>{label}</span>
                <input className="q-input" value={form[campo]} onChange={(e) => set(campo, e.target.value)} placeholder={placeholder} />
              </label>
            ))}
          </div>

          <h4 style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}><Thermometer size={13} /> Contexto e tentativas</h4>
          <div className="q-form-grid" style={{ marginBottom: "18px" }}>
            <label className="q-field"><span>Temperatura ambiente (°C)</span>
              <input className="q-input" value={form.temperatura} onChange={(e) => set("temperatura", e.target.value)} placeholder="Ex: 22" />
            </label>
            <label className="q-field q-field-full"><span>O que você já tentou para resolver?</span>
              <input className="q-input" value={form.tentativas} onChange={(e) => set("tentativas", e.target.value)} placeholder="Ex: aumentei exposição base, nivelei a plataforma..." />
            </label>
            <label className="q-field q-field-full"><span>Observações adicionais</span>
              <textarea className="q-textarea" rows={3} value={form.observacao} onChange={(e) => set("observacao", e.target.value)} placeholder="Quando começou? É sempre ou às vezes? Algum detalhe importante..." />
            </label>
          </div>

          <h4 style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}><Camera size={13} /> Fotos do problema (até 4)</h4>
          <label style={{ display: "block", padding: "16px", borderRadius: "var(--r-md)", border: "2px dashed var(--border-soft)", background: "rgba(0,146,255,0.04)", cursor: "pointer", textAlign: "center", marginBottom: "18px" }}>
            <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => setFotos(Array.from(e.target.files || []).slice(0, 4))} />
            {fotos.length > 0
              ? <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--q-verde)", fontWeight: 700 }}><CheckCircle2 size={14} /> {fotos.length} foto(s): {fotos.map((f) => f.name).join(", ")}</span>
              : <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.85rem" }}><FolderOpen size={14} /> Clique para selecionar fotos da peça com problema</span>}
          </label>

          <button type="submit" className="q-btn q-btn--primary q-btn--block" disabled={enviando}>
            <Wrench size={15} /> {enviando ? "Enviando chamado..." : "Abrir Chamado Técnico"}
          </button>
        </>
      )}
    </form>
  );
}

function FormulacaoPersonalizada({ cliente }) {
  const [form, setForm] = useState({ caracteristica: "", cor: "", detalhes: "" });
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar() {
    setErro("");
    if (!form.caracteristica.trim()) { setErro("Informe a aplicação desejada."); return; }
    try {
      setEnviando(true);
      await api.post("/formulacoes", {
        nome: cliente?.nome || "Não informado",
        telefone: cliente?.telefone || "Não informado",
        email: cliente?.email || "",
        caracteristica: form.caracteristica,
        cor: form.cor,
        detalhes: form.detalhes,
        clienteId: cliente?._id,
      });
      setSucesso(true);
    } catch (err) { console.error("Erro ao enviar formulação:", err); setErro("Erro ao enviar pedido. Tente novamente."); }
    finally { setEnviando(false); }
  }

  if (sucesso) return <div className="q-alert q-alert--success">Pedido enviado com sucesso! Nossa equipe entrará em contato.</div>;

  return (
    <div>
      <p style={{ fontSize: "0.86rem", marginBottom: "16px" }}>Solicite uma resina com propriedades específicas para sua aplicação.</p>
      {erro && <div className="q-alert q-alert--error">{erro}</div>}
      <div className="q-form-grid" style={{ marginBottom: "16px" }}>
        <label className="q-field"><span>Aplicação</span>
          <input className="q-input" value={form.caracteristica} onChange={(e) => setForm({ ...form, caracteristica: e.target.value })} placeholder="Ex.: Guia Cirúrgico, Joalheria, Industrial" />
        </label>
        <label className="q-field"><span>Cor desejada</span>
          <input className="q-input" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} placeholder="Ex.: Transparente, Branco, Rosa" />
        </label>
        <label className="q-field q-field-full"><span>Detalhes da necessidade</span>
          <textarea className="q-textarea" rows="4" value={form.detalhes} onChange={(e) => setForm({ ...form, detalhes: e.target.value })} placeholder="Descreva a aplicação, propriedades desejadas (flexibilidade, resistência, biocompatibilidade), volume estimado..." />
        </label>
      </div>
      <button type="button" className="q-btn q-btn--primary" onClick={enviar} disabled={enviando}>{enviando ? "Enviando..." : "Solicitar Estudo"}</button>
    </div>
  );
}

const ABAS = [
  { id: "chamado", label: "Chamado Técnico", icon: Wrench },
  { id: "formulacao", label: "Formulação Personalizada", icon: FlaskConical },
];

function AtendimentoSection({ cliente, onAbrirContato }) {
  const [aba, setAba] = useState("chamado");

  return (
    <section className="q-card q-panel">
      <span className="q-eyebrow">Suporte</span>
      <h2 className="q-section-title">Atendimento</h2>
      <p className="q-section-desc">Fale com a Quanton3D, abra um chamado técnico ou peça uma formulação sob medida.</p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <button type="button" className="q-btn q-btn--primary" onClick={onAbrirContato}><MessageCircle size={15} /> Fale Conosco</button>
        <a className="q-btn q-btn--whatsapp" href={WHATSAPP_SUPORTE_URL} target="_blank" rel="noreferrer"><Phone size={15} /> WhatsApp Suporte</a>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", borderBottom: "1px solid var(--border-soft)" }}>
        {ABAS.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.id} type="button"
              onClick={() => setAba(a.id)}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 6px", background: "none", border: "none", borderBottom: aba === a.id ? "2px solid var(--primary)" : "2px solid transparent", color: aba === a.id ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 700, fontSize: "0.85rem" }}>
              <Icon size={14} /> {a.label}
            </button>
          );
        })}
      </div>

      {aba === "chamado" && <ChamadoTecnico cliente={cliente} />}
      {aba === "formulacao" && <FormulacaoPersonalizada cliente={cliente} />}
    </section>
  );
}

export default AtendimentoSection;
