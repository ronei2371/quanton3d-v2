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
  "WhatsApp",
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
  { label: "WhatsApp", href: "https://wa.me/553132716935" },
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

      const clienteSalvo =
        resposta.data?.cliente ||
        resposta.data?.data ||
        resposta.data?.client ||
        payload;

      const clienteFinal = {
        ...payload,
        ...clienteSalvo,
      };

      localStorage.setItem("quanton3d_cliente", JSON.stringify(clienteFinal));

      setCliente(clienteFinal);
      setMostrarCadastro(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      setErroCadastro("Erro ao salvar seus dados. Tente novamente.");
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
              <ParamItem
                label="Descanso Antes Elevação"
                value={resultado.descansoAntesElevacao}
              />
              <ParamItem
                label="Descanso Após Elevação"
                value={resultado.descansoAposElevacao}
              />
              <ParamItem
                label="Descanso Após Retração"
                value={resultado.descansoAposRetracao}
              />
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
          <InfoCard
            title="Alta Qualidade"
            text="Conheça linhas, aplicações, FISPQs e características técnicas."
            onClick={() => setActiveModal("qualidade")}
          />

          <InfoCard
            title="Parâmetros detalhados"
            text="Abra o guia completo para entender cada campo do Chitubox."
            onClick={() => abrirGuia("parametrosDetalhados")}
          />

          <InfoCard
            title="Parceiros e cursos"
            text="Veja parceiros, pintores, cursos e serviços recomendados."
            onClick={() => abrirGuia("parceiros")}
          />

          <InfoCard
            title="Quero ser parceiro"
            text="Envie sua proposta para divulgar seu curso, serviço, projeto ou trabalho."
            onClick={abrirParceiroModal}
          />
        </div>
      </section>

      <section id="servicos" className="content-section">
        <div>
          <span className="section-label">Guias técnicos completos</span>
          <h2>Atendimento especializado para impressão 3D em resina</h2>
          <p>
            Esses botões carregam os arquivos HTML completos do material antigo,
            com imagens, textos e passos técnicos.
          </p>
        </div>

        <div className="service-list">
          <ServiceLine title="Nivelamento de plataforma" onClick={() => abrirGuia("nivelamento")} />
          <ServiceLine title="Configuração de fatiador" onClick={() => abrirGuia("fatiadores")} />
          <ServiceLine title="Calibração de resina" onClick={() => abrirGuia("calibracao")} />
          <ServiceLine title="Manutenção de máquina" onClick={() => abrirGuia("manutencao")} />
          <ServiceLine title="Diagnóstico de problemas" onClick={() => abrirGuia("diagnostico")} />
          <ServiceLine title="Posicionamento de suportes" onClick={() => abrirGuia("suportes")} />
        </div>
      </section>

      <section id="formulacao" className="formulation-section">
        <div>
          <span className="section-label">Formulação personalizada</span>
          <h2>Precisa de uma resina com comportamento específico?</h2>
          <p>
            A área de formulação será integrada ao painel administrativo na
            próxima fase.
          </p>
        </div>

        <button type="button" onClick={() => setActiveModal("formulacao")}>
          Solicitar formulação personalizada
        </button>
      </section>

      <section id="contato" className="contact-section">
        <div>
          <span className="section-label">Contato</span>
          <h2>Atendimento Quanton3D</h2>
          <p>
            Cliente ativo: {cliente?.nome || "não identificado"}. O atendimento
            técnico usará seu cadastro para manter histórico e melhorar as
            respostas.
          </p>
        </div>

        <div className="contact-actions">
          <button type="button" onClick={abrirCadastro}>
            Atualizar meus dados
          </button>

          <button type="button" onClick={() => setMostrarContatoMensagem(true)}>
            Fale conosco
          </button>
        </div>
      </section>

      <footer id="sobre" className="site-footer">
        <strong>© 2025 Quanton3D</strong>
        <span>Fabricação especializada de resinas UV SLA/DLP</span>
      </footer>
    </main>
  );
}

function PrivacidadeModal({ aceitarPrivacidade }) {
  const [confirmouAceite, setConfirmouAceite] = useState(false);

  return (
    <div className="modal-backdrop">
      <section className="privacy-modal">
        <div className="modal-icon">🔒</div>

        <h2>Termo de Privacidade e Consentimento</h2>

        <p>
          Antes de acessar o suporte técnico da Quanton3D, leia com atenção este
          termo. Ao continuar, você declara estar ciente sobre como seus dados
          poderão ser usados para atendimento, suporte técnico e melhoria dos
          serviços.
        </p>

        <div className="privacy-content">
          <h3>1. Dados que poderão ser coletados</h3>
          <p>
            A Quanton3D poderá coletar e armazenar dados informados por você,
            incluindo nome, WhatsApp, e-mail, origem do contato, data e horário
            de acesso, mensagens enviadas no atendimento, dúvidas técnicas,
            resina utilizada, impressora utilizada, parâmetros de impressão,
            pedidos de formulação personalizada e imagens ou fotos enviadas
            voluntariamente para análise técnica.
          </p>

          <h3>2. Finalidade do uso dos dados</h3>
          <p>
            Os dados serão utilizados para liberar o acesso ao suporte técnico,
            responder dúvidas sobre resinas e impressão 3D, analisar problemas
            relatados, manter histórico de atendimento, acompanhar solicitações,
            organizar pedidos de formulação, melhorar a base de conhecimento da
            Quanton3D e permitir contato comercial relacionado aos serviços
            solicitados pelo próprio usuário.
          </p>

          <h3>3. Uso de imagens enviadas</h3>
          <p>
            Caso você envie fotos de peças, falhas de impressão, configurações
            ou resultados obtidos, essas imagens poderão ser usadas para análise
            técnica, orientação de parâmetros e melhoria do suporte. Imagens não
            serão publicadas em galeria pública sem autorização ou aprovação
            específica.
          </p>

          <h3>4. Compartilhamento e segurança</h3>
          <p>
            A Quanton3D não deve vender seus dados pessoais. As informações
            poderão ser armazenadas em sistemas necessários para funcionamento
            do site, banco de dados, atendimento e ferramentas técnicas usadas
            para prestar suporte. Serão adotadas medidas razoáveis para proteger
            os dados contra acesso não autorizado, perda, alteração ou uso
            indevido.
          </p>

          <h3>5. Histórico e melhoria do atendimento</h3>
          <p>
            As conversas, perguntas, avaliações de respostas e informações
            técnicas poderão ser mantidas para melhorar a qualidade do suporte,
            evitar perda de contexto e permitir que a equipe Quanton3D acompanhe
            melhor cada caso.
          </p>

          <h3>6. Direitos do usuário</h3>
          <p>
            Você poderá solicitar acesso, correção, atualização ou exclusão dos
            seus dados pessoais, quando aplicável. Também poderá pedir
            esclarecimentos sobre o uso das informações fornecidas.
          </p>

          <h3>7. Consentimento</h3>
          <p>
            Ao marcar a opção abaixo e continuar, você confirma que leu este
            termo e autoriza a Quanton3D a tratar seus dados para as finalidades
            descritas acima.
          </p>
        </div>

        <label className="privacy-accept-row">
          <input
            type="checkbox"
            checked={confirmouAceite}
            onChange={(e) => setConfirmouAceite(e.target.checked)}
          />

          <span>
            Li e aceito o Termo de Privacidade e autorizo o uso dos meus dados
            para atendimento, suporte técnico e serviços relacionados à
            Quanton3D.
          </span>
        </label>

        <button
          type="button"
          className="submit-registration"
          disabled={!confirmouAceite}
          onClick={aceitarPrivacidade}
        >
          Aceitar e continuar
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
      <form className="registration-modal" onSubmit={salvarCliente}>
        <div className="modal-header">
          <div className="modal-icon">👥</div>

          <div>
            <h2>Seja bem-vindo!</h2>
            <p>Identifique-se para liberar o suporte técnico especializado.</p>
            <p style={{ marginTop: 6, fontSize: "12px", color: "#6b7280" }}>
              Site e bot funcionam juntos: você navega no site e aciona o bot técnico no mesmo painel.
            </p>
          </div>
        </div>

        {erroCadastro && <div className="modal-error">{erroCadastro}</div>}

        <div className="form-grid">
          <label>
            <span>Seu Nome *</span>

            <input
              value={formCliente.nome}
              onChange={(e) => alterarCliente("nome", e.target.value)}
              placeholder="Digite seu nome"
            />
          </label>

          <label>
            <span>WhatsApp *</span>

            <input
              value={formCliente.telefone}
              onChange={(e) => alterarCliente("telefone", e.target.value)}
              placeholder="DDD + número"
            />
          </label>

          <label>
            <span>E-mail *</span>

            <input
              type="email"
              value={formCliente.email}
              onChange={(e) => alterarCliente("email", e.target.value)}
              placeholder="seu@email.com"
            />
          </label>

          <label>
            <span>Como nos conheceu? *</span>

            <select
              value={formCliente.origem}
              onChange={(e) => alterarCliente("origem", e.target.value)}
            >
              {ORIGENS.map((origem) => (
                <option key={origem} value={origem}>
                  {origem}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="social-box">
          <strong>Siga a Quanton3D nas redes</strong>

          <div style={{ flexWrap: "wrap" }}>
            {SOCIAL_LINKS.map((rede) => (
              <a key={rede.label} href={rede.href} target="_blank" rel="noreferrer">
                {rede.label}
              </a>
            ))}
          </div>
        </div>

        <button className="submit-registration" type="submit" disabled={salvandoCliente}>
          {salvandoCliente ? "Salvando..." : "Entrar no Suporte Técnico"}
        </button>
      </form>
    </div>
  );
}



function GuideModal({ guide, onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="guide-modal">
        <div className="guide-header">
          <div>
            <span className="section-label">Guia técnico</span>
            <h2>{guide.title}</h2>
          </div>

          <button type="button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <iframe title={guide.title} src={guide.file} className="guide-frame" />
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
            {resinas.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Impressora</span>
          <select value={form.impressora} onChange={(e) => alterar("impressora", e.target.value)}>
            <option value="">Selecione</option>
            {impressoras.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Altura de camada</span>
          <input value={form.alturaCamada} onChange={(e) => alterar("alturaCamada", e.target.value)} placeholder="Ex.: 0.05" />
        </label>

        <label>
          <span>Exposição normal</span>
          <input value={form.exposicaoNormal} onChange={(e) => alterar("exposicaoNormal", e.target.value)} placeholder="Ex.: 2.2" />
        </label>

        <label>
          <span>Exposição base</span>
          <input value={form.exposicaoBase} onChange={(e) => alterar("exposicaoBase", e.target.value)} placeholder="Ex.: 35" />
        </label>

        <label>
          <span>Camadas base</span>
          <input value={form.camadasBase} onChange={(e) => alterar("camadasBase", e.target.value)} placeholder="Ex.: 5" />
        </label>

        <label>
          <span>Foto</span>
          <input type="file" accept="image/*" onChange={(e) => setImagem(e.target.files?.[0] || null)} />
        </label>

        <label className="form-full">
          <span>Observação</span>
          <textarea
            rows="4"
            value={form.observacao}
            onChange={(e) => alterar("observacao", e.target.value)}
            placeholder="Conte o resultado, ajustes ou problema resolvido."
          />
        </label>
      </div>

      <div className="modal-action-grid">
        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar configuração"}
        </button>
      </div>
    </form>
  );
}

function AdminContent() {
  return (
    <div className="modal-rich-content">
      <p>
        O painel administrativo definitivo entra depois que finalizarmos as telas
        públicas.
      </p>

      <div className="modal-action-grid">
        <a href="http://localhost:10000/api/clientes" target="_blank" rel="noreferrer">
          Ver clientes API
        </a>
        <a href="http://localhost:10000/api/parametros" target="_blank" rel="noreferrer">
          Ver parâmetros API
        </a>
        <a href="http://localhost:10000/api/partner-requests" target="_blank" rel="noreferrer">
          Ver parceiros API
        </a>
      </div>
    </div>
  );
}

function BotContent() {
  return (
    <div className="modal-rich-content">
      <p>
        O bot está suspenso por enquanto para não quebrar o que já está
        funcionando. Vamos religar a inteligência dele em uma fase própria, com
        regras de resina, imagem e parâmetros.
      </p>
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
