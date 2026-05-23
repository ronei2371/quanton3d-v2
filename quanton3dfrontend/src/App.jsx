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
  "Facebook",
  "TikTok",
  "YouTube",
  "Google / Pesquisa",
  "Indicação de amigo",
  "Mercado Livre / Shopee",
  "Já sou cliente",
  "Outros",
];

const WHATSAPP_URL = "https://wa.me/553132716935";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/quanton3d" },
  { label: "Facebook", href: "https://www.facebook.com/quanton3d" },
  { label: "TikTok", href: "https://www.tiktok.com/@quanton3d" },
  { label: "YouTube", href: "https://www.youtube.com/@quanton3d" },
];

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
  { label: "PARÂMETROS DE IMPRESSÃO", kind: "scroll", id: "parametros" },
];

const GUIDES = {
  nivelamento: {
    title: "Nivelamento de Plataforma",
    file: "/guias/guia-nivelamento.html",
  },
  fatiadores: {
    title: "Configuração de Fatiadores",
    file: "/guias/guia-configuracao-fatiador.html",
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
    file: "/guias/guia-manutencao-maquina.html",
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
  const [mostrarBotTicket, setMostrarBotTicket] = useState(false);
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
      if (item.resina) {
        unicas.add(corrigirNomeResina(item.resina));
      }
    });

    return Array.from(unicas).sort((a, b) => a.localeCompare(b));
  }, [parametros]);

  const impressoras = useMemo(() => {
    if (!resinaSelecionada) return [];

    const unicas = new Set();

    parametros.forEach((item) => {
      if (
        chaveResina(item.resina) === chaveResina(resinaSelecionada) &&
        item.impressora
      ) {
        const label = item.marca
          ? `${item.marca} - ${item.impressora}`
          : item.impressora;

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

  const impressorasTecnicas = useMemo(() => {
    const unicas = new Set();

    parametros.forEach((item) => {
      const marca = String(item.marca || "").trim();
      const impressora = String(item.impressora || "").trim();
      if (!impressora) return;
      const label = marca ? `${marca} - ${impressora}` : impressora;
      unicas.add(label);
    });

    return Array.from(unicas).sort((a, b) => a.localeCompare(b));
  }, [parametros]);

  function selecionarResina(valor) {
    setResinaSelecionada(valor);
    setImpressoraSelecionada("");
    setResultado(null);
  }

  function selecionarImpressora(valor) {
    setImpressoraSelecionada(valor);

    const nomeModelo = valor.includes(" - ")
      ? valor.split(" - ").slice(1).join(" - ")
      : valor;

    const marcaModelo = valor.includes(" - ") ? valor.split(" - ")[0] : "";

    const encontrado = parametros.find((item) => {
      const mesmaResina =
        chaveResina(item.resina) === chaveResina(resinaSelecionada);
      const mesmaImpressora = item.impressora === nomeModelo;
      const mesmaMarca = !marcaModelo || item.marca === marcaModelo;

      return mesmaResina && mesmaImpressora && mesmaMarca;
    });

    setResultado(encontrado || null);
  }

  function abrirCadastro() {
    setErroCadastro("");

    const privacidadeAceita =
      localStorage.getItem("quanton3d_privacidade_aceita") === "true";

    if (!privacidadeAceita) {
      setMostrarPrivacidade(true);
      return;
    }

    setMostrarCadastro(true);
  }

  function alterarCliente(campo, valor) {
    setFormCliente((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarCliente(event) {
    event.preventDefault();

    setErroCadastro("");

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
        setMostrarCadastro(false);
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      setErroCadastro(
        error.response?.data?.error || "Erro ao conectar com o servidor."
      );
    } finally {
      setSalvandoCliente(false);
    }
  }

  function abrirParceiroModal() {
    setMostrarParceiroModal(true);
  }

  function executarAcao(item) {
    if (item.kind === "guide") {
      setActiveGuide(GUIDES[item.id]);
      return;
    }

    if (item.kind === "scroll") {
      scrollToSection(item.id);
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

  function scrollToSection(id) {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function copiarParametros() {
    if (!resultado) return;

    const texto = `
Parâmetros Quanton3D
Cliente: ${cliente?.nome || "-"}
WhatsApp: ${cliente?.telefone || "-"}
E-mail: ${cliente?.email || "-"}
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
          alterarCliente={alterarCliente}
          salvarCliente={salvarCliente}
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

      <AdminUnifiedPanel
        aberto={mostrarAdminUnificado}
        aoFechar={() => setMostrarAdminUnificado(false)}
      />

      <BotTicketModal
        aberto={mostrarBotTicket}
        aoFechar={() => setMostrarBotTicket(false)}
        cliente={cliente}
        resinas={resinas}
        impressoras={impressorasTecnicas}
      />

      {activeModal && (
        <SiteModal
          type={activeModal}
          cliente={cliente}
          onClose={() => setActiveModal(null)}
          abrirGuia={abrirGuia}
          abrirParceiroModal={abrirParceiroModal}
          resinas={resinas}
          impressoras={impressoras}
        />
      )}

      <PartnerRequestModal
        aberto={mostrarParceiroModal}
        aoFechar={() => setMostrarParceiroModal(false)}
        cliente={cliente}
      />

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
            <button type="button" onClick={() => scrollToSection("produtos")}>
              Produtos
            </button>

            <button type="button" onClick={() => scrollToSection("servicos")}>
              Serviços
            </button>

            <button type="button" onClick={() => scrollToSection("parametros")}>
              Informações Técnicas
            </button>

            <button type="button" onClick={() => scrollToSection("calculadoras")}>
              Ferramentas
            </button>

            <button type="button" onClick={() => setMostrarAdminUnificado(true)}>
              Admin
            </button>

            <button type="button" onClick={abrirCadastro}>
              Cliente
            </button>
          </nav>
        </div>
      </header>

      {cliente && (
        <div className="client-chip">
          <strong>Cliente ativo:</strong> {cliente.nome} • {cliente.telefone} •{" "}
          {cliente.email}
        </div>
      )}

      <section className="hero-home">
        <div className="assistant-card">
          <div className="bot-face">🤖</div>
          <button type="button" onClick={() => setMostrarBotTicket(true)}>
            Clique para falar comigo! 🤖
          </button>
        </div>

        <div className="home-actions">
          {SERVICE_BUTTONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => executarAcao(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="experience-section">
        <span className="section-label">Colaboração técnica</span>

        <h2>Colabore com sua experiência de configuração</h2>

        <p>
          Envie uma foto da peça e os tempos usados no Chitubox para ajudar a
          Quanton3D a melhorar a base técnica e orientar outros clientes.
        </p>

        <div className="experience-actions">
          <button type="button" onClick={() => setActiveModal("galeria")}>
            📷 Compartilhar minhas configurações
          </button>
          <button type="button" onClick={abrirParceiroModal}>
            🤝 Quero ser parceiro
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total de parâmetros</span>
          <strong>{parametros.length}</strong>
        </div>

        <div className="stat-card">
          <span>Resinas cadastradas</span>
          <strong>{resinas.length}</strong>
        </div>

        <div className="stat-card">
          <span>Impressoras/modelos</span>
          <strong>{totalImpressoras}</strong>
        </div>
      </section>

      <section id="parametros" className="panel">
        <div className="panel-header">
          <div>
            <span className="section-label">Consulta rápida</span>
            <h2>Parâmetros de impressão</h2>
            <p>
              Selecione a resina e a impressora para ver as configurações
              recomendadas.
            </p>
          </div>

          <div className="panel-actions">
            {carregando && <span className="loading-pill">Carregando...</span>}

            <button type="button" onClick={carregarParametros}>
              Atualizar
            </button>
          </div>
        </div>

        {erro && <div className="error-box">{erro}</div>}

        <div className="selector-grid">
          <label className="field resin-field">
            <span>1. Selecione a Resina</span>

            <select
              value={resinaSelecionada}
              onChange={(e) => selecionarResina(e.target.value)}
              disabled={carregando}
              translate="no"
              className="notranslate"
            >
              <option value="">Selecione a resina</option>

              {resinas.map((resina) => (
                <option key={resina} value={resina} translate="no">
                  {resina}
                </option>
              ))}
            </select>
          </label>

          <label className="field printer-field">
            <span>2. Selecione a Impressora</span>

            <select
              value={impressoraSelecionada}
              onChange={(e) => selecionarImpressora(e.target.value)}
              disabled={!resinaSelecionada || impressoras.length === 0}
              translate="no"
              className="notranslate"
            >
              <option value="">
                {resinaSelecionada
                  ? "Selecione a impressora"
                  : "Escolha uma resina primeiro"}
              </option>

              {impressoras.map((impressora) => (
                <option key={impressora} value={impressora} translate="no">
                  {impressora}
                </option>
              ))}
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

                <h3 translate="no">
                  {corrigirNomeResina(resultado.resina)} + {resultado.marca}{" "}
                  {resultado.impressora}
                </h3>
              </div>

              <button type="button" onClick={copiarParametros}>
                Copiar parâmetros
              </button>
            </div>

            <div className="params-grid">
              <ParamItem label="Altura de Camada" value={resultado.alturaCamada} />
              <ParamItem label="Tempo de Exposição" value={resultado.exposicaoNormal} />
              <ParamItem label="Exposição Base" value={resultado.exposicaoBase} />
              <ParamItem label="Camadas de Base" value={resultado.camadasBase} />
              <ParamItem label="Retardo UV" value={resultado.retardoUV} />
              <ParamItem label="Retardo UV Base" value={resultado.retardoUVBase} />
              <ParamItem label="Descanso Antes Elevação" value={resultado.descansoAntesElevacao} />
              <ParamItem label="Descanso Após Elevação" value={resultado.descansoAposElevacao} />
              <ParamItem label="Descanso Após Retração" value={resultado.descansoAposRetracao} />
              <ParamItem label="Potência UV" value={resultado.potenciaUV} />
            </div>

            <div className="warning-box">
              <strong>Atenção:</strong> parâmetros são ponto de partida. Ajustes
              finos podem variar por lote, temperatura, tela, filme, potência UV
              e condição da impressora.
            </div>
          </div>
        )}
      </section>

      <section id="calculadoras" className="content-section">
        <Ferramentas />
      </section>

      <section id="produtos" className="content-section">
        <div>
          <span className="section-label">Produtos</span>
          <h2>Resinas Quanton3D</h2>
          <p>
            Base técnica preparada para organizar famílias de resinas,
            aplicações, recomendações de uso e parâmetros por impressora.
          </p>
        </div>

        <div className="cards-grid">
          <div className="info-card">
            <h3>Família IRON</h3>
            <p>Resinas de alta dureza e precisão para peças técnicas.</p>
          </div>

          <div className="info-card">
            <h3>Família FLEX</h3>
            <p>Flexibilidade e resistência ao impacto para prototipagem.</p>
          </div>

          <div className="info-card">
            <h3>Odontologia</h3>
            <p>Biocompatibilidade e estabilidade dimensional.</p>
          </div>
        </div>
      </section>

      <section id="servicos" className="content-section">
        <div>
          <span className="section-label">Suporte</span>
          <h2>Serviços e Apoio Técnico</h2>
          <p>
            A Quanton3D oferece mais que resina: entregamos a solução completa
            para sua impressão.
          </p>
        </div>

        <div className="cards-grid">
          <div
            className="info-card clickable-card"
            onClick={() => setActiveModal("formulacao")}
          >
            <h3>Formulações</h3>
            <p>Desenvolvemos cores e propriedades sob medida.</p>
          </div>

          <div
            className="info-card clickable-card"
            onClick={() => setActiveGuide(GUIDES.nivelamento)}
          >
            <h3>Treinamento</h3>
            <p>Guias técnicos e masterclasses de engenharia.</p>
          </div>

          <div
            className="info-card clickable-card"
            onClick={() => setMostrarBotTicket(true)}
          >
            <h3>Diagnóstico</h3>
            <p>Bot inteligente para resolução de falhas.</p>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div>
          <span className="section-label">Contato</span>
          <h2>Vamos conversar?</h2>
          <p>
            Nossa equipe técnica está pronta para tirar suas dúvidas e ajudar no
            seu projeto.
          </p>
        </div>

        <div className="contact-actions">
          <button type="button" onClick={() => setMostrarContatoMensagem(true)}>
            Falar com a equipe
          </button>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="whatsapp-btn">
            WhatsApp Prioritário
          </a>
        </div>

        <div className="social-footer">
          {SOCIAL_LINKS.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </section>

      <footer className="main-footer">
        <p>© 2025 Quanton3D • Elite Technical Support</p>
      </footer>
    </main>
  );
}

function ParamItem({ label, value }) {
  if (!value) return null;

  return (
    <div className="param-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PrivacidadeModal({ aceitarPrivacidade }) {
  return (
    <div className="modal-backdrop">
      <section className="site-modal privacy-modal">
        <h2>Privacidade e Termos</h2>
        <p>
          Para acessar nossa base técnica e suporte, coletamos dados básicos de
          contato. Ao continuar, você concorda com nossa política de uso.
        </p>
        <button type="button" onClick={aceitarPrivacidade}>
          Aceitar e Continuar
        </button>
      </section>
    </div>
  );
}

function CadastroInicial({
  formCliente,
  salvandoCliente,
  erroCadastro,
  alterarCliente,
  salvarCliente,
}) {
  return (
    <div className="modal-backdrop">
      <section className="site-modal register-modal">
        <div className="brand-mark" style={{ margin: "0 auto 20px" }}>
          Q3D
        </div>
        <h2>Identificação de Acesso</h2>
        <p>
          Olá! Identifique-se para liberar o acesso total aos guias e parâmetros
          da Quanton3D.
        </p>

        {erroCadastro && <div className="error-box">{erroCadastro}</div>}

        <form onSubmit={salvarCliente} className="register-form">
          <label>
            <span>Seu Nome</span>
            <input
              required
              value={formCliente.nome}
              onChange={(e) => alterarCliente("nome", e.target.value)}
              placeholder="Ex.: João Silva"
            />
          </label>

          <label>
            <span>WhatsApp</span>
            <input
              required
              value={formCliente.telefone}
              onChange={(e) => alterarCliente("telefone", e.target.value)}
              placeholder="Ex.: 31 99999-9999"
            />
          </label>

          <label>
            <span>E-mail</span>
            <input
              required
              type="email"
              value={formCliente.email}
              onChange={(e) => alterarCliente("email", e.target.value)}
              placeholder="Ex.: joao@email.com"
            />
          </label>

          <label>
            <span>Como nos conheceu?</span>
            <select
              value={formCliente.origem}
              onChange={(e) => alterarCliente("origem", e.target.value)}
            >
              {ORIGENS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={salvandoCliente}>
            {salvandoCliente ? "Salvando..." : "Liberar Acesso"}
          </button>
        </form>
      </section>
    </div>
  );
}

function GuideModal({ guide, onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="site-modal guide-modal">
        <div className="guide-header">
          <div>
            <span className="section-label">Guia Técnico</span>
            <h2>{guide.title}</h2>
          </div>
          <button type="button" onClick={onClose}>
            Fechar
          </button>
        </div>
        <iframe
          src={guide.file}
          title={guide.title}
          className="guide-iframe"
        ></iframe>
      </section>
    </div>
  );
}

function SiteModal({
  type,
  cliente,
  onClose,
  abrirGuia,
  abrirParceiroModal,
  resinas = [],
  impressoras = [],
}) {
  const titles = {
    contato: "Fale Conosco",
    sobre: "Sobre a Quanton3D",
    formulacao: "Formulação Personalizada",
    qualidade: "Alta Qualidade Quanton3D",
    galeria: "Galeria e Configurações",
    admin: "Painel Administrativo",
    bot: "Bot Quanton3D",
  };

  return (
    <div className="modal-backdrop">
      <section className="site-modal">
        <div className="guide-header">
          <div>
            <span className="section-label">Quanton3D</span>
            <h2>{titles[type] || "Informações"}</h2>
          </div>

          <button type="button" onClick={onClose}>
            Fechar
          </button>
        </div>

        {type === "contato" && <ContatoContent cliente={cliente} />}
        {type === "sobre" && <SobreContent abrirGuia={abrirGuia} abrirParceiroModal={abrirParceiroModal} />}
        {type === "formulacao" && <FormulacaoContent cliente={cliente} />}
        {type === "qualidade" && <QualidadeContent abrirGuia={abrirGuia} />}
        {type === "galeria" && (
          <GaleriaContent
            cliente={cliente}
            resinas={resinas}
            impressoras={impressoras}
          />
        )}
        {type === "admin" && <AdminContent />}
        {type === "bot" && <BotContent />}
      </section>
    </div>
  );
}

function ContatoContent({ cliente }) {
  return (
    <div className="modal-rich-content">
      <p>
        Olá {cliente?.nome || "cliente"}, escolha uma forma de atendimento. A
        próxima fase vai gravar mensagens diretamente no painel administrativo.
      </p>

      <div className="modal-action-grid">
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
          Chamar no WhatsApp
        </a>
        <a href="mailto:atendimento@quanton3d.com.br">Enviar e-mail</a>
      </div>
    </div>
  );
}

function SobreContent({ abrirGuia, abrirParceiroModal }) {
  return (
    <div className="modal-rich-content">
      <p>
        A Quanton3D é especializada em resinas UV SLA/DLP/LCD e suporte técnico
        para impressão 3D em resina. Esta reconstrução está reaproveitando os
        materiais técnicos completos do projeto antigo, agora com backend limpo.
      </p>

      <div className="modal-action-grid">
        <button type="button" onClick={() => abrirGuia("parceiros")}>
          Ver parceiros e cursos
        </button>
        <button type="button" onClick={() => abrirGuia("diagnostico")}>
          Guia de diagnóstico
        </button>
        <button type="button" onClick={abrirParceiroModal}>
          Quero ser parceiro
        </button>
      </div>
    </div>
  );
}

function FormulacaoContent({ cliente }) {
  const [form, setForm] = useState({
    nome: cliente?.nome || "",
    telefone: cliente?.telefone || "",
    email: cliente?.email || "",
    cor: "",
    aplicacao: "",
    dureza: "",
    flexibilidade: "",
    resistencia: "",
    observacoes: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!form.nome.trim() || !form.telefone.trim() || !form.aplicacao.trim()) {
      setErro("Preencha nome, WhatsApp e aplicação desejada.");
      return;
    }

    try {
      setEnviando(true);
      await api.post("/formulacoes", {
        ...form,
        caracteristica: [
          form.aplicacao,
          form.dureza && `Dureza: ${form.dureza}`,
          form.flexibilidade && `Flexibilidade: ${form.flexibilidade}`,
          form.resistencia && `Resistência: ${form.resistencia}`,
        ]
          .filter(Boolean)
          .join(" | "),
        detalhes: form.observacoes,
      });
      setSucesso("Pedido de formulação enviado para análise técnica.");
      setForm((atual) => ({
        ...atual,
        cor: "",
        aplicacao: "",
        dureza: "",
        flexibilidade: "",
        resistencia: "",
        observacoes: "",
      }));
    } catch (error) {
      console.error("Erro ao enviar formulação:", error);
      setErro(error?.response?.data?.error || "Não foi possível enviar o pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="modal-rich-content" onSubmit={enviar}>
      <p>
        Solicite uma formulação personalizada para uma necessidade específica de
        cor, dureza, flexibilidade, resistência ou aplicação.
      </p>

      {erro && <div className="modal-error">{erro}</div>}
      {sucesso && <div className="modal-success">{sucesso}</div>}

      <div className="form-grid">
        <label>
          <span>Nome *</span>
          <input value={form.nome} onChange={(e) => alterar("nome", e.target.value)} />
        </label>

        <label>
          <span>WhatsApp *</span>
          <input value={form.telefone} onChange={(e) => alterar("telefone", e.target.value)} />
        </label>

        <label>
          <span>E-mail</span>
          <input type="email" value={form.email} onChange={(e) => alterar("email", e.target.value)} />
        </label>

        <label>
          <span>Cor desejada</span>
          <input value={form.cor} onChange={(e) => alterar("cor", e.target.value)} placeholder="Ex.: cinza, translúcida, preta" />
        </label>

        <label>
          <span>Aplicação *</span>
          <input value={form.aplicacao} onChange={(e) => alterar("aplicacao", e.target.value)} placeholder="Ex.: peça funcional, odontologia, miniatura" />
        </label>

        <label>
          <span>Dureza desejada</span>
          <input value={form.dureza} onChange={(e) => alterar("dureza", e.target.value)} placeholder="Ex.: rígida, média, flexível" />
        </label>

        <label>
          <span>Flexibilidade</span>
          <input value={form.flexibilidade} onChange={(e) => alterar("flexibilidade", e.target.value)} placeholder="Ex.: baixa, média, alta" />
        </label>

        <label>
          <span>Resistência</span>
          <input value={form.resistencia} onChange={(e) => alterar("resistencia", e.target.value)} placeholder="Ex.: impacto, temperatura, desgaste" />
        </label>

        <label className="form-full">
          <span>Observações</span>
          <textarea
            rows="4"
            value={form.observacoes}
            onChange={(e) => alterar("observacoes", e.target.value)}
            placeholder="Descreva o comportamento esperado, limitações e uso final."
          />
        </label>
      </div>

      <div className="modal-action-grid">
        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar pedido"}
        </button>
      </div>
    </form>
  );
}

function QualidadeContent({ abrirGuia }) {
  return (
    <div className="modal-rich-content">
      <p>
        A área de qualidade reunirá descrições de resinas, indicações,
        características técnicas e documentos. Por enquanto, os guias completos
        já podem ser carregados abaixo.
      </p>

      <div className="modal-action-grid">
        <button type="button" onClick={() => abrirGuia("otimizacao")}>
          Otimização e acabamento
        </button>
        <button type="button" onClick={() => abrirGuia("calibracaoQuanton3D")}>
          Calibração Quanton3D
        </button>
      </div>
    </div>
  );
}

function GaleriaContent({ cliente, resinas = [], impressoras = [] }) {
  const [form, setForm] = useState({
    nome: cliente?.nome || "",
    telefone: cliente?.telefone || "",
    email: cliente?.email || "",
    resina: "",
    impressora: "",
    alturaCamada: "",
    exposicaoNormal: "",
    exposicaoBase: "",
    camadasBase: "",
    observacao: "",
  });
  const [imagem, setImagem] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!form.nome.trim() || !form.telefone.trim()) {
      setErro("Preencha nome e WhatsApp.");
      return;
    }

    try {
      setEnviando(true);
      const dados = new FormData();
      Object.entries(form).forEach(([campo, valor]) => {
        dados.append(campo, String(valor || "").trim());
      });
      if (imagem) dados.append("imagem", imagem);

      await api.post("/gallery", dados, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSucesso("Configuração enviada para análise antes de aparecer na galeria.");
      setImagem(null);
      setForm((atual) => ({
        ...atual,
        resina: "",
        impressora: "",
        alturaCamada: "",
        exposicaoNormal: "",
        exposicaoBase: "",
        camadasBase: "",
        observacao: "",
      }));
    } catch (error) {
      console.error("Erro ao enviar galeria:", error);
      setErro(error?.response?.data?.error || "Não foi possível enviar a configuração.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="modal-rich-content" onSubmit={enviar}>
      <p>
        Compartilhe uma foto e os parâmetros usados para ajudar a base técnica
        da Quanton3D. O envio fica pendente até aprovação no painel.
      </p>

      {erro && <div className="modal-error">{erro}</div>}
      {sucesso && <div className="modal-success">{sucesso}</div>}

      <div className="form-grid">
        <label>
          <span>Nome *</span>
          <input value={form.nome} onChange={(e) => alterar("nome", e.target.value)} />
        </label>

        <label>
          <span>WhatsApp *</span>
          <input value={form.telefone} onChange={(e) => alterar("telefone", e.target.value)} />
        </label>

        <label>
          <span>E-mail</span>
          <input type="email" value={form.email} onChange={(e) => alterar("email", e.target.value)} />
        </label>

        <label>
          <span>Resina</span>
          <select value={form.resina} onChange={(e) => alterar("resina", e.target.value)}>
            <option value="">Selecione</option>
            {resinas.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <label>
          <span>Impressora</span>
          <select value={form.impressora} onChange={(e) => alterar("impressora", e.target.value)}>
            <option value="">Selecione</option>
            {impressoras.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>

        <label>
          <span>Altura Camada</span>
          <input value={form.alturaCamada} onChange={(e) => alterar("alturaCamada", e.target.value)} />
        </label>

        <label>
          <span>Exposição Normal</span>
          <input value={form.exposicaoNormal} onChange={(e) => alterar("exposicaoNormal", e.target.value)} />
        </label>

        <label>
          <span>Exposição Base</span>
          <input value={form.exposicaoBase} onChange={(e) => alterar("exposicaoBase", e.target.value)} />
        </label>

        <label>
          <span>Camadas Base</span>
          <input value={form.camadasBase} onChange={(e) => alterar("camadasBase", e.target.value)} />
        </label>

        <label className="form-full">
          <span>Foto da peça</span>
          <input type="file" onChange={(e) => setImagem(e.target.files[0])} accept="image/*" />
        </label>

        <label className="form-full">
          <span>Observação</span>
          <textarea rows="3" value={form.observacao} onChange={(e) => alterar("observacao", e.target.value)} />
        </label>
      </div>

      <div className="modal-action-grid">
        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Compartilhar"}
        </button>
      </div>
    </form>
  );
}

function AdminContent() {
  return <div className="modal-rich-content"><p>Acesse o painel unificado pelo menu superior.</p></div>;
}

function BotContent() {
  return <div className="modal-rich-content"><p>O bot técnico agora abre em uma janela dedicada.</p></div>;
}

export default App;
