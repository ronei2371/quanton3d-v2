import PartnerRequestModal from "./components/PartnerRequestModal";
import ContactMessageModal from "./components/ContactMessageModal";
import Ferramentas from "./components/Ferramentas";
import BotTicketModal from "./components/BotTicketModal";
import AdminUnifiedPanel from "./components/AdminUnifiedPanel";
import { useEffect, useMemo, useState } from "react";
import api from "./api";
import "./App.css";

const ORIGENS = [
  "Instagram",
  "YouTube",
  "Google / Pesquisa",
  "Indicação de amigo",
  "Mercado Livre / Shopee",
  "Já sou cliente",
  "Outros",
];

const WHATSAPP_URL = "https://wa.me/553132716935";

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
  nivelamento: {
    title: "Nivelamento de Plataforma",
    file: "/guias/guia-nivelamento.html",
  },
  fatiadores: {
    title: "Configuração de Fatiadores",
    file: "/guias/guia-configuracao-fatiadores.html",
  },
  calibracao: {
    title: "Calibração de Resina",
    file: "/guias/guia-calibracao-resina.html",
  },
  calibracaoQuanton3D: {
    title: "Calibração Quanton3D",
    file: "/guias/guia-calibracao-quanton3d.html",
  },
  manutencao: {
    title: "Manutenção de Impressora",
    file: "/guias/guia-manutencao-impressora.html",
  },
  otimizacao: {
    title: "Otimização e Pós-processamento",
    file: "/guias/guia-otimizacao-parametros.html",
  },
  diagnostico: {
    title: "Diagnóstico de Problemas",
    file: "/guias/guia-diagnostico-problemas.html",
  },
  suportes: {
    title: "Posicionamento de Suportes",
    file: "/guias/guia-posicionamento-suportes.html",
  },
  parceiros: {
    title: "Parceiros Quanton3D",
    file: "/guias/parceiros-quanton3d.html",
  },
  parametrosDetalhados: {
    title: "Parâmetros detalhados Chitubox",
    file: "/guias/secao-parametros-detalhados.html",
  },
};

function App() {
  const [parametros, setParametros] = useState([]);
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mostrarAdminUnificado, setMostrarAdminUnificado] = useState(false);

  const [cliente, setCliente] = useState(null);
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(false);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);

  const [formCliente, setFormCliente] = useState({
    nome: "",
    telefone: "",
    email: "",
    origem: "Instagram",
  });

  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [sucessoCadastro, setSucessoCadastro] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null);
  const [mostrarParceiroModal, setMostrarParceiroModal] = useState(false);
  const [mostrarContatoMensagem, setMostrarContatoMensagem] = useState(false);

  useEffect(() => {
    carregarParametros();
    carregarEstadoInicial();
  }, []);

  function carregarEstadoInicial() {
    const privacidadeAceita =
      localStorage.getItem("quanton3d_privacidade_aceita") === "true";

    const clienteLocal = carregarClienteLocal();

    if (!privacidadeAceita) {
      setMostrarPrivacidade(true);
      setMostrarCadastro(false);
      return;
    }

    if (!clienteLocal) {
      setMostrarCadastro(true);
    }
  }

  function carregarClienteLocal() {
    try {
      const salvo = localStorage.getItem("quanton3d_cliente");
      if (!salvo) return null;
      const clienteSalvo = JSON.parse(salvo);
      if (clienteSalvo?.nome && clienteSalvo?.telefone) {
        setCliente(clienteSalvo);
        setFormCliente({
          nome: clienteSalvo.nome || "",
          telefone: clienteSalvo.telefone || "",
          email: clienteSalvo.email || "",
          origem: clienteSalvo.origem || "Instagram",
        });
        return clienteSalvo;
      }
      return null;
    } catch {
      return null;
    }
  }

  function aceitarPrivacidade() {
    localStorage.setItem("quanton3d_privacidade_aceita", "true");
    setMostrarPrivacidade(false);
    const clienteLocal = carregarClienteLocal();
    if (!clienteLocal) {
      setMostrarCadastro(true);
    }
  }

  function limparTexto(valor) {
    return String(valor || "").trim();
  }

  function corrigirNomeResina(nome) {
    const valor = limparTexto(nome);
    return valor
      .replace(/^FERRO\s*70\/30\b/i, "IRON 70/30")
      .replace(/^FERRO\s*7030\b/i, "IRON 7030")
      .replace(/^FERRO\b/i, "IRON")
      .replace(/^Iron\b/i, "IRON")
      .replace(/^iron\b/i, "IRON");
  }

  function chaveResina(nome) {
    return corrigirNomeResina(nome).toUpperCase();
  }

  async function carregarParametros() {
    try {
      setCarregando(true);
      setErro("");
      const resposta = await api.get("/parametros");
      const lista = resposta.data.parametros || [];
      const listaCorrigida = lista.map((item) => ({
        ...item,
        resina: corrigirNomeResina(item.resina),
        impressora: limparTexto(item.impressora),
        marca: limparTexto(item.marca),
      }));
      setParametros(listaCorrigida);
    } catch (error) {
      console.error("Erro ao carregar parâmetros:", error);
      setErro("Não foi possível carregar os parâmetros do backend.");
    } finally {
      setCarregando(false);
    }
  }

  const resinas = useMemo(() => {
    const unicas = new Set();
    parametros.forEach((item) => {
      if (item.resina) unicas.add(corrigirNomeResina(item.resina));
    });
    return Array.from(unicas).sort((a, b) => a.localeCompare(b));
  }, [parametros]);

  const impressoras = useMemo(() => {
    if (!resinaSelecionada) return [];
    const unicas = new Set();
    parametros.forEach((item) => {
      if (chaveResina(item.resina) === chaveResina(resinaSelecionada) && item.impressora) {
        const label = item.marca ? `${item.marca} - ${item.impressora}` : item.impressora;
        unicas.add(label);
      }
    });
    return Array.from(unicas).sort((a, b) => a.localeCompare(b));
  }, [parametros, resinaSelecionada]);

  const totalImpressoras = useMemo(() => {
    const unicas = new Set();
    parametros.forEach((item) => {
      if (item.impressora) {
        const chave = `${item.marca || ""}-${item.impressora}`;
        unicas.add(chave);
      }
    });
    return unicas.size;
  }, [parametros]);

  function selecionarResina(valor) {
    setResinaSelecionada(valor);
    setImpressoraSelecionada("");
    setResultado(null);
  }

  function selecionarImpressora(valor) {
    setImpressoraSelecionada(valor);
    const nomeModelo = valor.includes(" - ") ? valor.split(" - ").slice(1).join(" - ") : valor;
    const marcaModelo = valor.includes(" - ") ? valor.split(" - ")[0] : "";
    const encontrado = parametros.find((item) => {
      const mesmaResina = chaveResina(item.resina) === chaveResina(resinaSelecionada);
      const mesmaImpressora = item.impressora === nomeModelo;
      const mesmaMarca = !marcaModelo || item.marca === marcaModelo;
      return mesmaResina && mesmaImpressora && mesmaMarca;
    });
    setResultado(encontrado || null);
  }

  async function salvarCliente(event) {
    event.preventDefault();
    setErroCadastro("");
    setSucessoCadastro("");
    const payload = {
      nome: limparTexto(formCliente.nome),
      telefone: limparTexto(formCliente.telefone),
      email: limparTexto(formCliente.email),
      origem: limparTexto(formCliente.origem),
    };
    if (!payload.nome || !payload.telefone || !payload.email || !payload.origem) {
      setErroCadastro("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      setSalvandoCliente(true);
      const resposta = await api.post("/clientes", payload);
      const clienteSalvo = resposta.data.cliente;
      if (clienteSalvo) {
        localStorage.setItem("quanton3d_cliente", JSON.stringify(clienteSalvo));
        setCliente(clienteSalvo);
        setSucessoCadastro("Acesso liberado! Bem-vindo.");
        setTimeout(() => {
          setMostrarCadastro(false);
          setSucessoCadastro("");
        }, 1500);
      }
    } catch (error) {
      setErroCadastro("Erro ao salvar cadastro.");
    } finally {
      setSalvandoCliente(false);
    }
  }

  function executarAcao(item) {
    if (item.kind === "guide") {
      setActiveGuide(GUIDES[item.id]);
    } else if (item.kind === "modal") {
      if (item.id === "contato") setMostrarContatoMensagem(true);
      else setActiveModal(item.id);
    } else if (item.kind === "whatsapp") {
      window.open(WHATSAPP_URL, "_blank");
    }
  }

  function abrirGuia(id) {
    setActiveGuide(GUIDES[id]);
    setActiveModal(null);
  }

  function abrirParceiroModal() {
    setMostrarParceiroModal(true);
    setActiveModal(null);
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  function copiarParametros() {
    if (!resultado) return;
    const texto = `
Resina: ${corrigirNomeResina(resultado.resina)}
Marca: ${resultado.marca || "-"}
Impressora: ${resultado.impressora || "-"}
Altura de camada: ${resultado.alturaCamada || "-"}
Camadas base: ${resultado.camadasBase || "-"}
Exposição normal: ${resultado.exposicaoNormal || "-"}
Exposição base: ${resultado.exposicaoBase || "-"}
Retardo UV: ${resultado.retardoUV || "-"}
Retardo UV base: ${resultado.retardoUVBase || "-"}
Descanso antes da elevação: ${resultado.descansoAntesElevacao || "-"}
Descanso após a elevação: ${resultado.descansoAposElevacao || "-"}
Descanso após a retração: ${resultado.descansoAposRetracao || "-"}
Potência UV: ${resultado.potenciaUV || "-"}
`.trim();
    navigator.clipboard.writeText(texto);
    alert("Parâmetros copiados.");
  }

  return (
    <main className="app-shell">
      {mostrarPrivacidade && (
        <PrivacidadeModal aceitarPrivacidade={aceitarPrivacidade} />
      )}

      {mostrarCadastro && !mostrarPrivacidade && (
        <CadastroInicial
          formCliente={formCliente}
          salvandoCliente={salvandoCliente}
          erroCadastro={erroCadastro}
          sucessoCadastro={sucessoCadastro}
          setFormCliente={setFormCliente}
          salvarCliente={salvarCliente}
          onClose={() => setMostrarCadastro(false)}
        />
      )}

      {activeGuide && (
        <GuideModal guide={activeGuide} onClose={() => setActiveGuide(null)} />
      )}

      <ContactMessageModal
        aberto={mostrarContatoMensagem}
        aoFechar={() => setMostrarContatoMensagem(false)}
        cliente={cliente}
      />

      {activeModal && (
        <SiteModal
          type={activeModal}
          cliente={cliente}
          onClose={() => setActiveModal(null)}
          abrirGuia={abrirGuia}
          abrirParceiroModal={abrirParceiroModal}
        />
      )}

      <PartnerRequestModal
        aberto={mostrarParceiroModal}
        aoFechar={() => setMostrarParceiroModal(false)}
        cliente={cliente}
      />

      {activeModal === "bot" && (
        <BotTicketModal 
          aberto={true} 
          aoFechar={() => setActiveModal(null)} 
          cliente={cliente} 
        />
      )}

      {mostrarAdminUnificado && (
        <AdminUnifiedPanel aoFechar={() => setMostrarAdminUnificado(false)} />
      )}

      <header className="site-header">
        <div className="header-inner">
          <div className="brand" onClick={() => {
            const count = parseInt(localStorage.getItem("admin_clicks") || "0") + 1;
            localStorage.setItem("admin_clicks", count);
            if (count >= 5) {
              setMostrarAdminUnificado(true);
              localStorage.setItem("admin_clicks", "0");
            }
          }} style={{ cursor: "pointer" }}>
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
          <button type="button" onClick={() => setActiveModal("bot")}>
            Clique para falar comigo! 🤖
          </button>
        </div>

        <div className="home-actions">
          {SERVICE_BUTTONS.map((item) => (
            <button key={item.label} type="button" onClick={() => executarAcao(item)}>
              {item.label}
            </button>
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
          <div>
            <span className="section-label">Catálogo Elite</span>
            <h2>Nossas Resinas</h2>
            <p>Conheça a linha completa de resinas Quanton3D para cada aplicação.</p>
          </div>
        </div>
        <div className="empty-state">
          <p>O catálogo de produtos será carregado aqui em breve.</p>
        </div>
      </section>

      <section id="servicos" className="panel">
        <div className="panel-header">
          <div>
            <span className="section-label">Ecossistema Q3D</span>
            <h2>Serviços e Suporte</h2>
            <p>Além de resinas, oferecemos consultoria e suporte técnico especializado.</p>
          </div>
        </div>
        <div className="empty-state">
          <p>A lista de serviços será detalhada aqui em breve.</p>
        </div>
      </section>

      <section id="calculadoras" className="panel">
        <div className="panel-header">
          <div>
            <span className="section-label">Ferramentas de Precisão</span>
            <h2>Calculadoras Técnicas</h2>
            <p>Otimize seu tempo de impressão e consumo de material.</p>
          </div>
        </div>
        <div className="selector-grid">
          <div className="field clickable-card" onClick={() => setActiveModal("calc_exp")}>
            <span>Calculadora de Exposição</span>
            <p style={{fontSize: "0.85rem", color: "#9fb4c7"}}>Ajuste fino baseado na temperatura e modelo.</p>
          </div>
          <div className="field clickable-card" onClick={() => setActiveModal("calc_vol")}>
            <span>Calculadora de Volume</span>
            <p style={{fontSize: "0.85rem", color: "#9fb4c7"}}>Estime o custo real da sua peça.</p>
          </div>
        </div>
      </section>

      <section id="parametros" className="panel">
        <div className="panel-header">
          <div>
            <span className="section-label">Consulta rápida</span>
            <h2>Parâmetros de impressão</h2>
            <p>Selecione a resina e a impressora para ver as configurações recomendadas.</p>
          </div>
          <div className="panel-actions">
            {carregando && <span className="loading-pill">Carregando...</span>}
            <button type="button" onClick={carregarParametros}>Atualizar</button>
          </div>
        </div>

        {erro && <div className="error-box">{erro}</div>}

        <div className="selector-grid">
          <label className="field resin-field">
            <span>1. Selecione a Resina</span>
            <select value={resinaSelecionada} onChange={(e) => selecionarResina(e.target.value)} disabled={carregando} className="notranslate">
              <option value="">Selecione a resina</option>
              {resinas.map((resina) => <option key={resina} value={resina}>{resina}</option>)}
            </select>
          </label>

          <label className="field printer-field">
            <span>2. Selecione a Impressora</span>
            <select value={impressoraSelecionada} onChange={(e) => selecionarImpressora(e.target.value)} disabled={!resinaSelecionada || impressoras.length === 0} className="notranslate">
              <option value="">{resinaSelecionada ? "Selecione a impressora" : "Escolha uma resina primeiro"}</option>
              {impressoras.map((impressora) => <option key={impressora} value={impressora}>{impressora}</option>)}
            </select>
          </label>
        </div>

        {!resultado && (
          <div className="empty-state">
            <h3>Selecione resina e impressora</h3>
            <p>Os parâmetros técnicos aparecerão aqui automaticamente.</p>
          </div>
        )}

        {resultado && (
          <div className="result-card">
            <div className="result-header">
              <div>
                <span className="section-label">Resultado encontrado</span>
                <h3>{corrigirNomeResina(resultado.resina)} + {resultado.marca} {resultado.impressora}</h3>
              </div>
              <button type="button" onClick={copiarParametros}>Copiar parâmetros</button>
            </div>

            <div className="params-grid">
              <ParamItem label="Altura Camada" value={resultado.alturaCamada} />
              <ParamItem label="Exposição Normal" value={resultado.exposicaoNormal} />
              <ParamItem label="Exposição Base" value={resultado.exposicaoBase} />
              <ParamItem label="Camadas Base" value={resultado.camadasBase} />
              <ParamItem label="Retardo UV" value={resultado.retardoUV} />
              <ParamItem label="Retardo UV Base" value={resultado.retardoUVBase} />
              <ParamItem label="Descanso Antes Elev." value={resultado.descansoAntesElevacao} />
              <ParamItem label="Descanso Após Elev." value={resultado.descansoAposElevacao} />
              <ParamItem label="Descanso Após Retrac." value={resultado.descansoAposRetracao} />
              <ParamItem label="Potência UV" value={resultado.potenciaUV} />
              <ParamItem label="Lift Distance" value={resultado.liftDistance} />
              <ParamItem label="Lift Speed" value={resultado.liftSpeed} />
              <ParamItem label="Retract Speed" value={resultado.retractSpeed} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function PrivacidadeModal({ aceitarPrivacidade }) {
  const [confirmouAceite, setConfirmouAceite] = useState(false);
  return (
    <div className="modal-backdrop">
      <section className="registration-modal privacy-modal">
        <div className="modal-header">
          <div className="modal-icon">🔒</div>
          <div><h2>Privacidade e Termos</h2><p>Como cuidamos dos seus dados na Quanton3D.</p></div>
        </div>
        <div className="privacy-content">
          <h3>1. Coleta de Dados</h3><p>Solicitamos nome, e-mail e WhatsApp para suporte técnico personalizado.</p>
          <h3>2. Uso das Informações</h3><p>Dados usados apenas para melhorar sua experiência e histórico de suporte.</p>
          <h3>3. Segurança</h3><p>Não compartilhamos dados com terceiros. Armazenamento seguro.</p>
          <h3>4. Finalidade</h3><p>As informações coletadas permitem que a Quanton3D ofereça parâmetros precisos para sua impressora.</p>
          <h3>5. Direitos</h3><p>Você pode solicitar a exclusão de seus dados a qualquer momento via suporte.</p>
          <h3>6. Cookies</h3><p>Usamos armazenamento local para manter sua sessão ativa e evitar novos cadastros.</p>
          <h3>7. Consentimento</h3><p>Ao marcar a opção abaixo, você confirma que leu e autoriza o tratamento dos dados.</p>
        </div>
        <label className="privacy-accept-row">
          <input type="checkbox" checked={confirmouAceite} onChange={(e) => setConfirmouAceite(e.target.checked)} />
          <span>Li e aceito o Termo de Privacidade.</span>
        </label>
        <button type="button" className="submit-registration" disabled={!confirmouAceite} onClick={aceitarPrivacidade}>Aceitar e continuar</button>
      </section>
    </div>
  );
}

function CadastroInicial({ formCliente, salvandoCliente, erroCadastro, sucessoCadastro, setFormCliente, salvarCliente, onClose }) {
  return (
    <div className="modal-backdrop">
      <form className="registration-modal" onSubmit={salvarCliente}>
        <div className="modal-header">
          <div className="modal-icon">👥</div>
          <div><h2>Seja bem-vindo!</h2><p>Identifique-se para liberar o suporte técnico.</p></div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>✕</button>
        </div>
        {erroCadastro && <div className="modal-error">{erroCadastro}</div>}
        {sucessoCadastro && <div className="modal-success">{sucessoCadastro}</div>}
        <div className="form-grid">
          <label><span>Seu Nome *</span><input required value={formCliente.nome} onChange={(e) => setFormCliente({...formCliente, nome: e.target.value})} placeholder="Digite seu nome" /></label>
          <label><span>WhatsApp *</span><input required value={formCliente.telefone} onChange={(e) => setFormCliente({...formCliente, telefone: e.target.value})} placeholder="DDD + número" /></label>
          <label><span>E-mail *</span><input required type="email" value={formCliente.email} onChange={(e) => setFormCliente({...formCliente, email: e.target.value})} placeholder="seu@email.com" /></label>
          <label><span>Como nos conheceu? *</span>
            <select value={formCliente.origem} onChange={(e) => setFormCliente({...formCliente, origem: e.target.value})}>
              {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <button className="submit-registration" type="submit" disabled={salvandoCliente}>{salvandoCliente ? "Salvando..." : "Entrar no Suporte Técnico"}</button>
      </form>
    </div>
  );
}

function GuideModal({ guide, onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="guide-modal">
        <div className="guide-header">
          <div><span className="section-label">Guia técnico</span><h2>{guide.title}</h2></div>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>
        <iframe title={guide.title} src={guide.file} className="guide-frame" />
      </section>
    </div>
  );
}

function SiteModal({ type, cliente, onClose, abrirGuia, abrirParceiroModal }) {
  const titles = { 
    contato: "Fale Conosco", 
    sobre: "Sobre a Quanton3D", 
    formulacao: "Formulação Personalizada",
    galeria: "Galeria e Configurações",
    calc_exp: "Calculadora de Exposição",
    calc_vol: "Calculadora de Volume"
  };
  return (
    <div className="modal-backdrop">
      <section className="site-modal">
        <div className="guide-header">
          <div><span className="section-label">Quanton3D</span><h2>{titles[type] || "Informações"}</h2></div>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>
        {type === "contato" && <ContatoContent cliente={cliente} />}
        {type === "sobre" && <SobreContent abrirGuia={abrirGuia} abrirParceiroModal={abrirParceiroModal} />}
        {type === "formulacao" && <FormulacaoContent cliente={cliente} />}
        {type === "galeria" && <GaleriaContent />}
        {type === "calc_exp" && <CalculadoraExposicao />}
        {type === "calc_vol" && <CalculadoraVolume />}
      </section>
    </div>
  );
}

function GaleriaContent() {
  return (
    <div className="modal-rich-content">
      <p>A galeria será integrada na próxima fase para receber imagem, resina, impressora, parâmetros e dados do cliente.</p>
      <div className="notice-box">O botão já está conectado visualmente. Falta ligar upload + MongoDB.</div>
    </div>
  );
}

function ContatoContent({ cliente }) {
  return (
    <div className="modal-rich-content">
      <p>Olá {cliente?.nome || "cliente"}, escolha uma forma de atendimento.</p>
      <div className="modal-action-grid">
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="modal-btn">Chamar no WhatsApp</a>
        <a href="mailto:atendimento@quanton3d.com.br" className="modal-btn">Enviar e-mail</a>
      </div>
    </div>
  );
}

function SobreContent({ abrirGuia, abrirParceiroModal }) {
  return (
    <div className="modal-rich-content">
      <p>A Quanton3D é especializada em resinas UV SLA/DLP/LCD e suporte técnico para impressão 3D.</p>
      <div className="modal-action-grid">
        <button type="button" onClick={() => abrirGuia("parceiros")}>Ver parceiros e cursos</button>
        <button type="button" onClick={() => abrirGuia("diagnostico")}>Guia de diagnóstico</button>
        <button type="button" onClick={abrirParceiroModal}>Quero ser parceiro</button>
      </div>
    </div>
  );
}

function FormulacaoContent({ cliente }) {
  return (
    <div className="modal-rich-content">
      <p>Pedido de formulação personalizada para cliente: <strong>{cliente?.nome || "não identificado"}</strong>.</p>
      <p>Envie sua necessidade técnica e entraremos em contato.</p>
      <div className="modal-action-grid">
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="modal-btn">Falar com especialista</a>
      </div>
    </div>
  );
}

function ParamItem({ label, value }) {
  return (
    <div className="param-item">
      <span>{label}</span>
      <strong translate="no">{value || "-"}</strong>
    </div>
  );
}

export default App;
