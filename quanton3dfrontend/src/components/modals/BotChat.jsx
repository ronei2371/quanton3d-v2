import React, { useEffect, useRef, useState } from "react";
import { Send, ThumbsUp, ThumbsDown, Camera, ArrowRight, SkipForward } from "lucide-react";
import api from "../../lib/api";

const RESINAS_BOT = [
  "ALCHEMIST", "IRON", "IRON 70/30", "FLEXFORM", "ATHOM DENTAL", "ATHOM ALINHADORES",
  "ATHOM WASHABLE", "POSEIDON", "PYROBLAST", "VULCAN CAST", "SPIN", "SPARK", "LOW SMELL", "VELVET SKIN", "Não sei / Outra",
];

function escaparHtml(texto) {
  const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return texto.replace(/[&<>"']/g, (c) => mapa[c]);
}
function formatarMarkdown(texto) {
  const seguro = escaparHtml(texto);
  return seguro
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style=\"background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:0.88em\">$1</code>")
    .replace(/\n{2,}/g, "</p><p style=\"margin:8px 0\">")
    .replace(/\n/g, "<br/>");
}

const ChatInput = React.memo(function ChatInput({ onEnviar, pensando }) {
  const [valor, setValor] = useState("");
  function handleEnviar() {
    if (!valor.trim() || pensando) return;
    onEnviar(valor);
    setValor("");
  }
  return (
    <div style={{ display: "flex", gap: "8px", padding: "12px 4px 4px", borderTop: "1px solid var(--border-soft)", flexShrink: 0, width: "100%", minWidth: 0, boxSizing: "border-box" }}>
      <input
        className="q-input"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
        placeholder="Tire sua dúvida técnica..."
        style={{ flex: 1, minWidth: 0 }}
      />
      <button type="button" className="q-btn q-btn--primary" onClick={handleEnviar} disabled={pensando} style={{ flexShrink: 0 }}>
        <Send size={15} />
      </button>
    </div>
  );
});

function BotChat({ cliente }) {
  const [etapa, setEtapa] = useState("contexto");
  const [ctx, setCtx] = useState({ resina: "", impressora: "", altura: "0.05" });
  const [mensagens, setMensagens] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [impressorasBot, setImpressorasBot] = useState([]);
  const [feedbackAberto, setFeedbackAberto] = useState(null);
  const [fotoFeedback, setFotoFeedback] = useState(null);
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [erroFeedback, setErroFeedback] = useState("");
  const [paramsFeedback, setParamsFeedback] = useState({ alturaCamada: "", exposicaoNormal: "", exposicaoBase: "", camadasBase: "" });
  const scrollRef = useRef(null);

  useEffect(() => {
    const clienteId = cliente?._id || cliente?.id;
    if (!clienteId) return;

    let ativo = true;
    setCarregandoHistorico(true);
    api.get(`/chat/historico/${encodeURIComponent(clienteId)}`)
      .then((res) => {
        if (!ativo) return;
        const conversas = Array.isArray(res.data?.conversas) ? res.data.conversas : [];
        if (!conversas.length) return;

        const restauradas = conversas.flatMap((conversa) => [
          { text: conversa.pergunta, isBot: false },
          { text: conversa.resposta, isBot: true, conversaId: conversa._id },
        ]).filter((mensagem) => mensagem.text);
        const ultima = conversas[conversas.length - 1];
        setCtx((atual) => ({
          ...atual,
          resina: atual.resina || ultima.resinaDetectada || "",
          impressora: atual.impressora || ultima.impressoraDetectada || "",
        }));
        setMensagens([
          { text: `Bem-vindo de volta, ${cliente?.nome || ""}! Aqui está seu histórico com a IAQ3D. Pode continuar de onde parou.`, isBot: true },
          ...restauradas,
        ]);
        setEtapa("chat");
      })
      .catch(() => {})
      .finally(() => { if (ativo) setCarregandoHistorico(false); });

    return () => { ativo = false; };
  }, [cliente?._id, cliente?.id, cliente?.nome]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [mensagens]);

  useEffect(() => {
    api.get("/parametros/impressoras").then((res) => {
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
    const boasVindas = `Olá ${cliente?.nome || ""}! Sou a **IAQ3D**, assistente técnica da Quanton3D.${ctxTexto ? `\n\nContexto registrado: ${ctxTexto}` : ""}\n\nComo posso te ajudar hoje?`;
    setMensagens((atuais) => atuais.length
      ? [...atuais, { text: `Contexto atualizado. ${ctxTexto || "Pode continuar de onde parou."}`, isBot: true }]
      : [{ text: boasVindas, isBot: true }]);
    setEtapa("chat");
  }

  async function enviar(userMsg) {
    if (!userMsg?.trim() || pensando) return;
    const novasMensagens = [...mensagens, { text: userMsg, isBot: false }];
    setMensagens(novasMensagens);
    setPensando(true);
    try {
      const ctxMsg = ctx.resina || ctx.impressora
        ? [{ role: "user", content: `Contexto: resina ${ctx.resina || "não informada"}, impressora ${ctx.impressora || "não informada"}, altura camada ${ctx.altura || "0.05"}mm` },
           { role: "assistant", content: "Contexto registrado. Pode me contar o problema." }]
        : [];
      const historico = [
        ...ctxMsg,
        ...novasMensagens.slice(-8).filter((m) => m.text).map((m) => ({ role: m.isBot ? "assistant" : "user", content: m.text })),
      ];
      const res = await api.post("/chat", { message: userMsg, historico, clienteId: cliente?._id, clienteNome: cliente?.nome || "" });
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
        setMensagens((prev) => prev.map((m, i) => (i === indice ? { ...m, feedbackEnviado: "satisfatoria" } : m)));
      } catch { /* O feedback é opcional e não deve interromper o chat. */ }
      return;
    }
    setFeedbackAberto(indice);
  }

  async function confirmarFeedbackNegativo(conversaId, indice) {
    setEnviandoFeedback(true);
    setErroFeedback("");
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
      await api.patch("/conversas/" + conversaId + "/feedback", { feedback: "nao_satisfatoria", foto, configuracaoCliente: partesConfig.join(" | ") });
      setMensagens((prev) => prev.map((m, i) => (i === indice ? { ...m, feedbackEnviado: "nao_satisfatoria" } : m)));
      setFeedbackAberto(null);
      setFotoFeedback(null);
      setParamsFeedback({ alturaCamada: "", exposicaoNormal: "", exposicaoBase: "", camadasBase: "" });
    } catch {
      setErroFeedback("Não consegui enviar seu feedback agora. Tente novamente.");
    } finally { setEnviandoFeedback(false); }
  }

  if (carregandoHistorico) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text-muted)", fontSize: "0.86rem" }}>
      Carregando seu histórico...
    </div>
  );

  if (etapa === "contexto") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflowY: "auto", padding: "4px" }}>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "18px" }}>
        Para respostas precisas, informe sua configuração antes de começar. É rápido — ou pule direto pro chat.
      </p>

      <div style={{ display: "grid", gap: "14px" }}>
        <label className="q-field">
          <span>Resina Quanton3D</span>
          <select className="q-select" value={ctx.resina} onChange={(e) => setCtx((c) => ({ ...c, resina: e.target.value }))}>
            <option value="">Selecione a resina (opcional)</option>
            {RESINAS_BOT.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <label className="q-field">
          <span>Impressora</span>
          {impressorasBot.length > 0 ? (
            <select className="q-select" value={ctx.impressora} onChange={(e) => setCtx((c) => ({ ...c, impressora: e.target.value }))}>
              <option value="">Selecione a impressora (opcional)</option>
              {impressorasBot.map((i) => <option key={i} value={i}>{i}</option>)}
              <option value="Não sei / Outra">Não sei / Outra</option>
            </select>
          ) : (
            <input className="q-input" value={ctx.impressora} onChange={(e) => setCtx((c) => ({ ...c, impressora: e.target.value }))} placeholder="Ex: Elegoo Mars 4 Ultra, Anycubic Photon M3..." />
          )}
        </label>

        <label className="q-field">
          <span>Altura de camada que está usando</span>
          <select className="q-select" value={ctx.altura} onChange={(e) => setCtx((c) => ({ ...c, altura: e.target.value }))}>
            <option value="0.01">0.01mm — máxima resolução</option>
            <option value="0.02">0.02mm — alta resolução</option>
            <option value="0.03">0.03mm — alta resolução</option>
            <option value="0.04">0.04mm — resolução média-alta</option>
            <option value="0.05">0.05mm — padrão recomendado</option>
            <option value="0.06">0.06mm — padrão</option>
            <option value="0.08">0.08mm — rápido</option>
            <option value="0.10">0.10mm — máxima velocidade</option>
          </select>
        </label>
      </div>

      <button type="button" className="q-btn q-btn--primary q-btn--block" style={{ marginTop: "20px" }} onClick={iniciarChat}>
        Iniciar atendimento com a IAQ3D <ArrowRight size={15} />
      </button>
      <button type="button" className="q-btn q-btn--ghost q-btn--block" style={{ marginTop: "8px" }} onClick={iniciarChat}>
        <SkipForward size={14} /> Pular e começar sem informar configuração
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0, width: "100%", overflow: "hidden" }}>
      {(ctx.resina || ctx.impressora) && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", padding: "8px 4px", borderBottom: "1px solid var(--border-soft)", fontSize: "0.76rem", color: "var(--text-muted)" }}>
          {ctx.resina && <span>{ctx.resina}</span>}
          {ctx.impressora && <span>{ctx.impressora}</span>}
          {ctx.altura && <span>{ctx.altura}mm</span>}
          <button type="button" onClick={() => setEtapa("contexto")} style={{ marginLeft: "auto", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontSize: "0.76rem", fontWeight: 700 }}>Alterar</button>
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%", minWidth: 0, boxSizing: "border-box", padding: "14px 6px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {mensagens.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.isBot ? "flex-start" : "flex-end", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
            <div
              style={{ padding: "10px 14px", borderRadius: "var(--r-md)", background: m.isBot ? "var(--bg-raised)" : "rgba(47,123,255,0.12)", border: "1px solid " + (m.isBot ? "var(--border-soft)" : "rgba(47,123,255,0.3)"), color: "var(--text-primary)", fontSize: "0.9rem", lineHeight: 1.55, maxWidth: "min(88%, 640px)", boxSizing: "border-box", overflowWrap: "anywhere", wordBreak: "normal" }}
              dangerouslySetInnerHTML={{ __html: `<p style="margin:0">${formatarMarkdown(m.text)}</p>` }}
            />

            {m.isBot && m.conversaId && !m.feedbackEnviado && feedbackAberto !== i && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", padding: "0 2px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Essa resposta ajudou?</span>
                <button type="button" onClick={() => enviarFeedback(m.conversaId, i, true)} className="q-btn q-btn--sm q-btn--success">
                  <ThumbsUp size={12} />
                </button>
                <button type="button" onClick={() => enviarFeedback(m.conversaId, i, false)} className="q-btn q-btn--sm q-btn--danger">
                  <ThumbsDown size={12} />
                </button>
              </div>
            )}

            {m.isBot && feedbackAberto === i && (
              <div style={{ marginTop: "8px", padding: "12px", borderRadius: "var(--r-md)", background: "var(--bg-raised)", border: "1px solid var(--border-soft)", width: "100%", maxWidth: "360px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Confirma as configurações que está usando (o que souber) e manda uma foto do problema:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                  <input className="q-input" value={paramsFeedback.alturaCamada} onChange={(e) => setParamsFeedback((p) => ({ ...p, alturaCamada: e.target.value }))} placeholder={ctx.altura ? ctx.altura + "mm" : "Altura de camada"} style={{ fontSize: "0.78rem", padding: "7px 9px" }} />
                  <input className="q-input" value={paramsFeedback.camadasBase} onChange={(e) => setParamsFeedback((p) => ({ ...p, camadasBase: e.target.value }))} placeholder="Camadas base" style={{ fontSize: "0.78rem", padding: "7px 9px" }} />
                  <input className="q-input" value={paramsFeedback.exposicaoNormal} onChange={(e) => setParamsFeedback((p) => ({ ...p, exposicaoNormal: e.target.value }))} placeholder="Exposição normal (s)" style={{ fontSize: "0.78rem", padding: "7px 9px" }} />
                  <input className="q-input" value={paramsFeedback.exposicaoBase} onChange={(e) => setParamsFeedback((p) => ({ ...p, exposicaoBase: e.target.value }))} placeholder="Exposição base (s)" style={{ fontSize: "0.78rem", padding: "7px 9px" }} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px", borderRadius: "var(--r-sm)", border: "1px dashed var(--border-soft)", cursor: "pointer", marginBottom: "8px", fontSize: "0.76rem", color: fotoFeedback ? "var(--q-verde)" : "var(--text-muted)" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setFotoFeedback(e.target.files?.[0] || null)} />
                  <Camera size={13} /> {fotoFeedback ? fotoFeedback.name : "Anexar foto (opcional)"}
                </label>
                {erroFeedback && <div className="q-alert q-alert--error" style={{ marginBottom: "8px", fontSize: "0.76rem", padding: "8px 11px" }}>{erroFeedback}</div>}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button type="button" className="q-btn q-btn--primary q-btn--sm" onClick={() => confirmarFeedbackNegativo(m.conversaId, i)} disabled={enviandoFeedback} style={{ flex: 1 }}>
                    {enviandoFeedback ? "Enviando..." : "Enviar para análise"}
                  </button>
                  <button type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={() => { setFeedbackAberto(null); setFotoFeedback(null); setParamsFeedback({ alturaCamada: "", exposicaoNormal: "", exposicaoBase: "", camadasBase: "" }); }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {m.isBot && m.feedbackEnviado && (
              <span style={{ marginTop: "6px", fontSize: "0.72rem", color: m.feedbackEnviado === "satisfatoria" ? "var(--q-verde)" : "var(--q-laranja)" }}>
                {m.feedbackEnviado === "satisfatoria" ? "Obrigado pelo retorno!" : "Enviado para a equipe analisar. Obrigado!"}
              </span>
            )}
          </div>
        ))}
        {pensando && <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "var(--r-md)", background: "var(--bg-raised)", border: "1px solid var(--border-soft)", color: "var(--text-muted)", fontSize: "0.86rem" }}>Analisando base técnica...</div>}
      </div>

      <ChatInput onEnviar={enviar} pensando={pensando} />
    </div>
  );
}

export default BotChat;
