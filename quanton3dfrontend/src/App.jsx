import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";
import ContactMessageModal from "./components/ContactMessageModal";
import PartnerRequestModal from "./components/PartnerRequestModal";
import CalculadoraExposicao from "./components/CalculadoraExposicao";
import CalculadoraVolume from "./components/CalculadoraVolume";

const WHATSAPP_URL = "https://wa.me/553183340053";

const ORIGENS = ["Instagram", "YouTube", "Indicação", "Google", "Outros"];

const SERVICE_BUTTONS = [
  { label: "FALE CONOSCO", kind: "modal", id: "contato" },
  { label: "SAIBA MAIS", kind: "modal", id: "sobre" },
  { label: "FORMULAÇÃO PERSONALIZADA", kind: "modal", id: "formulacao" },
  { label: "NIVELAMENTO DE PLATAFORMA", kind: "guide", id: "nivelamento" },
  { label: "CONFIGURAÇÃO DE FATIADOR", kind: "guide", id: "fatiadores" },
  { label: "ATENDIMENTO PRIORITÁRIO", kind: "whatsapp" },
  { label: "CALIBRAÇÃO DE RESINA", kind: "guide", id: "calibracao" },
  { label: "MANUTENÇÃO DE MÁQUINA", kind: "guide", id: "manutencao" },
  { label: "OTIMIZAÇÃO DE PARÂMETROS", kind: "guide", id: "otimizacao" },
  { label: "CHAMADAS DE VÍDEO", kind: "whatsapp" },
];

const GUIDES = {
  nivelamento: { title: "Nivelamento de Plataforma", file: "/guias/guia-nivelamento.html" },
  fatiadores: { title: "Configuração de Fatiadores", file: "/guias/guia-configuracao-fatiadores.html" },
  calibracao: { title: "Calibração de Resina", file: "/guias/guia-calibracao-resina.html" },
  calibracaoQuanton3D: { title: "Calibração Quanton3D", file: "/guias/guia-calibracao-quanton3d.html" },
  manutencao: { title: "Manutenção de Impressora", file: "/guias/guia-manutencao-impressora.html" },
  otimizacao: { title: "Otimização e Pós-processamento", file: "/guias/guia-otimizacao-parametros.html" },
  diagnostico: { title: "Diagnóstico de Problemas", file: "/guias/guia-diagnostico-problemas.html" },
  suportes: { title: "Posicionamento de Suportes", file: "/guias/guia-posicionamento-suportes.html" },
  parceiros: { title: "Parceiros Quanton3D", file: "/guias/parceiros-quanton3d.html" },
  parametrosDetalhados: { title: "Parâmetros detalhados Chitubox", file: "/guias/secao-parametros-detalhados.html" },
};

function App() {
  const [parametros, setParametros] = useState([]);
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(false);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [formCliente, setFormCliente] = useState({ nome: "", telefone: "", email: "", origem: "Instagram" });
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null);
  const [mostrarContatoMensagem, setMostrarContatoMensagem] = useState(false);
  const [mostrarParceiroModal, setMostrarParceiroModal] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("quanton3d_cliente");
    if (salvo) {
      setCliente(JSON.parse(salvo));
    } else {
      setMostrarPrivacidade(true);
    }
    carregarParametros();
  }, []);

  async function carregarParametros() {
    try {
      setCarregando(true);
      const res = await api.get("/parametros");
      setParametros(res.data.data || []);
    } catch (err) {
      console.error("Erro ao carregar parâmetros:", err);
      setErro("Não foi possível carregar os parâmetros técnicos.");
    } finally {
      setCarregando(false);
    }
  }

  const resinas = [...new Set(parametros.map((p) => p.resina))].sort();
  const impressoras = parametros
    .filter((p) => p.resina === resinaSelecionada)
    .map((p) => p.impressora)
    .sort();

  const totalImpressoras = [...new Set(parametros.map((p) => p.impressora))].length;

  function selecionarResina(nome) {
    setResinaSelecionada(nome);
    setImpressoraSelecionada("");
    setResultado(null);
  }

  function selecionarImpressora(nome) {
    setImpressoraSelecionada(nome);
    const p = parametros.find((item) => item.resina === resinaSelecionada && item.impressora === nome);
    setResultado(p || null);
  }

  function corrigirNomeResina(nome) {
    if (!nome) return "";
    return nome.toUpperCase();
  }

  function aceitarPrivacidade() {
    setMostrarPrivacidade(false);
    setMostrarCadastro(true);
  }

  function alterarCliente(campo, valor) {
    setFormCliente((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvarCliente(e) {
    e.preventDefault();
    setErroCadastro("");
    if (!formCliente.nome || !formCliente.telefone || !formCliente.email) {
      setErroCadastro("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      setSalvandoCliente(true);
      const res = await api.post("/clientes", formCliente);
      const novoCliente = res.data.data;
      setCliente(novoCliente);
      localStorage.setItem("quanton3d_cliente", JSON.stringify(novoCliente));
      setMostrarCadastro(false);
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
      setErroCadastro("Erro ao realizar cadastro.");
    } finally {
      setSalvandoCliente(false);
    }
  }

  function executarAcao(item) {
    if (item.kind === "guide") {
      setActiveGuide(GUIDES[item.id]);
      return;
    }
    if (item.kind === "modal" && item.id === "contato") {
      setMostrarContatoMensagem(true);
      return;
    }
    if (item.kind === "modal") {
      setActiveModal(item.id);
      return;
    }
    if (item.kind === "whatsapp") {
      window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
    }
  }

  function abrirGuia(id) {
    setActiveGuide(GUIDES[id]);
  }

  function abrirParceiroModal() {
    setMostrarParceiroModal(true);
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function copiarParametros() {
    if (!resultado) return;
    const texto = `Parâmetros Quanton3D\nResina: ${corrigirNomeResina(resultado.resina)}\nImpressora: ${resultado.impressora}\nExposição: ${resultado.exposicaoNormal}s`;
    navigator.clipboard.writeText(texto);
    alert("Parâmetros copiados.");
  }

  return (
    <main className="app-shell">
      {mostrarPrivacidade && <PrivacidadeModal aceitarPrivacidade={aceitarPrivacidade} />}
      {mostrarCadastro && !mostrarPrivacidade && (
        <CadastroInicial
          formCliente={formCliente}
          salvandoCliente={salvandoCliente}
          erroCadastro={erroCadastro}
          alterarCliente={alterarCliente}
          salvarCliente={salvarCliente}
        />
      )}
      {activeGuide && <GuideModal guide={activeGuide} onClose={() => setActiveGuide(null)} />}
      <ContactMessageModal aberto={mostrarContatoMensagem} aoFechar={() => setMostrarContatoMensagem(false)} cliente={cliente} />
      {activeModal && (
        <SiteModal
          type={activeModal}
          cliente={cliente}
          onClose={() => setActiveModal(null)}
          abrirGuia={abrirGuia}
          abrirParceiroModal={abrirParceiroModal}
        />
      )}
      <PartnerRequestModal aberto={mostrarParceiroModal} aoFechar={() => setMostrarParceiroModal(false)} cliente={cliente} />

      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">Q3D</div>
            <div>
              <h1 translate="no">Quanton3D</h1>
              <p>Resinas UV SLA/DLP de Alta Performance</p>
            </div>
          </div>
          <nav className="main-nav">
            <button type="button" onClick={() => scrollToSection("produtos")}>Produtos</button>
            <button type="button" onClick={() => scrollToSection("servicos")}>Serviços</button>
            <button type="button" onClick={() => scrollToSection("parametros")}>Informações Técnicas</button>
            <button type="button" onClick={() => scrollToSection("calculadoras")}>Calculadoras</button>
            <button type="button" onClick={() => setMostrarCadastro(true)}>Cliente</button>
          </nav>
        </div>
      </header>

      {cliente && (
        <div className="client-chip">
          <strong>Cliente ativo:</strong> {cliente.nome} • {cliente.telefone}
        </div>
      )}

      <section className="hero-home">
        <div className="assistant-card">
          <div className="bot-face">🤖</div>
          <button type="button" onClick={() => setActiveModal("bot")}>Clique para falar comigo! 🤖</button>
        </div>
        <div className="home-actions">
          {SERVICE_BUTTONS.map((item) => (
            <button key={item.label} type="button" onClick={() => executarAcao(item)}>{item.label}</button>
          ))}
        </div>
      </section>

      <section className="experience-section">
        <span className="section-label">Colaboração técnica</span>
        <h2>Colabore com sua experiência de configuração</h2>
        <p>Envie uma foto da peça e os tempos usados no Chitubox para ajudar a Quanton3D a melhorar a base técnica.</p>
        <div className="experience-actions">
          <button type="button" onClick={() => setActiveModal("galeria")}>📷 Compartilhar minhas configurações</button>
          <button type="button" onClick={abrirParceiroModal}>🤝 Quero ser parceiro</button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card"><span>Total de parâmetros</span><strong>{parametros.length}</strong></div>
        <div className="stat-card"><span>Resinas cadastradas</span><strong>{resinas.length}</strong></div>
        <div className="stat-card"><span>Impressoras/modelos</span><strong>{totalImpressoras}</strong></div>
      </section>

      <section id="produtos" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Catálogo Elite</span><h2>Nossas Resinas</h2></div>
        </div>
        <div className="cards-grid">
          <InfoCard title="Alta Qualidade" text="Conheça linhas, aplicações e FISPQs." onClick={() => setActiveModal("qualidade")} />
          <InfoCard title="Parâmetros detalhados" text="Abra o guia completo do Chitubox." onClick={() => abrirGuia("parametrosDetalhados")} />
          <InfoCard title="Parceiros e cursos" text="Veja parceiros e serviços recomendados." onClick={() => abrirGuia("parceiros")} />
          <InfoCard title="Quero ser parceiro" text="Envie sua proposta de divulgação." onClick={abrirParceiroModal} />
        </div>
      </section>

      <section id="servicos" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Guias técnicos</span><h2>Serviços e Suporte</h2></div>
        </div>
        <div className="service-list">
          <ServiceLine title="Nivelamento de plataforma" onClick={() => abrirGuia("nivelamento")} />
          <ServiceLine title="Configuração de fatiador" onClick={() => abrirGuia("fatiadores")} />
          <ServiceLine title="Calibração de resina" onClick={() => abrirGuia("calibracao")} />
          <ServiceLine title="Manutenção de máquina" onClick={() => abrirGuia("manutencao")} />
        </div>
      </section>

      <section id="calculadoras" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Ferramentas</span><h2>Calculadoras Técnicas</h2></div>
        </div>
        <div className="selector-grid">
          <div className="field clickable-card" onClick={() => setActiveModal("calc_exp")}>
            <span>Calculadora de Exposição</span>
            <p style={{fontSize: "0.85rem", color: "#9fb4c7"}}>Ajuste fino baseado na temperatura.</p>
          </div>
          <div className="field clickable-card" onClick={() => setActiveModal("calc_vol")}>
            <span>Calculadora de Volume</span>
            <p style={{fontSize: "0.85rem", color: "#9fb4c7"}}>Estime o custo real da sua peça.</p>
          </div>
        </div>
      </section>

      <section id="parametros" className="panel">
        <div className="panel-header">
          <div><span className="section-label">Consulta rápida</span><h2>Parâmetros de impressão</h2></div>
          <div className="panel-actions">
            {carregando && <span className="loading-pill">Carregando...</span>}
            <button type="button" onClick={carregarParametros}>Atualizar</button>
          </div>
        </div>
        {erro && <div className="error-box">{erro}</div>}
        <div className="selector-grid">
          <label className="field resin-field">
            <span>1. Selecione a Resina</span>
            <select value={resinaSelecionada} onChange={(e) => selecionarResina(e.target.value)} disabled={carregando}>
              <option value="">Selecione a resina</option>
              {resinas.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="field printer-field">
            <span>2. Selecione a Impressora</span>
            <select value={impressoraSelecionada} onChange={(e) => selecionarImpressora(e.target.value)} disabled={!resinaSelecionada}>
              <option value="">{resinaSelecionada ? "Selecione a impressora" : "Escolha uma resina primeiro"}</option>
              {impressoras.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
        </div>

        {resultado && (
          <div className="result-card">
            <div className="result-header">
              <h3>{corrigirNomeResina(resultado.resina)} + {resultado.impressora}</h3>
              <button type="button" onClick={copiarParametros}>Copiar</button>
            </div>
            <div className="params-grid">
              <ParamItem label="Altura de Camada" value={resultado.alturaCamada} />
              <ParamItem label="Tempo de Exposição" value={resultado.exposicaoNormal} />
              <ParamItem label="Exposição Base" value={resultado.exposicaoBase} />
              <ParamItem label="Camadas de Base" value={resultado.camadasBase} />
              <ParamItem label="Retardo UV" value={resultado.retardoUV} />
              <ParamItem label="Potência UV" value={resultado.potenciaUV} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function PrivacidadeModal({ aceitarPrivacidade }) {
  const [confirmou, setConfirmou] = useState(false);
  return (
    <div className="modal-backdrop">
      <section className="registration-modal">
        <h2>Privacidade e Termos</h2>
        <div className="privacy-content" style={{maxHeight: "300px", overflowY: "auto", margin: "15px 0", padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", fontSize: "0.9rem"}}>
          <p>Para acessar nossa base técnica e suporte, coletamos dados básicos de contato. Ao continuar, você concorda com nossa política de uso.</p>
          <p>1. Coleta: Nome, WhatsApp e E-mail.</p>
          <p>2. Uso: Suporte técnico e informações sobre resinas.</p>
          <p>3. Segurança: Seus dados estão protegidos em nosso banco de dados.</p>
        </div>
        <label style={{display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", cursor: "pointer"}}>
          <input type="checkbox" checked={confirmou} onChange={(e) => setConfirmou(e.target.checked)} />
          <span>Li e aceito os termos de privacidade.</span>
        </label>
        <button className="submit-registration" disabled={!confirmou} onClick={aceitarPrivacidade}>Aceitar e Continuar</button>
      </section>
    </div>
  );
}

function CadastroInicial({ formCliente, salvandoCliente, erroCadastro, alterarCliente, salvarCliente }) {
  return (
    <div className="modal-backdrop">
      <form className="registration-modal" onSubmit={salvarCliente}>
        <h2>Identificação de Acesso</h2>
        <p>Olá! Identifique-se para liberar o acesso total aos guias e parâmetros da Quanton3D.</p>
        {erroCadastro && <div className="modal-error">{erroCadastro}</div>}
        <div className="form-grid">
          <label><span>Seu Nome</span><input value={formCliente.nome} onChange={(e) => alterarCliente("nome", e.target.value)} placeholder="Ex.: João Silva" /></label>
          <label><span>WhatsApp</span><input value={formCliente.telefone} onChange={(e) => alterarCliente("telefone", e.target.value)} placeholder="Ex.: 31 99999-9999" /></label>
          <label><span>E-mail</span><input value={formCliente.email} onChange={(e) => alterarCliente("email", e.target.value)} placeholder="Ex.: joao@email.com" /></label>
          <label><span>Como nos conheceu?</span>
            <select value={formCliente.origem} onChange={(e) => alterarCliente("origem", e.target.value)}>
              {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <button className="submit-registration" type="submit" disabled={salvandoCliente}>{salvandoCliente ? "Salvando..." : "Liberar Acesso"}</button>
      </form>
    </div>
  );
}

function GuideModal({ guide, onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="guide-modal">
        <div className="guide-header">
          <h2>{guide.title}</h2>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>
        <iframe title={guide.title} src={guide.file} className="guide-frame" />
      </section>
    </div>
  );
}

function SiteModal({ type, cliente, onClose, abrirGuia, abrirParceiroModal }) {
  const titles = { contato: "Fale Conosco", sobre: "Sobre a Quanton3D", formulacao: "Formulação Personalizada", galeria: "Galeria e Configurações", qualidade: "Alta Qualidade", calc_exp: "Calculadora de Exposição", calc_vol: "Calculadora de Volume", bot: "Bot Quanton3D" };
  return (
    <div className="modal-backdrop">
      <section className="site-modal">
        <div className="guide-header">
          <h2>{titles[type] || "Informações"}</h2>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>
        {type === "contato" && <ContatoContent cliente={cliente} />}
        {type === "sobre" && <SobreContent abrirGuia={abrirGuia} abrirParceiroModal={abrirParceiroModal} />}
        {type === "formulacao" && <FormulacaoContent />}
        {type === "galeria" && <GaleriaContent />}
        {type === "qualidade" && <QualidadeContent abrirGuia={abrirGuia} />}
        {type === "calc_exp" && <CalculadoraExposicao />}
        {type === "calc_vol" && <CalculadoraVolume />}
        {type === "bot" && <BotContent />}
      </section>
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

function FormulacaoContent() {
  return (
    <div className="modal-rich-content">
      <p>Solicite uma resina com propriedades específicas.</p>
      <form className="modal-form-layout" style={{marginTop: "20px"}}>
        <div className="form-grid">
          <label><span>Aplicação</span><input placeholder="Ex.: Guia Cirúrgico" /></label>
          <label><span>Cor</span><input placeholder="Ex.: Transparente" /></label>
          <label className="partner-grid-full"><textarea rows="3" placeholder="Descreva sua necessidade." /></label>
        </div>
        <button type="button" className="submit-registration">Solicitar Estudo</button>
      </form>
    </div>
  );
}

function GaleriaContent() {
  return (
    <div className="modal-rich-content">
      <p>Compartilhe fotos de suas peças impressas.</p>
      <form className="modal-form-layout" style={{marginTop: "20px"}}>
        <div className="form-grid">
          <label><span>Resina</span><input placeholder="Ex.: Iron Cinza" /></label>
          <label className="partner-grid-full"><input type="file" multiple accept="image/*" /></label>
          <label className="partner-grid-full"><textarea rows="3" placeholder="Parâmetros usados." /></label>
        </div>
        <button type="button" className="submit-registration">Enviar para Galeria</button>
      </form>
    </div>
  );
}

function QualidadeContent({ abrirGuia }) {
  return (
    <div className="modal-rich-content">
      <div className="modal-action-grid">
        <button type="button" onClick={() => abrirGuia("otimizacao")}>Otimização</button>
        <button type="button" onClick={() => abrirGuia("calibracaoQuanton3D")}>Calibração Q3D</button>
      </div>
    </div>
  );
}

function BotContent() {
  return (
    <div className="modal-rich-content">
      <p>O bot está sendo religado com novas regras de inteligência.</p>
    </div>
  );
}

function ParamItem({ label, value }) {
  return (
    <div className="param-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function InfoCard({ title, text, onClick }) {
  return (
    <button type="button" className="info-card clickable-card" onClick={onClick}>
      <h3>{title}</h3>
      <p>{text}</p>
    </button>
  );
}

function ServiceLine({ title, onClick }) {
  return (
    <button type="button" className="service-line" onClick={onClick}>
      <span>✓</span>
      <strong>{title}</strong>
    </button>
  );
}

export default App;
