import { useEffect, useRef, useState } from "react";
import api from "../api";

export default function BotContent({ cliente }) {
  const [mensagens, setMensagens] = useState([{ text: `Olá ${cliente?.nome || ""}, sou o assistente técnico da Quanton3D. Como posso te ajudar hoje?`, isBot: true }]);
  const [input, setInput] = useState("");
  const [pensando, setPensando] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensagens]);

  async function enviar() {
    if (!input.trim() || pensando) return;
    const userMsg = input;
    setInput("");
    setMensagens(prev => [...prev, { text: userMsg, isBot: false }]);
    setPensando(true);
    try {
      const res = await api.post("/chat", { message: userMsg, clienteId: cliente?._id });
      const respostaBot = res.data?.reply || res.data?.data?.reply || "Não consegui responder agora.";
      setMensagens(prev => [...prev, { text: respostaBot, isBot: true }]);
    } catch (err) {
      console.error("Erro ao conversar com bot:", err);
      setMensagens(prev => [...prev, { text: "Desculpe, tive um problema técnico. Pode repetir?", isBot: true }]);
    } finally {
      setPensando(false);
    }
  }

  return (
    <div className="bot-chat-container">
      <div className="chat-messages" ref={scrollRef}>
        {mensagens.map((m, i) => (
          <div key={i} className={`message-bubble ${m.isBot ? "bot" : "user"}`}>{m.text}</div>
        ))}
        {pensando && <div className="message-bubble bot thinking">Analisando base técnica...</div>}
      </div>
      <div className="chat-input-row">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()} placeholder="Tire sua dúvida técnica..." />
        <button onClick={enviar} disabled={pensando}>Enviar</button>
      </div>
    </div>
  );
}
