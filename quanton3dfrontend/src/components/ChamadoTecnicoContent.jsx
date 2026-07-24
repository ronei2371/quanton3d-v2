import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../api";

function ChamadoTecnicoContent({ cliente }) {
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

  useEffect(() => {
    api.get("/parametros").then(res => {
      const lista = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data?.parametros) ? res.data.parametros : [];
      const rs = [...new Set(lista.map(p => p.resina).filter(Boolean))].sort();
      const im = [...new Set(lista.map(p => p.impressora).filter(Boolean))].sort();
      setResinas(rs);
      setImpressoras(im);
    }).catch(() => {});
  }, []);

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })); }

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
      fotos.forEach(foto => formData.append("fotos", foto));
      await api.post("/bot-tickets", formData);
      setSucesso(true);
    } catch (err) {
      console.error("Erro ao abrir chamado:", err);
      setErro("Erro ao enviar chamado. Tente novamente.");
    } finally { setEnviando(false); }
  }

  const S = {
    section: { marginBottom: "16px" },
    title: { fontSize: "0.72rem", fontWeight: 900, color: "#4fd1ff", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", padding: "6px 10px", background: "rgba(79,209,255,0.08)", borderRadius: "8px", display: "block" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
    field: { display: "flex", flexDirection: "column", gap: "5px" },
    label: { fontSize: "0.78rem", fontWeight: 700, color: "#9fb4c7" },
    input: { padding: "9px 11px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.22)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.88rem" },
    select: { padding: "9px 11px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.22)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.88rem" },
  };

  if (sucesso) return (
    <div style={{ textAlign: "center", padding: "36px" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✅</div>
      <h3 style={{ color: "#49e68b", margin: "0 0 10px" }}>Chamado registrado com sucesso!</h3>
      <p style={{ color: "#9fb4c7" }}>Nossa equipe técnica analisará seu caso e entrará em contato pelo WhatsApp <strong style={{ color: "#eaf3ff" }}>(31) 3271-6935</strong>.</p>
    </div>
  );

  return (
    <div>
      <p style={{ color: "#9fb4c7", marginBottom: "18px", fontSize: "0.88rem" }}>
        Preencha os campos abaixo. Quanto mais detalhes, mais rápido conseguimos resolver!
      </p>

      <form onSubmit={enviar}>
        {erro && <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", color: "#ff8fab", marginBottom: "14px", fontSize: "0.85rem" }}>{erro}</div>}

        {/* Bloco 1 — Identificação */}
        <div style={S.section}>
          <span style={S.title}>🔍 Identificação do problema</span>
          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}>Tipo de problema *</label>
              <select value={form.problema} onChange={e => set("problema", e.target.value)} style={S.select}>
                <option value="">Selecione o problema</option>
                {PROBLEMAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Resina usada *</label>
              <select value={form.resina} onChange={e => set("resina", e.target.value)} style={S.select}>
                <option value="">Selecione a resina</option>
                {resinas.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="Outra">Outra (não listada)</option>
              </select>
            </div>
            <div style={{ ...S.field, gridColumn: "1/-1" }}>
              <label style={S.label}>Impressora *</label>
              <select value={form.impressora} onChange={e => set("impressora", e.target.value)} style={S.select}>
                <option value="">Selecione a impressora</option>
                {impressoras.map(i => <option key={i} value={i}>{i}</option>)}
                <option value="Outra">Outra (não listada)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 2 — Parâmetros usados */}
        <div style={S.section}>
          <span style={S.title}>⚙️ Parâmetros que você está usando (estilo Chitubox)</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" }}>
            {[
              { campo: "alturaCamada", label: "Altura de camada", placeholder: "Ex: 0.05mm" },
              { campo: "exposicaoNormal", label: "Exposição normal (s)", placeholder: "Ex: 2.1" },
              { campo: "exposicaoBase", label: "Exposição base (s)", placeholder: "Ex: 35" },
              { campo: "camadasBase", label: "Camadas base", placeholder: "Ex: 6" },
            ].map(({ campo, label, placeholder }) => (
              <div key={campo} style={S.field}>
                <label style={S.label}>{label}</label>
                <input value={form[campo]} onChange={e => set(campo, e.target.value)} placeholder={placeholder} style={S.input} />
              </div>
            ))}
          </div>
        </div>

        {/* Bloco 3 — Contexto */}
        <div style={S.section}>
          <span style={S.title}>🌡️ Contexto e tentativas</span>
          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}>Temperatura ambiente (°C)</label>
              <input value={form.temperatura} onChange={e => set("temperatura", e.target.value)} placeholder="Ex: 22" style={S.input} />
            </div>
            <div style={{ ...S.field, gridColumn: "1/-1" }}>
              <label style={S.label}>O que você já tentou para resolver?</label>
              <input value={form.tentativas} onChange={e => set("tentativas", e.target.value)} placeholder="Ex: aumentei exposição base, nivelei a plataforma..." style={S.input} />
            </div>
            <div style={{ ...S.field, gridColumn: "1/-1" }}>
              <label style={S.label}>Observações adicionais</label>
              <textarea value={form.observacao} onChange={e => set("observacao", e.target.value)} rows={3}
                placeholder="Quando começou? É sempre ou às vezes? Algum detalhe importante..."
                style={{ ...S.input, resize: "vertical", minHeight: "72px" }} />
            </div>
          </div>
        </div>

        {/* Fotos */}
        <div style={S.section}>
          <span style={S.title}>📷 Fotos do problema (até 4)</span>
          <label style={{ display: "block", padding: "14px", borderRadius: "10px", border: "2px dashed rgba(79,209,255,0.3)", background: "rgba(79,209,255,0.04)", cursor: "pointer", textAlign: "center" }}>
            <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => setFotos(Array.from(e.target.files || []).slice(0, 4))} />
            {fotos.length > 0
              ? <span style={{ color: "#49e68b", fontWeight: 700 }}>✅ {fotos.length} foto(s): {fotos.map(f => f.name).join(", ")}</span>
              : <span style={{ color: "#9fb4c7", fontSize: "0.85rem" }}>📁 Clique para selecionar fotos da peça com problema</span>
            }
          </label>
        </div>

        <button type="submit" disabled={enviando}
          style={{ width: "100%", padding: "14px", borderRadius: "12px", border: 0, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#ffffff", fontWeight: 900, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
          {enviando ? "Enviando chamado..." : "🔧 Abrir Chamado Técnico"}
        </button>
      </form>
    </div>
  );
}

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


export default ChamadoTecnicoContent;
