import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../api";

const CAMPOS_CONFIGURACAO_GALERIA = [
  { name: "alturaCamada", label: "Altura camada", placeholder: "Ex.: 0,050 mm" },
  { name: "camadasBase", label: "Camadas de base", placeholder: "Ex.: 4" },
  { name: "exposicaoNormal", label: "Tempo exposicao", placeholder: "Ex.: 2,100 s" },
  { name: "exposicaoBase", label: "Tempo exposicao base", placeholder: "Ex.: 37,000 s" },
  { name: "contagemTransicao", label: "Contagem de transicao", placeholder: "Ex.: 0" },
  { name: "tipoTransicao", label: "Tipo de transicao", placeholder: "Ex.: Linear" },
  { name: "retardoDesligarUV", label: "Retardo desligar UV", placeholder: "Ex.: 2,000 s" },
  { name: "distElevacaoInferior", label: "Dist. elevacao inferior", placeholder: "Ex.: 11,000 mm" },
  { name: "distElevacao", label: "Distancia elevacao", placeholder: "Ex.: 11,000 mm" },
  { name: "distRetracao", label: "Distancia de retracao", placeholder: "Ex.: 11,000 mm" },
  { name: "velElevacaoInferior", label: "Vel. elevacao inferior", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velElevacao", label: "Vel. elevacao", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velRetracaoInferior", label: "Vel. retracao inferior", placeholder: "Ex.: 135,000 mm/min" },
  { name: "velRetracao", label: "Vel. retracao", placeholder: "Ex.: 135,000 mm/min" },
];

function GaleriaContent({ cliente, initialAba = "enviar", ocultarAbas = false }) {
  const [aba, setAba] = useState(initialAba);
  const [form, setForm] = useState({ resina: "", impressora: "", observacao: "", parametros: criarConfiguracaoVazia(), redes: { instagram: "", tiktok: "", facebook: "", youtube: "" }, autorizaDivulgacao: false });
  const [foto, setFoto] = useState(null);
  const [itens, setItens] = useState([]);
  const [carregandoItens, setCarregandoItens] = useState(false);
  const [erroItens, setErroItens] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (aba !== "ver") return undefined;
    let ativo = true;
    async function carregarGaleria() {
      try {
        setCarregandoItens(true); setErroItens("");
        const resposta = await api.get("/gallery");
        const lista = Array.isArray(resposta.data?.data) ? resposta.data.data : [];
        if (ativo) setItens(lista);
      } catch (err) { console.error("Erro ao carregar galeria:", err); if (ativo) setErroItens("Não foi possível carregar as fotos aprovadas agora."); }
      finally { if (ativo) setCarregandoItens(false); }
    }
    carregarGaleria();
    return () => { ativo = false; };
  }, [aba]);

  function alterar(campo, valor) { setForm((a) => ({ ...a, [campo]: valor })); }
  function alterarParametro(campo, valor) { setForm((a) => ({ ...a, parametros: { ...a.parametros, [campo]: valor } })); }
  function alterarRede(campo, valor) { setForm((a) => ({ ...a, redes: { ...a.redes, [campo]: valor } })); }

  async function enviar(event) {
    event.preventDefault();
    const resinaFinal = form.resina === "outra" ? form.resinaCustom : form.resina;
    const impressoraFinal = form.impressora === "outra" ? form.impressoraCustom : form.impressora;
    if (!resinaFinal?.trim() || !impressoraFinal?.trim() || !foto) { alert("Preencha a resina, a impressora e envie uma foto."); return; }
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
    } catch (err) { console.error("Erro ao enviar para galeria:", err); alert("Erro ao enviar para galeria."); }
    finally { setEnviando(false); }
  }

  return (
    <div className="modal-rich-content gallery-content">
      <p>{aba === "ver" && ocultarAbas ? "Veja fotos aprovadas de clientes e configurações reais." : "Envie uma foto real da peça e as configurações do Chitubox."}</p>
      {!ocultarAbas && (
        <div className="gallery-tabs" role="tablist">
          <button type="button" className={aba === "enviar" ? "active" : ""} onClick={() => setAba("enviar")}>📷 Enviar configuração</button>
          <button type="button" className={aba === "ver" ? "active" : ""} onClick={() => setAba("ver")}>Ver fotos de clientes</button>
        </div>
      )}
      {aba === "enviar" ? (
        <form className="modal-form-layout" style={{ marginTop: "20px" }} onSubmit={enviar}>
          {sucesso && <div className="modal-success">Enviado! Aguarda aprovação para aparecer para outros clientes.</div>}
          <div className="form-grid gallery-form-grid">
            <label><span>Resina usada *</span>
              <select value={form.resina} onChange={e => alterar("resina", e.target.value)}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.85)", color: form.resina ? "#eaf3ff" : "#6b8aad", fontSize: "0.88rem", fontFamily: "inherit", width: "100%" }}>
                <option value="">Selecione a resina...</option>
                {RESINAS_QUANTON.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="outra">Outra (não listada)</option>
              </select>
              {form.resina === "outra" && <input value={form.resinaCustom || ""} onChange={e => alterar("resinaCustom", e.target.value)} placeholder="Digite o nome da resina" style={{ marginTop: "6px", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.85)", color: "#eaf3ff", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }} />}
            </label>
            <label><span>Impressora *</span>
              <select value={form.impressora} onChange={e => alterar("impressora", e.target.value)}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.85)", color: form.impressora ? "#eaf3ff" : "#6b8aad", fontSize: "0.88rem", fontFamily: "inherit", width: "100%" }}>
                <option value="">Selecione a impressora...</option>
                {IMPRESSORAS_COMUNS.map(i => <option key={i} value={i}>{i}</option>)}
                <option value="outra">Outra (não listada)</option>
              </select>
              {form.impressora === "outra" && <input value={form.impressoraCustom || ""} onChange={e => alterar("impressoraCustom", e.target.value)} placeholder="Digite o modelo da impressora" style={{ marginTop: "6px", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(113,159,219,0.3)", background: "rgba(4,10,24,0.85)", color: "#eaf3ff", fontSize: "0.88rem", width: "100%", boxSizing: "border-box" }} />}
            </label>
            <label className="partner-grid-full"><span>Foto do trabalho *</span><input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} /></label>
          </div>
          <div className="gallery-config-box">
            <h3>Configurações do Chitubox</h3>
            <p>Preencha o que souber. Deixe em branco o que não souber.</p>
            <div className="form-grid gallery-settings-grid">
              {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => (
                <label key={campo.name}><span>{campo.label}</span><input value={form.parametros[campo.name]} onChange={(e) => alterarParametro(campo.name, e.target.value)} placeholder={campo.placeholder} /></label>
              ))}
            </div>
          </div>
          <label className="gallery-observation"><span>Observações para o próximo cliente</span><textarea rows="4" value={form.observacao} onChange={(e) => alterar("observacao", e.target.value)} placeholder="Ex.: temperatura ambiente, suporte usado, ajustes que fez..." /></label>

          <div style={{ marginTop: "16px", padding: "14px", borderRadius: "12px", background: "rgba(184,156,255,0.06)", border: "1px solid rgba(184,156,255,0.2)" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginBottom: form.autorizaDivulgacao ? "14px" : 0 }}>
              <input type="checkbox" checked={form.autorizaDivulgacao} onChange={e => alterar("autorizaDivulgacao", e.target.checked)} style={{ marginTop: "3px" }} />
              <span style={{ fontSize: "0.85rem", color: "#d3e4f8", lineHeight: 1.5 }}>
                📸 Autorizo a Quanton3D a divulgar essa peça nas redes sociais oficiais, dando os créditos a mim.
              </span>
            </label>

            {form.autorizaDivulgacao && (
              <div>
                <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#9fb4c7" }}>Ótimo! Deixa seu @ pra gente te marcar (opcional, preencha o que tiver):</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input value={form.redes.instagram} onChange={e => alterarRede("instagram", e.target.value)} placeholder="📸 @ do Instagram" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                  <input value={form.redes.tiktok} onChange={e => alterarRede("tiktok", e.target.value)} placeholder="🎵 @ do TikTok" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                  <input value={form.redes.facebook} onChange={e => alterarRede("facebook", e.target.value)} placeholder="📘 Facebook" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                  <input value={form.redes.youtube} onChange={e => alterarRede("youtube", e.target.value)} placeholder="▶️ Canal do YouTube" style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(184,156,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.82rem" }} />
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="submit-registration" style={{ marginTop: "16px" }} disabled={enviando}>{enviando ? "Enviando..." : "Enviar para aprovação"}</button>
        </form>
      ) : (
        <div className="gallery-approved-list">
          {carregandoItens && <div className="gallery-empty">Carregando fotos aprovadas...</div>}
          {erroItens && <div className="modal-error">{erroItens}</div>}
          {!carregandoItens && !erroItens && itens.length === 0 && <div className="gallery-empty">Ainda não há fotos aprovadas.</div>}
          {itens.map((item) => (
            <article className="gallery-approved-card" key={item._id || item.imagem} style={{ border: "1px solid rgba(113,159,219,0.2)", borderRadius: "16px", overflow: "hidden", background: "rgba(255,255,255,0.04)", marginBottom: "16px" }}>
              {item.imagem && (
                <img
                  src={item.imagem}
                  alt={`Peca impressa com ${item.resina || "resina"}`}
                  style={{ width: "100%", maxHeight: "340px", objectFit: "contain", background: "rgba(0,0,0,0.3)", display: "block" }}
                />
              )}
              <div style={{ padding: "14px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "1rem", color: "#eaf3ff" }}>{item.resina || "Resina nao informada"}</h3>
                <p style={{ margin: "0 0 8px", color: "#9fb4c7", fontSize: "0.85rem" }}>{item.impressora || "Impressora nao informada"}</p>
                {item.observacao && <p className="gallery-note" style={{ color: "#d3e4f8", fontSize: "0.85rem", fontStyle: "italic", margin: "0 0 8px" }}>{item.observacao}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                    const valor = item.parametros?.[campo.name];
                    return valor ? <span key={campo.name} style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: "6px", background: "rgba(26,115,232,0.12)", border: "1px solid rgba(26,115,232,0.2)", color: "#a8c4e8" }}><strong>{campo.label}:</strong> {valor}</span> : null;
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


export default GaleriaContent;
