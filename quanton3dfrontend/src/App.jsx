import React, { useState, useEffect, useRef } from "react";
import api from "./api";
import "./App.css";
import ContactMessageModal from "./components/ContactMessageModal";
import PartnerRequestModal from "./components/PartnerRequestModal";
import CalculadoraExposicao from "./components/CalculadoraExposicao";
import CalculadoraVolume from "./components/CalculadoraVolume";
import CalculadoraTolerancia from "./components/CalculadoraTolerancia";

const WHATSAPP_URL = "https://wa.me/553132716935";
const SOCIAL_LINKS = [
  { label: "Instagram", url: "https://www.instagram.com/quanton3d" },
  { label: "YouTube", url: "https://www.youtube.com/@quanton3d" },
  { label: "TikTok", url: "https://www.tiktok.com/@quanton3d" },
  { label: "Facebook", url: "https://www.facebook.com/quanton3d" },
  { label: "Site", url: "https://www.quanton3d.com.br" },
  { label: "Mercado Livre", url: "https://www.mercadolivre.com.br/loja/quanton-3d?item_id=MLB5481847898&category_id=MLB1648&official_store_id=152142&client=recoview-selleritems&recos_listing=true" },
];

const ORIGENS = [
  "Instagram",
  "YouTube",
  "Google / Pesquisa",
  "Indicação de amigo",
  "Mercado Livre / Shopee",
  "Já sou cliente",
  "Outros",
];

const SERVICE_BUTTONS = [
  { label: "FALE CONOSCO", kind: "modal", id: "contato" },
  { label: "SAIBA MAIS", kind: "modal", id: "sobre" },
  { label: "FORMULAÇÃO PERSONALIZADA", kind: "modal", id: "formulacao" },
  { label: "NIVELAMENTO DE PLATAFORMA", kind: "guide", id: "nivelamento" },
  { label: "CONFIGURAÇÃO DE FATIADOR", kind: "guide", id: "fatiadores" },
  { label: "ATENDIMENTO PRIORITÁRIO", kind: "whatsapp" },
  { label: "CALIBRAÇÃO DE RESINA", kind: "guide", id: "calibracao" },
  { label: "GABARITO QUANTON3D", kind: "guide", id: "calibracaoQuanton3D" },
  { label: "DIAGNÓSTICO DE FALHAS", kind: "guide", id: "diagnostico" },
  { label: "SUPORTES E POSICIONAMENTO", kind: "guide", id: "suportes" },
  { label: "MANUTENÇÃO DE MÁQUINA", kind: "guide", id: "manutencao" },
  { label: "OTIMIZAÇÃO DE PARÂMETROS", kind: "guide", id: "otimizacao" },
  { label: "CHAMADAS DE VÍDEO", kind: "whatsapp" },
];


function getClienteSalvo() {
  try {
    const salvo = localStorage.getItem("quanton3d_cliente");
    return salvo ? JSON.parse(salvo) : null;
  } catch (err) {
    return null;
  }
}

function App() {
  const [activeModal, setActiveModal] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null);
  const [cliente, setCliente] = useState(getClienteSalvo());
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showContactMessageModal, setShowContactMessageModal] = useState(false);

  useEffect(() => {
    if (cliente) {
      localStorage.setItem("quanton3d_cliente", JSON.stringify(cliente));
    }
  }, [cliente]);

  const fecharModal = () => setActiveModal(null);
  const fecharGuia = () => setActiveGuide(null);

  const abrirGuia = (id) => {
    setActiveGuide(id);
    setActiveModal(null);
  };

  const handleRegistrationSuccess = (dadosCliente) => {
    setCliente(dadosCliente);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
          <img src="/logo.png" alt="Quanton3D" className="logo" />
          <h1>Central de Suporte Técnico</h1>
        </div>
      </header>

      <main className="main-content">
        <section className="services-section">
          <h2>Como podemos ajudar hoje?</h2>
          <div className="services-grid">
            {SERVICE_BUTTONS.map((btn, index) => {
              if (btn.kind === "modal") {
                return (
                  <button key={index} type="button" onClick={() => setActiveModal(btn.id)}>
                    {btn.label}
                  </button>
                );
              }
              if (btn.kind === "guide") {
                return (
                  <button key={index} type="button" onClick={() => setActiveGuide(btn.id)}>
                    {btn.label}
                  </button>
                );
              }
              if (btn.kind === "whatsapp") {
                return (
                  <a key={index} href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="whatsapp-link">
                    {btn.label}
                  </a>
                );
              }
              return null;
            })}
          </div>
        </section>

        <section className="calculators-section">
          <h2>Calculadoras Técnicas</h2>
          <div className="selector-grid">
            <div className="field clickable-card" onClick={() => setActiveModal("calc_exp")}>
              <span>Calculadora de Exposição</span>
              <p>Ajuste o tempo de cura por camada.</p>
            </div>
            <div className="field clickable-card" onClick={() => setActiveModal("calc_vol")}>
              <span>Calculadora de Volume</span>
              <p>Estime o consumo de resina do projeto.</p>
            </div>
            <div className="field clickable-card" onClick={() => setActiveModal("calc_tolerancia")}>
              <span>Compensação de Tolerância</span>
              <p>Ajuste X/Y Offset para encaixes perfeitos.</p>
            </div>
          </div>
        </section>

        <section className="social-section">
          <h2>Siga a Quanton3D</h2>
          <div className="social-grid">
            {SOCIAL_LINKS.map((link, index) => (
              <a key={index} href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </main>

      {activeModal && (
        <Modal
          type={activeModal}
          onClose={fecharModal}
          cliente={cliente}
          onRegistrationSuccess={handleRegistrationSuccess}
          abrirGuia={abrirGuia}
          abrirParceiroModal={() => setShowPartnerModal(true)}
        />
      )}

      {activeGuide && <Guide id={activeGuide} onClose={fecharGuia} />}

      {showPartnerModal && <PartnerRequestModal onClose={() => setShowPartnerModal(false)} />}
      {showContactMessageModal && <ContactMessageModal onClose={() => setShowContactMessageModal(false)} />}

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Quanton3D. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function Modal({ type, onClose, cliente, onRegistrationSuccess, abrirGuia, abrirParceiroModal }) {
  const titles = {
    contato: "Fale Conosco",
    sobre: "Sobre a Quanton3D",
    formulacao: "Formulação Personalizada",
    calc_exp: "Calculadora de Exposição",
    calc_vol: "Calculadora de Volume",
    calc_tolerancia: "Compensação de Tolerância",
    bot: "Assistente Técnico Quanton3D",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{titles[type] || "Informação"}</h2>
          <button type="button" className="close-button" onClick={onClose}>&times;</button>
        </header>
        <section className="modal-body">
          {!cliente && type !== "sobre" && type !== "contato" && (
            <RegistrationForm onFocus={() => {}} onSuccess={onRegistrationSuccess} />
          )}
          {(cliente || type === "sobre" || type === "contato") && (
            <>
              {type === "contato" && <ContatoContent />}
              {type === "sobre" && <SobreContent abrirGuia={abrirGuia} abrirParceiroModal={abrirParceiroModal} />}
              {type === "formulacao" && <FormulacaoContent cliente={cliente} />}
              {type === "calc_exp" && <CalculadoraExposicao />}
              {type === "calc_vol" && <CalculadoraVolume />}
              {type === "calc_tolerancia" && <CalculadoraTolerancia />}
              {type === "bot" && <BotContent cliente={cliente} />}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ContatoContent() {
  return (
    <div className="modal-rich-content">
      <p>Escolha uma forma de atendimento especializado.</p>
      <div className="modal-action-grid">
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="mailto:atendimento@quanton3d.com.br">E-mail</a>
      </div>
    </div>
  );
}

function SobreContent({ abrirGuia, abrirParceiroModal }) {
  return (
    <div className="modal-rich-content">
      <p>A Quanton3D é especialista em resinas UV de alta performance.</p>
      <div className="modal-action-grid">
        <button type="button" onClick={() => abrirGuia("parceiros")}>Ver parceiros</button>
        <button type="button" onClick={() => abrirGuia("diagnostico")}>Guia de diagnóstico</button>
        <button type="button" onClick={abrirParceiroModal}>Quero ser parceiro</button>
      </div>
    </div>
  );
}

function FormulacaoContent({ cliente }) {
  const [form, setForm] = useState({ caracteristica: "", cor: "", detalhes: "" });
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Enviando...");
    try {
      await api.post("/formulacao", { ...form, clienteId: cliente.id });
      setStatus("Solicitação enviada com sucesso! Entraremos em contato.");
    } catch (err) {
      setStatus("Erro ao enviar solicitação. Tente novamente mais tarde.");
    }
  };

  return (
    <form className="modal-rich-content" onSubmit={handleSubmit}>
      <p>Solicite uma fórmula personalizada para sua necessidade específica.</p>
      <label>
        <span>Característica principal (ex: Flexível, Rígida, Calcinável)</span>
        <input
          type="text"
          required
          value={form.caracteristica}
          onChange={(e) => setForm({ ...form, caracteristica: e.target.value })}
        />
      </label>
      <label>
        <span>Cor desejada</span>
        <input
          type="text"
          required
          value={form.cor}
          onChange={(e) => setForm({ ...form, cor: e.target.value })}
        />
      </label>
      <label>
        <span>Detalhes adicionais</span>
        <textarea
          value={form.detalhes}
          onChange={(e) => setForm({ ...form, detalhes: e.target.value })}
        />
      </label>
      <button type="submit" className="submit-registration">Enviar Solicitação</button>
      {status && <p className="status-message">{status}</p>}
    </form>
  );
}

function RegistrationForm({ onSuccess }) {
  const [dados, setDados] = useState({ nome: "", whatsapp: "", origem: "" });
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dados.nome || !dados.whatsapp || !dados.origem) {
      setErro("Por favor, preencha todos os campos.");
      return;
    }
    try {
      const res = await api.post("/clientes", dados);
      onSuccess(res.data);
    } catch (err) {
      setErro("Erro ao realizar cadastro. Tente novamente.");
    }
  };

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      <h3>Identifique-se para continuar</h3>
      <p>Precisamos desses dados para salvar suas preferências e histórico.</p>
      <label>
        <span>Nome Completo</span>
        <input
          type="text"
          required
          value={dados.nome}
          onChange={(e) => setDados({ ...dados, nome: e.target.value })}
        />
      </label>
      <label>
        <span>WhatsApp (com DDD)</span>
        <input
          type="text"
          required
          placeholder="Ex: 31988887777"
          value={dados.whatsapp}
          onChange={(e) => setDados({ ...dados, whatsapp: e.target.value })}
        />
      </label>
      <label>
        <span>Como nos conheceu?</span>
        <select
          required
          value={dados.origem}
          onChange={(e) => setDados({ ...dados, origem: e.target.value })}
        >
          <option value="">Selecione uma opção</option>
          {ORIGENS.map((o, i) => (
            <option key={i} value={o}>{o}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="submit-registration">Começar Agora</button>
      {erro && <p className="modal-error">{erro}</p>}
    </form>
  );
}

function BotContent({ cliente }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Olá ${cliente.nome.split(" ")[0]}, sou o assistente técnico da Quanton3D. Como posso te ajudar com suas impressões hoje?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat", { message: input, clienteId: cliente.id });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Desculpe, tive um problema técnico. Pode repetir?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bot-container">
      <div className="chat-window" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <div className="bubble">{m.content}</div>
          </div>
        ))}
        {loading && <div className="message assistant"><div className="bubble typing">...</div></div>}
      </div>
      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Digite sua dúvida técnica..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>Enviar</button>
      </form>
    </div>
  );
}

function Guide({ id, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Guia Técnico</h2>
          <button type="button" className="close-button" onClick={onClose}>&times;</button>
        </header>
        <section className="modal-body">
          <p>Conteúdo do guia {id} em desenvolvimento.</p>
        </section>
      </div>
    </div>
  );
}

export default App;
