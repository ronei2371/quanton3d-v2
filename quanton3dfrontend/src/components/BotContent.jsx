import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../api";
import { formatarMarkdown, escaparHtml, RESINAS_BOT } from "../utils";



function BotContent({ cliente }) {
  const [etapa, setEtapa] = useState("contexto"); // "contexto" | "chat"
  const [ctx, setCtx] = useState({ resina: "", impressora: "", altura: "0.05" });
  const [mensagens, setMensagens] = useState([]);
  const [pensando, setPensando] = useState(false);
  const [impressorasBot, setImpressorasBot] = useState([]);
  const [feedbackAberto, setFeedbackAberto] = useState(null);
  const [fotoFeedback, setFotoFeedback] = useState(null);
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [paramsFeedback, setParamsFeedback] = useState({ alturaCamada: "", exposicaoNormal: "", exposicaoBase: "", camadasBase: "" });
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const clienteId = cliente?._id || cliente?.id;
    if (!clienteId) return;

    let ativo = true;
    setMensagens([]);
    setEtapa("contexto");
    setCtx({ resina: "", impressora: "", altura: "0.05" });
    setCarregandoHistorico(true);

    api.get(`/chat/historico/${encodeURIComponent(clienteId)}`)
      .then(res => {
        if (!ativo) return;
        const conversas = Array.isArray(res.data?.conversas) ? res.data.conversas : [];

        if (!conversas.length) {
          /* Sem historico — fica na tela de contexto normalmente */
          setCarregandoHistorico(false);
          return;
        }

        const restauradas = conversas.flatMap(conversa => [
          { text: conversa.pergunta, isBot: false },
          { text: conversa.resposta, isBot: true, conversaId: conversa._id },
        ]).filter(mensagem => mensagem.text);

        const ultima = conversas[conversas.length - 1];
        const resinaRestaurada = ultima.resinaDetectada || "";
        const impressoraRestaurada = ultima.impressoraDetectada || "";

        /* Mensagem de boas-vindas de retorno no topo */
        const boasVoltas = `Bem-vindo de volta, ${cliente?.nome || ""}! 👋 Aqui está seu histórico de conversas com o ELIO.${resinaRestaurada ? ` Resina detectada: **${resinaRestaurada}**.` : ""} Pode continuar de onde parou ou fazer uma nova pergunta!`;

        setMensagens([{ text: boasVoltas, isBot: true }, ...restauradas]);
        setCtx(atual => ({
          ...atual,
          resina: atual.resina || resinaRestaurada,
          impressora: atual.impressora || impressoraRestaurada,
        }));
        setEtapa("chat");
        setCarregandoHistorico(false);
      })
      .catch(() => {
        if (ativo) setCarregandoHistorico(false);
      });

    return () => { ativo = false; };
  }, [cliente?._id, cliente?.id]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [mensagens]);

  useEffect(() => {
    api.get("/parametros/impressoras").then(res => {
      const lista = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setImpressorasBot(lista.filter(Boolean).sort());
    }).catch(() => {});
  }, []);

  function iniciarChat() {
    const resina = ctx.resina || "não informada";
    const impressora = ctx.impressora.trim() || "não informada";
    const altura = ctx.altura || "0.05";
    const ctxTexto = resina !== "não informada" || impressora !== "não informada"
      ? `Estou usando a resina **${resina}**, impressora **${impressora}**, altura de camada **${altura}mm**.`
      : "";

    if (mensagens.length > 0) {
      /* Historico ja restaurado — apenas adiciona mensagem de retorno sem apagar */
      const retorno = `Bem-vindo de volta, ${cliente?.nome || ""}! 👋${ctxTexto ? ` Contexto atualizado: ${ctxTexto}` : ""} Continue de onde parou ou me faça uma nova pergunta.`;
      setMensagens(prev => [...prev, { text: retorno, isBot: true }]);
    } else {
      /* Sem historico — cria boas-vindas normal */
      const boasVindas = `Olá ${cliente?.nome || ""}! 👋 Sou o **ELIO**, assistente técnico da Quanton3D.${ctxTexto ? `

Contexto registrado: ${ctxTexto}` : ""}

Como posso te ajudar hoje?`;
      setMensagens([{ text: boasVindas, isBot: true }]);
    }

    setEtapa("chat");
  }

  async function enviar(userMsg) {
    if (!userMsg?.trim() || pensando) return;
    const novasMensagens = [...mensagens, { text: userMsg, isBot: false }];
    setMensagens(novasMensagens);
    setPensando(true);
    try {
      const res = await api.post("/chat", {
        message: userMsg,
        clienteId: cliente?._id || null,
        clienteNome: cliente?.nome || "",
        historico: novasMensagens
          .slice(-10)
          .filter(m => m.text && (m.isBot === true || m.isBot === false))
          .map(m => ({ role: m.isBot ? "assistant" : "user", content: m.text }))
      });
      const reply = res.data.data?.reply || res.data.reply || "Não consegui processar sua dúvida agora.";
      const conversaId = res.data.data?.conversaId || res.data.conversaId || null;
      setMensagens((prev) => [...prev, { text: reply, isBot: true, conversaId }]);
    } catch (err) {
      console.error("Erro ao conversar com bot:", err);
      setMensagens((prev) => [...prev, { text: "Desculpe, tive um problema técnico. Pode repetir?", isBot: true }]);
    } finally { setPensando(false); }
  }

  function fotoParaBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function enviarFeedback(conversaId, indice, satisfatoria) {
    if (!conversaId) return;
    if (satisfatoria) {
      try {
        await api.patch("/conversas/" + conversaId + "/feedback", { feedback: "satisfatoria" });
        setMensagens(prev => prev.map((m, i) => i === indice ? { ...m, feedbackEnviado: "satisfatoria" } : m));
      } catch (_) {}
      return;
    }
    // Não satisfatória — abre form para foto
    setFeedbackAberto(indice);
  }

  async function confirmarFeedbackNegativo(conversaId, indice) {
    setEnviandoFeedback(true);
    try {
      let foto = "";
      if (fotoFeedback) foto = await fotoParaBase64(fotoFeedback);
      const partesConfig = [
        `Resina: ${ctx.resina || "não informada"}`,
        `Impressora: ${ctx.impressora || "não informada"}`,
        `Altura de camada: ${paramsFeedback.alturaCamada || ctx.altura || "0.05"}mm`,
        paramsFeedback.exposicaoNormal && `Exposição normal: ${paramsFeedback.exposicaoNormal}s`,
        paramsFeedback.exposicaoBase && `Exposição base: ${paramsFeedback.exposicaoBase}s`,
        paramsFeedback.camadasBase && `Camadas base: ${paramsFeedback.camadasBase}`,
      ].filter(Boolean);
      const configuracaoCliente = partesConfig.join(" | ");
      await api.patch("/conversas/" + conversaId + "/feedback", { feedback: "nao_satisfatoria", foto, configuracaoCliente });
      setMensagens(prev => prev.map((m, i) => i === indice ? { ...m, feedbackEnviado: "nao_satisfatoria" } : m));
      setFeedbackAberto(null);
      setFotoFeedback(null);
      setParamsFeedback({ alturaCamada: "", exposicaoNormal: "", exposicaoBase: "", camadasBase: "" });
    } catch (err) {
      alert("Não consegui enviar seu feedback agora. Tente novamente.");
    } finally {
      setEnviandoFeedback(false);
    }
  }

  /* Enquanto busca historico, mostra loading neutro */
  if (carregandoHistorico) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "12px", color: "#8ba3be", fontSize: "0.88rem" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid rgba(79,209,255,0.2)", borderTop: "3px solid #4fd1ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span>Carregando seu histórico...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (etapa === "contexto") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%", overflowY: "auto", padding: "8px 4px" }}>
      <div style={{ background: "rgba(79,209,255,0.08)", border: "1px solid rgba(79,209,255,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
        <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#4fd1ff", fontSize: "0.85rem" }}>🤖 ELIO — Assistente Técnico Quanton3D</p>
        <p style={{ margin: 0, color: "#b8cfe8", fontSize: "0.85rem", lineHeight: 1.55 }}>
          Para respostas precisas, informe sua configuração antes de começar. É rápido!
        </p>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#b8cfe8", marginBottom: "6px" }}>
            🧪 Qual resina Quanton3D você está usando?
          </label>
          <select value={ctx.resina} onChange={e => setCtx(c => ({ ...c, resina: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: ctx.resina ? "#ffffff" : "#8ba3be", fontSize: "0.9rem" }}>
            <option value="">Selecione a resina (opcional)</option>
            {RESINAS_BOT.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#b8cfe8", marginBottom: "6px" }}>
            🖨️ Qual sua impressora?
          </label>
          <select value={ctx.impressora} onChange={e => setCtx(c => ({ ...c, impressora: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: ctx.impressora ? "#ffffff" : "#8ba3be", fontSize: "0.9rem" }}>
            <option value="">Selecione a impressora (opcional)</option>
            {impressorasBot.map(i => <option key={i} value={i}>{i}</option>)}
            <option value="Não sei / Outra">Não sei / Outra</option>
          </select>
          {impressorasBot.length === 0 && (
            <input
              value={ctx.impressora}
              onChange={e => setCtx(c => ({ ...c, impressora: e.target.value }))}
              placeholder="Ex: Elegoo Mars 4 Ultra, Anycubic Photon M3..."
              style={{ width: "100%", marginTop: "8px", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.9rem" }}
            />
          )}
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#b8cfe8", marginBottom: "6px" }}>
            📏 Altura de camada que está usando
          </label>
          <select value={ctx.altura} onChange={e => setCtx(c => ({ ...c, altura: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(79,209,255,0.25)", background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.9rem" }}>
            <option value="0.01">0.01mm — máxima resolução</option>
            <option value="0.02">0.02mm — alta resolução</option>
            <option value="0.03">0.03mm — alta resolução</option>
            <option value="0.04">0.04mm — resolução média-alta</option>
            <option value="0.05">0.05mm — padrão recomendado</option>
            <option value="0.06">0.06mm — padrão</option>
            <option value="0.08">0.08mm — rápido</option>
            <option value="0.10">0.10mm — máxima velocidade</option>
          </select>
        </div>
      </div>

      <button type="button" onClick={iniciarChat}
        style={{ width: "100%", marginTop: "18px", padding: "14px", borderRadius: "12px", border: 0, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#ffffff", fontWeight: 900, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
        Iniciar atendimento com o ELIO →
      </button>

      <button type="button" onClick={iniciarChat}
        style={{ width: "100%", marginTop: "8px", padding: "10px", borderRadius: "10px", border: "1px solid rgba(113,159,219,0.2)", background: "transparent", color: "#8ba3be", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}>
        Pular e começar sem informar configuração
      </button>
    </div>
  );

  return (
    <div className="bot-chat-container" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%" }}>
      {(ctx.resina || ctx.impressora) && (
        <div style={{ padding: "8px 14px", background: "rgba(79,209,255,0.06)", borderBottom: "1px solid rgba(79,209,255,0.15)", fontSize: "0.78rem", color: "#8ba3be", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {ctx.resina && <span>🧪 {ctx.resina}</span>}
          {ctx.impressora && <span>🖨️ {ctx.impressora}</span>}
          {ctx.altura && <span>📏 {ctx.altura}mm</span>}
          <button type="button" onClick={() => setEtapa("contexto")} style={{ marginLeft: "auto", color: "#4fd1ff", background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>Alterar</button>
        </div>
      )}
      <div className="chat-messages" ref={scrollRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", scrollBehavior: "smooth", transform: "translateZ(0)", WebkitTransform: "translateZ(0)" }}>
        {mensagens.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.isBot ? "flex-start" : "flex-end", width: "100%", boxSizing: "border-box" }}>
            <div
              style={{ padding: "10px 14px", borderRadius: m.isBot ? "4px 18px 18px 18px" : "18px 4px 18px 18px", background: m.isBot ? "rgba(26,115,232,0.18)" : "rgba(79,209,255,0.18)", border: m.isBot ? "1px solid rgba(26,115,232,0.35)" : "1px solid rgba(79,209,255,0.35)", color: "#eaf3ff", fontSize: "0.92rem", lineHeight: 1.55, maxWidth: "85%", wordBreak: "break-word", overflowWrap: "break-word", boxSizing: "border-box" }}
              dangerouslySetInnerHTML={{ __html: `<p style="margin:0">${formatarMarkdown(m.text)}</p>` }}
            />

            {/* Feedback — só em respostas do bot que vieram do /chat (têm conversaId) */}
            {m.isBot && m.conversaId && !m.feedbackEnviado && feedbackAberto !== i && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", padding: "0 4px" }}>
                <span style={{ fontSize: "0.72rem", color: "#8ba3be" }}>Essa resposta ajudou?</span>
                <button type="button" onClick={() => enviarFeedback(m.conversaId, i, true)}
                  style={{ padding: "3px 10px", borderRadius: "999px", border: "1px solid rgba(73,230,139,0.3)", background: "rgba(73,230,139,0.08)", color: "#49e68b", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                  👍 Sim
                </button>
                <button type="button" onClick={() => enviarFeedback(m.conversaId, i, false)}
                  style={{ padding: "3px 10px", borderRadius: "999px", border: "1px solid rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.06)", color: "#ff8fab", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                  👎 Não
                </button>
              </div>
            )}

            {/* Form de feedback negativo — configurações estilo Chitubox + foto + envio */}
            {m.isBot && feedbackAberto === i && (
              <div style={{ marginTop: "8px", padding: "12px", borderRadius: "10px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)", width: "100%", maxWidth: "360px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#ff8fab", fontWeight: 700 }}>
                  Poxa, desculpa! Confirma as configurações que está usando (o que souber) e manda uma foto do problema:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block", marginBottom: "3px" }}>Altura de camada</label>
                    <input value={paramsFeedback.alturaCamada} onChange={e => setParamsFeedback(p => ({ ...p, alturaCamada: e.target.value }))}
                      placeholder={ctx.altura ? ctx.altura + "mm" : "Ex: 0.05mm"}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "7px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.78rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block", marginBottom: "3px" }}>Camadas base</label>
                    <input value={paramsFeedback.camadasBase} onChange={e => setParamsFeedback(p => ({ ...p, camadasBase: e.target.value }))}
                      placeholder="Ex: 6"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "7px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.78rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block", marginBottom: "3px" }}>Exposição normal (s)</label>
                    <input value={paramsFeedback.exposicaoNormal} onChange={e => setParamsFeedback(p => ({ ...p, exposicaoNormal: e.target.value }))}
                      placeholder="Ex: 2.1"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "7px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.78rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "#9fb4c7", display: "block", marginBottom: "3px" }}>Exposição base (s)</label>
                    <input value={paramsFeedback.exposicaoBase} onChange={e => setParamsFeedback(p => ({ ...p, exposicaoBase: e.target.value }))}
                      placeholder="Ex: 35"
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "7px", border: "1px solid rgba(255,107,107,0.25)", background: "rgba(4,10,24,0.7)", color: "#fff", fontSize: "0.78rem" }} />
                  </div>
                </div>

                <label style={{ display: "block", padding: "10px", borderRadius: "8px", border: "1px dashed rgba(255,107,107,0.3)", background: "rgba(0,0,0,0.2)", cursor: "pointer", textAlign: "center", marginBottom: "8px" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setFotoFeedback(e.target.files?.[0] || null)} />
                  <span style={{ fontSize: "0.75rem", color: fotoFeedback ? "#49e68b" : "#9fb4c7" }}>
                    {fotoFeedback ? "✅ " + fotoFeedback.name : "📷 Anexar foto (opcional)"}
                  </span>
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button type="button" onClick={() => confirmarFeedbackNegativo(m.conversaId, i)} disabled={enviandoFeedback}
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", border: 0, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", fontWeight: 800, fontSize: "0.78rem", cursor: "pointer" }}>
                    {enviandoFeedback ? "Enviando..." : "Enviar para análise"}
                  </button>
                  <button type="button" onClick={() => { setFeedbackAberto(null); setFotoFeedback(null); setParamsFeedback({ alturaCamada: "", exposicaoNormal: "", exposicaoBase: "", camadasBase: "" }); }}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#8ba3be", fontSize: "0.78rem", cursor: "pointer" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Confirmação de feedback enviado */}
            {m.isBot && m.feedbackEnviado && (
              <span style={{ marginTop: "6px", fontSize: "0.72rem", color: m.feedbackEnviado === "satisfatoria" ? "#49e68b" : "#ffd166" }}>
                {m.feedbackEnviado === "satisfatoria" ? "✅ Obrigado pelo retorno!" : "📨 Enviado para a equipe analisar. Obrigado!"}
              </span>
            )}
          </div>
        ))}
        {pensando && <div style={{ alignSelf: "flex-start", padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: "rgba(26,115,232,0.12)", border: "1px solid rgba(26,115,232,0.25)", color: "#9fb4c7", fontSize: "0.88rem" }}>⏳ Analisando base técnica...</div>}
      </div>
      <ChatInput onEnviar={enviar} pensando={pensando} />
    </div>
  );
}

// Componente separado — input isolado do resto do chat
// Assim digitar NÃO causa re-render das mensagens
const ChatInput = React.memo(function ChatInput({ onEnviar, pensando }) {
  const [valor, setValor] = useState("");
  function handleEnviar() {
    if (!valor.trim() || pensando) return;
    onEnviar(valor);
    setValor("");
  }
  return (
    <div style={{ display: "flex", gap: "10px", padding: "12px 16px", borderTop: "1px solid rgba(113,159,219,0.2)", flexShrink: 0, position: "sticky", bottom: 0, background: "rgba(6,13,31,0.98)", zIndex: 10 }}>
      <input
        value={valor}
        onChange={e => setValor(e.target.value)}
        onKeyPress={e => e.key === "Enter" && handleEnviar()}
        placeholder="Tire sua dúvida técnica..."
        style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(79,209,255,0.25)", borderRadius: "12px", padding: "10px 14px", color: "#eaf3ff", fontFamily: "inherit", fontSize: "0.9rem", outline: "none" }}
      />
      <button type="button" onClick={handleEnviar} disabled={pensando}
        style={{ whiteSpace: "nowrap", padding: "10px 18px", borderRadius: "10px", border: 0, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>
        {pensando ? "..." : "Enviar"}
      </button>
    </div>
  );
});

function ParamItem({ label, value }) {
  return <div className="param-item"><span>{label}</span><strong>{value || "-"}</strong></div>;
}

function InfoCard({ title, text, onClick }) {
  return (
    <button type="button" className="info-card clickable-card" onClick={onClick}>
      <h3>{title}</h3><p>{text}</p>
    </button>
  );
}

function ServiceLine({ title, onClick }) {
  return (
    <button type="button" className="service-line" onClick={onClick}>
      <span>✓</span><strong>{title}</strong>
    </button>
  );
}



export default BotContent;
