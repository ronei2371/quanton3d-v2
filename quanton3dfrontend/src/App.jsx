import { useCallback, useEffect, useState, useRef } from "react";
import api from "./api";
import "./App.css";
import ContactMessageModal from "./components/ContactMessageModal";
import PartnerRequestModal from "./components/PartnerRequestModal";
import CalculadoraExposicao from "./components/CalculadoraExposicao";
import CalculadoraVolume from "./components/CalculadoraVolume";

const WHATSAPP_URL = "https://wa.me/553132716935";
const SOCIAL_LINKS = [
  { label: "Instagram", url: "https://www.instagram.com/quanton3d" },
  { label: "YouTube", url: "https://www.youtube.com/@quanton3d" },
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
    console.error("Erro ao ler cliente salvo:", err);
    return null;
  }
}

function getPrivacidadeAceita() {
  return localStorage.getItem("quanton3d_privacidade_aceita") === "true";
}

function limparTexto(valor) {
  return String(valor || "").trim();
}

function corrigirNomeResina(nome) {
  return limparTexto(nome)
    .replace(/^FERRO\s*70\/30\b/i, "IRON 70/30")
    .replace(/^FERRO\s*7030\b/i, "IRON 7030")
    .replace(/^FERRO\b/i, "IRON")
    .replace(/^Iron\b/i, "IRON")
    .replace(/^iron\b/i, "IRON");
}

function chaveResina(nome) {
  return corrigirNomeResina(nome).toUpperCase();
}


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
  const [clienteSalvoInicial] = useState(() => getClienteSalvo());
  const [privacidadeAceitaInicial] = useState(() => getPrivacidadeAceita());
  const [parametros, setParametros] = useState([]);
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cliente, setCliente] = useState(clienteSalvoInicial);
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(!privacidadeAceitaInicial);
  const [mostrarCadastro, setMostrarCadastro] = useState(privacidadeAceitaInicial && !clienteSalvoInicial);
  const [formCliente, setFormCliente] = useState({ nome: "", telefone: "", email: "", origem: "Instagram" });
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null);
  const [mostrarContatoMensagem, setMostrarContatoMensagem] = useState(false);
  const [mostrarParceiroModal, setMostrarParceiroModal] = useState(false);

 codex/revise-code-to-identify-errors-y4xdq2



codex/revise-code-to-identify-errors-s1mcto

codex/revise-code-to-identify-errors-9rfnjr

 main
main
 main
  async function carregarParametros() {
    try {
      setCarregando(true);
      setErro("");
      const res = await api.get("/parametros");
      const lista = res.data?.data || res.data?.parametros || [];
      const listaCorrigida = lista.map((item) => ({
        ...item,
        resina: corrigirNomeResina(item.resina),
        impressora: limparTexto(item.impressora),
        marca: limparTexto(item.marca),
      }));
      setParametros(listaCorrigida);
    } catch (err) {
      console.error("Erro ao carregar parâmetros:", err);
      setErro("Não foi possível carregar os parâmetros técnicos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const carregamentoInicial = setTimeout(carregarParametros, 0);
    return () => clearTimeout(carregamentoInicial);
  }, []);

  const resinas = Array.from(
    new Set(parametros.map((item) => corrigirNomeResina(item.resina)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const impressoras = Array.from(
    new Set(
      parametros
        .filter((item) => chaveResina(item.resina) === chaveResina(resinaSelecionada) && item.impressora)
        .map((item) => (item.marca ? `${item.marca} - ${item.impressora}` : item.impressora))
    )
  ).sort((a, b) => a.localeCompare(b));

  const totalImpressoras = new Set(
    parametros
      .filter((item) => item.impressora)
      .map((item) => `${item.marca || ""}-${item.impressora}`)
  ).size;

  function selecionarResina(nome) {
    setResinaSelecionada(nome);
    setImpressoraSelecionada("");
    setResultado(null);
  }

  function selecionarImpressora(valor) {
    setImpressoraSelecionada(valor);
    const nomeModelo = valor.includes(" - ") ? valor.split(" - ").slice(1).join(" - ") : valor;
    const marcaModelo = valor.includes(" - ") ? valor.split(" - ")[0] : "";
    const p = parametros.find((item) => {
      const mesmaResina = chaveResina(item.resina) === chaveResina(resinaSelecionada);
      const mesmaImpressora = item.impressora === nomeModelo;
      const mesmaMarca = !marcaModelo || item.marca === marcaModelo;
      return mesmaResina && mesmaImpressora && mesmaMarca;
    });
    setResultado(p || null);
  }

  function aceitarPrivacidade() {
    localStorage.setItem("quanton3d_privacidade_aceita", "true");
    setMostrarPrivacidade(false);
    setMostrarCadastro(!cliente);
  }

  function abrirCadastro() {
    setErroCadastro("");
    if (!getPrivacidadeAceita()) {
      setMostrarPrivacidade(true);
      return;
    }
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
            <button type="button" onClick={() => setActiveModal("admGaleria")}>ADM Galeria</button>
            <button type="button" onClick={abrirCadastro}>Cliente</button>
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
          <ServiceLine title="Gabarito Quanton3D" onClick={() => abrirGuia("calibracaoQuanton3D")} />
          <ServiceLine title="Diagnóstico de problemas" onClick={() => abrirGuia("diagnostico")} />
          <ServiceLine title="Posicionamento de suportes" onClick={() => abrirGuia("suportes")} />
          <ServiceLine title="Manutenção de máquina" onClick={() => abrirGuia("manutencao")} />
          <ServiceLine title="Otimização e pós-processamento" onClick={() => abrirGuia("otimizacao")} />
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
            <select value={impressoraSelecionada} onChange={(e) => selecionarImpressora(e.target.value)} disabled={!resinaSelecionada || impressoras.length === 0}>
              <option value="">{resinaSelecionada ? "Selecione a impressora" : "Escolha uma resina primeiro"}</option>
              {impressoras.map((i) => <option key={i} value={i}>{i}</option>)}
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
              <h3>{corrigirNomeResina(resultado.resina)} + {resultado.marca} {resultado.impressora}</h3>
              <button type="button" onClick={copiarParametros}>Copiar parâmetros</button>
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

      <footer className="site-footer">
        <span>Quanton3D © Suporte técnico e resinas UV de alta performance.</span>
        <div className="footer-social-links">
          {SOCIAL_LINKS.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}

function PrivacidadeModal({ aceitarPrivacidade }) {
  const [confirmouAceite, setConfirmouAceite] = useState(false);
  return (
    <div className="modal-backdrop">
      <section className="privacy-modal">
        <div className="modal-icon">🔐</div>
        <h2>Termo de Privacidade e Consentimento</h2>
        <p>
          Antes de acessar o suporte técnico da Quanton3D, leia com atenção este termo.
          Ao continuar, você declara estar ciente sobre como seus dados poderão ser usados
          para atendimento, suporte técnico e melhoria dos serviços.
        </p>
        <div className="privacy-content">
          <h3>1. Dados que poderão ser coletados</h3>
          <p>
            A Quanton3D poderá coletar e armazenar dados informados por você, incluindo
            nome, WhatsApp, e-mail, origem do contato, data e horário de acesso, mensagens
            enviadas no atendimento, dúvidas técnicas, resina utilizada, impressora utilizada,
            parâmetros de impressão, pedidos de formulação personalizada e imagens ou fotos
            enviadas voluntariamente para análise técnica.
          </p>
          <h3>2. Finalidade do uso dos dados</h3>
          <p>
            Os dados serão utilizados para liberar o acesso ao suporte técnico, responder dúvidas
            sobre resinas e impressão 3D, analisar problemas relatados, manter histórico de atendimento,
            acompanhar solicitações, organizar pedidos de formulação, melhorar a base de conhecimento
            da Quanton3D e permitir contato comercial relacionado aos serviços solicitados pelo próprio usuário.
          </p>
          <h3>3. Uso de imagens enviadas</h3>
          <p>
            Caso você envie fotos de peças, falhas de impressão, configurações ou resultados obtidos,
            essas imagens poderão ser usadas para análise técnica, orientação de parâmetros e melhoria
            do suporte. Imagens não serão publicadas em galeria pública sem autorização ou aprovação específica.
          </p>
          <h3>4. Compartilhamento e segurança</h3>
          <p>
            A Quanton3D não deve vender seus dados pessoais. As informações poderão ser armazenadas
            em sistemas necessários para funcionamento do site, banco de dados, atendimento e ferramentas
            técnicas usadas para prestar suporte. Serão adotadas medidas razoáveis para proteger os dados
            contra acesso não autorizado, perda, alteração ou uso indevido.
          </p>
          <h3>5. Histórico e melhoria do atendimento</h3>
          <p>
            As conversas, perguntas, avaliações de respostas e informações técnicas poderão ser mantidas
            para melhorar a qualidade do suporte, evitar perda de contexto e permitir que a equipe Quanton3D
            acompanhe melhor cada caso.
          </p>
          <h3>6. Direitos do usuário</h3>
          <p>
            Você poderá solicitar acesso, correção, atualização ou exclusão dos seus dados pessoais,
            quando aplicável. Também poderá pedir esclarecimentos sobre o uso das informações fornecidas.
          </p>
          <h3>7. Consentimento</h3>
          <p>
            Ao marcar a opção abaixo e continuar, você confirma que leu este termo e autoriza a Quanton3D
            a tratar seus dados para as finalidades descritas acima.
          </p>
        </div>
        <label className="privacy-accept-row">
          <input type="checkbox" checked={confirmouAceite} onChange={(e) => setConfirmouAceite(e.target.checked)} />
          <span>Li e aceito o Termo de Privacidade e autorizo o uso dos meus dados para atendimento, suporte técnico e serviços relacionados à Quanton3D.</span>
        </label>
        <button className="submit-registration" disabled={!confirmouAceite} onClick={aceitarPrivacidade}>Aceitar e continuar</button>
      </section>
    </div>
  );
}

function CadastroInicial({ formCliente, salvandoCliente, erroCadastro, alterarCliente, salvarCliente }) {
  return (
    <div className="modal-backdrop">
      <form className="registration-modal" onSubmit={salvarCliente}>
        <h2>Seja bem-vindo!</h2>
        <p>Identifique-se para liberar o suporte técnico especializado.</p>
        {erroCadastro && <div className="modal-error">{erroCadastro}</div>}
        <div className="form-grid">
          <label><span>Seu Nome</span><input value={formCliente.nome} onChange={(e) => alterarCliente("nome", e.target.value)} placeholder="Digite seu nome" /></label>
          <label><span>WhatsApp</span><input value={formCliente.telefone} onChange={(e) => alterarCliente("telefone", e.target.value)} placeholder="DDD + número" /></label>
          <label><span>E-mail</span><input value={formCliente.email} onChange={(e) => alterarCliente("email", e.target.value)} placeholder="seu@email.com" /></label>
          <label><span>Como nos conheceu?</span>
            <select value={formCliente.origem} onChange={(e) => alterarCliente("origem", e.target.value)}>
              {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <div className="social-box">
          <strong>Siga a Quanton3D nas redes</strong>
          <div>
            {SOCIAL_LINKS.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
            ))}
          </div>
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
          <h2>{guide.title}</h2>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>
        <iframe title={guide.title} src={guide.file} className="guide-frame" />
      </section>
    </div>
  );
}

function SiteModal({ type, cliente, onClose, abrirGuia, abrirParceiroModal }) {
  const titles = { contato: "Fale Conosco", sobre: "Sobre a Quanton3D", formulacao: "Formulação Personalizada", galeria: "Galeria e Configurações", admGaleria: "ADM Galeria", qualidade: "Alta Qualidade", calc_exp: "Calculadora de Exposição", calc_vol: "Calculadora de Volume", bot: "Bot Quanton3D" };
  return (
    <div className="modal-backdrop">
      <section className="site-modal">
        <div className="guide-header">
          <h2>{titles[type] || "Informações"}</h2>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>
        {type === "contato" && <ContatoContent cliente={cliente} />}
        {type === "sobre" && <SobreContent abrirGuia={abrirGuia} abrirParceiroModal={abrirParceiroModal} />}
        {type === "formulacao" && <FormulacaoContent cliente={cliente} />}
        {type === "galeria" && <GaleriaContent cliente={cliente} />}
        {type === "admGaleria" && <AdminGaleriaContent />}
        {type === "qualidade" && <QualidadeContent abrirGuia={abrirGuia} />}
        {type === "calc_exp" && <CalculadoraExposicao />}
        {type === "calc_vol" && <CalculadoraVolume />}
        {type === "bot" && <BotContent cliente={cliente} />}
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

function FormulacaoContent({ cliente }) {
  const [form, setForm] = useState({ caracteristica: "", cor: "", detalhes: "" });
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function enviar() {
    try {
      setEnviando(true);
      await api.post("/formulacoes", { ...form, clienteId: cliente?._id });
      setSucesso(true);
    } catch (err) {
      console.error("Erro ao enviar pedido de formulação:", err);
      alert("Erro ao enviar pedido.");
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) return <div className="modal-success">Pedido enviado com sucesso!</div>;

  return (
    <div className="modal-rich-content">
      <p>Solicite uma resina com propriedades específicas.</p>
      <div className="modal-form-layout" style={{marginTop: "20px"}}>
        <div className="form-grid">
          <label><span>Aplicação</span><input value={form.caracteristica} onChange={(e) => setForm({...form, caracteristica: e.target.value})} placeholder="Ex.: Guia Cirúrgico" /></label>
          <label><span>Cor</span><input value={form.cor} onChange={(e) => setForm({...form, cor: e.target.value})} placeholder="Ex.: Transparente" /></label>
          <label className="partner-grid-full"><textarea rows="3" value={form.detalhes} onChange={(e) => setForm({...form, detalhes: e.target.value})} placeholder="Descreva sua necessidade." /></label>
        </div>
        <button type="button" className="submit-registration" onClick={enviar} disabled={enviando}>{enviando ? "Enviando..." : "Solicitar Estudo"}</button>
      </div>
    </div>
  );
}

const CAMPOS_CONFIGURACAO_GALERIA = [
  { name: "alturaCamada", label: "Altura camada", placeholder: "Ex.: 0,050 mm" },
  { name: "camadasBase", label: "Camadas de base", placeholder: "Ex.: 4" },
  { name: "exposicaoNormal", label: "Tempo exposição", placeholder: "Ex.: 2,100 s" },
  { name: "exposicaoBase", label: "Tempo exposição base", placeholder: "Ex.: 37,000 s" },
  { name: "contagemTransicao", label: "Contagem de transição", placeholder: "Ex.: 0" },
  { name: "tipoTransicao", label: "Tipo de transição", placeholder: "Ex.: Linear" },
  { name: "retardoDesligarUV", label: "Retardo desligar UV", placeholder: "Ex.: 2,000 s" },
  { name: "distElevacaoInferior", label: "Dist. elevação inferior", placeholder: "Ex.: 11,000 mm" },
  { name: "distElevacao", label: "Distância elevação", placeholder: "Ex.: 11,000 mm" },
  { name: "distRetracao", label: "Distância de retração", placeholder: "Ex.: 11,000 mm" },
  { name: "velElevacaoInferior", label: "Vel. elevação inferior", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velElevacao", label: "Vel. elevação", placeholder: "Ex.: 140,000 mm/min" },
  { name: "velRetracaoInferior", label: "Vel. retração inferior", placeholder: "Ex.: 135,000 mm/min" },
  { name: "velRetracao", label: "Vel. retração", placeholder: "Ex.: 135,000 mm/min" },
];

function criarConfiguracaoVazia() {
  return CAMPOS_CONFIGURACAO_GALERIA.reduce((acc, campo) => {
    acc[campo.name] = "";
    return acc;
  }, {});
}

function GaleriaContent({ cliente }) {
  const [aba, setAba] = useState("enviar");
  const [form, setForm] = useState({
    resina: "",
    impressora: "",
    observacao: "",
    parametros: criarConfiguracaoVazia(),
  });
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
        setCarregandoItens(true);
        setErroItens("");
        const resposta = await api.get("/gallery");
        const lista = Array.isArray(resposta.data?.data) ? resposta.data.data : [];
        if (ativo) setItens(lista);
      } catch (err) {
        console.error("Erro ao carregar galeria aprovada:", err);
        if (ativo) setErroItens("Não foi possível carregar as fotos aprovadas agora.");
      } finally {
        if (ativo) setCarregandoItens(false);
      }
    }

    carregarGaleria();

    return () => {
      ativo = false;
    };
  }, [aba]);

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function alterarParametro(campo, valor) {
    setForm((atual) => ({
      ...atual,
      parametros: {
        ...atual.parametros,
        [campo]: valor,
      },
    }));
  }

  async function enviar(event) {
    event.preventDefault();

    if (!form.resina.trim() || !form.impressora.trim() || !foto) {
      alert("Preencha a resina, a impressora e envie uma foto do trabalho.");
      return;
    }

    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append("nome", cliente?.nome || "");
      formData.append("telefone", cliente?.telefone || "");
      formData.append("email", cliente?.email || "");
      formData.append("resina", form.resina);
      formData.append("impressora", form.impressora);
      formData.append("observacao", form.observacao);
      formData.append("clienteId", cliente?._id || cliente?.id || "");
      formData.append("fotos", foto);

      Object.entries(form.parametros).forEach(([campo, valor]) => {
        formData.append(`parametros.${campo}`, valor);
      });

      await api.post("/gallery", formData);
      setSucesso(true);
      setForm({
        resina: "",
        impressora: "",
        observacao: "",
        parametros: criarConfiguracaoVazia(),
      });
      setFoto(null);
    } catch (err) {
      console.error("Erro ao enviar para galeria:", err);
      alert("Erro ao enviar para galeria.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-rich-content gallery-content">
      <p>
        Envie uma foto real da peça e os campos de configuração usados no Chitubox.
        O envio fica pendente até aprovação no painel administrativo.
      </p>

      <div className="gallery-tabs" role="tablist" aria-label="Galeria e configurações">
        <button
          type="button"
          className={aba === "enviar" ? "active" : ""}
          onClick={() => setAba("enviar")}
        >
          📷 Enviar configuração
        </button>
        <button
          type="button"
          className={aba === "ver" ? "active" : ""}
          onClick={() => setAba("ver")}
        >
          Ver fotos de clientes e configurações
        </button>
 codex/revise-code-to-identify-errors-y4xdq2

 codex/revise-code-to-identify-errors-s1mcto

 codex/revise-code-to-identify-errors-9rfnjr
 main
main
      </div>

      {aba === "enviar" ? (
        <form className="modal-form-layout" style={{ marginTop: "20px" }} onSubmit={enviar}>
          {sucesso ? (
            <div className="modal-success">
              Enviado com sucesso! A foto e as configurações aguardam aprovação antes de aparecerem para outros clientes.
            </div>
          ) : null}

          <div className="form-grid gallery-form-grid">
            <label>
              <span>Resina usada *</span>
              <input
                value={form.resina}
                onChange={(e) => alterar("resina", e.target.value)}
                placeholder="Ex.: IRON Cinza"
              />
            </label>
            <label>
              <span>Impressora *</span>
              <input
                value={form.impressora}
                onChange={(e) => alterar("impressora", e.target.value)}
                placeholder="Ex.: Anycubic Photon M3 Max"
              />
            </label>
            <label className="partner-grid-full">
              <span>Foto do trabalho feito *</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="gallery-config-box">
            <h3>Configurações do Chitubox</h3>
            <p>Preencha os campos que aparecem na aba Imprimir. Deixe em branco o que você não souber.</p>
            <div className="form-grid gallery-settings-grid">
              {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => (
                <label key={campo.name}>
                  <span>{campo.label}</span>
                  <input
                    value={form.parametros[campo.name]}
                    onChange={(e) => alterarParametro(campo.name, e.target.value)}
                    placeholder={campo.placeholder}
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="gallery-observation">
            <span>Observações para o próximo cliente</span>
            <textarea
              rows="4"
              value={form.observacao}
              onChange={(e) => alterar("observacao", e.target.value)}
              placeholder="Ex.: temperatura do ambiente, suporte usado, se a peça saiu perfeita ou precisou ajuste."
            />
          </label>

          <button type="submit" className="submit-registration" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar para aprovação"}
          </button>
        </form>
      ) : (
        <div className="gallery-approved-list">
          {carregandoItens ? <div className="gallery-empty">Carregando fotos aprovadas...</div> : null}
          {erroItens ? <div className="modal-error">{erroItens}</div> : null}
          {!carregandoItens && !erroItens && itens.length === 0 ? (
            <div className="gallery-empty">
              Ainda não há fotos aprovadas. Assim que o painel administrativo for ajustado,
              as configurações aprovadas aparecerão aqui para consulta dos próximos clientes.
            </div>
          ) : null}

          {itens.map((item) => (
            <article className="gallery-approved-card" key={item._id || item.imagem}>
              {item.imagem ? <img src={item.imagem} alt={`Peça impressa com ${item.resina || "resina"}`} /> : null}
              <div>
                <h3>{item.resina || "Resina não informada"}</h3>
                <p>{item.impressora || "Impressora não informada"}</p>
                {item.observacao ? <p className="gallery-note">{item.observacao}</p> : null}
                <div className="gallery-param-list">
                  {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                    const valor = item.parametros?.[campo.name];
                    return valor ? <span key={campo.name}><strong>{campo.label}:</strong> {valor}</span> : null;
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

function formatarDataHora(data) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function AdminGaleriaContent() {
  const [credenciais, setCredenciais] = useState({ user: "", password: "" });
  const [token, setToken] = useState(() => localStorage.getItem("quanton3d_admin_token") || "");
  const [filtros, setFiltros] = useState({ status: "pendente", dataInicio: "", dataFim: "" });
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState("");

  async function entrar(event) {
    event.preventDefault();
    setErro("");

    try {
      setCarregando(true);
      const resposta = await api.post("/admin/login", credenciais);
      const novoToken = resposta.data?.token || "";

      if (!novoToken) {
        setErro("Login administrativo não retornou token.");
        return;
      }

      localStorage.setItem("quanton3d_admin_token", novoToken);
      setToken(novoToken);
    } catch (err) {
      console.error("Erro no login administrativo:", err);
      setErro(err?.response?.data?.error || "Credenciais administrativas inválidas.");
    } finally {
      setCarregando(false);
    }
  }

  const carregarItens = useCallback(async () => {
    if (!token) return;

    try {
      setCarregando(true);
      setErro("");
      const resposta = await api.get("/gallery/admin", {
        headers: { Authorization: `Bearer ${token}` },
        params: filtros,
      });
      setItens(Array.isArray(resposta.data?.data) ? resposta.data.data : []);
    } catch (err) {
      console.error("Erro ao carregar galeria administrativa:", err);
      if (err?.response?.status === 401) {
        localStorage.removeItem("quanton3d_admin_token");
        setToken("");
      }
      setErro(err?.response?.data?.error || "Não foi possível carregar a galeria administrativa.");
    } finally {
      setCarregando(false);
    }
  }, [filtros, token]);

  useEffect(() => {
    if (!token) return undefined;

    const busca = setTimeout(carregarItens, 0);
    return () => clearTimeout(busca);
  }, [carregarItens, token]);

  function alterarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  async function atualizarStatus(id, acao) {
    try {
      setSalvandoId(id);
      setErro("");
      await api.patch(`/gallery/${id}/${acao}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await carregarItens();
    } catch (err) {
      console.error(`Erro ao ${acao} item da galeria:`, err);
      setErro(err?.response?.data?.error || "Não foi possível atualizar este item.");
    } finally {
      setSalvandoId("");
    }
  }

  function sair() {
    localStorage.removeItem("quanton3d_admin_token");
    setToken("");
    setItens([]);
  }

  if (!token) {
    return (
      <form className="admin-gallery-login" onSubmit={entrar}>
        <p>Entre com o usuário administrativo para aprovar ou recusar fotos da galeria.</p>
        {erro ? <div className="modal-error">{erro}</div> : null}
        <label>
          <span>Usuário</span>
          <input
            value={credenciais.user}
            onChange={(e) => setCredenciais((atual) => ({ ...atual, user: e.target.value }))}
            autoComplete="username"
          />
        </label>
        <label>
          <span>Senha</span>
          <input
            type="password"
            value={credenciais.password}
            onChange={(e) => setCredenciais((atual) => ({ ...atual, password: e.target.value }))}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="submit-registration" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar no ADM"}
        </button>
      </form>
    );
  }

  return (
    <div className="admin-gallery-panel">
      <div className="admin-gallery-toolbar">
        <label>
          <span>Status</span>
          <select value={filtros.status} onChange={(e) => alterarFiltro("status", e.target.value)}>
            <option value="pendente">Pendentes</option>
            <option value="aprovado">Aprovados</option>
            <option value="recusado">Recusados</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <label>
          <span>Data inicial</span>
          <input type="date" value={filtros.dataInicio} onChange={(e) => alterarFiltro("dataInicio", e.target.value)} />
        </label>
        <label>
          <span>Data final</span>
          <input type="date" value={filtros.dataFim} onChange={(e) => alterarFiltro("dataFim", e.target.value)} />
        </label>
        <button type="button" onClick={carregarItens} disabled={carregando}>
          {carregando ? "Carregando..." : "Atualizar"}
        </button>
        <button type="button" className="admin-gallery-logout" onClick={sair}>Sair</button>
      </div>

      {erro ? <div className="modal-error">{erro}</div> : null}
      {!carregando && itens.length === 0 ? (
        <div className="gallery-empty">Nenhum envio encontrado para os filtros selecionados.</div>
      ) : null}

      <div className="admin-gallery-list">
        {itens.map((item) => (
          <article className="admin-gallery-card" key={item._id}>
            {item.imagem ? <img src={item.imagem} alt={`Envio de ${item.nome || "cliente"}`} /> : null}
            <div className="admin-gallery-card-body">
              <div className="admin-gallery-card-head">
                <div>
                  <strong>{item.nome || "Cliente sem nome"}</strong>
                  <span>{formatarDataHora(item.createdAt)}</span>
                </div>
                <span className={`admin-status admin-status-${item.status || "pendente"}`}>{item.status || "pendente"}</span>
              </div>

              <div className="admin-client-grid">
                <span><strong>Telefone:</strong> {item.telefone || "-"}</span>
                <span><strong>E-mail:</strong> {item.email || "-"}</span>
                <span><strong>Resina:</strong> {item.resina || "-"}</span>
                <span><strong>Impressora:</strong> {item.impressora || "-"}</span>
              </div>

              {item.observacao ? <p className="gallery-note">{item.observacao}</p> : null}

              <div className="gallery-param-list">
                {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                  const valor = item.parametros?.[campo.name];
                  return valor ? <span key={campo.name}><strong>{campo.label}:</strong> {valor}</span> : null;
                })}
              </div>

              <div className="admin-gallery-actions">
                <button
                  type="button"
                  className="approve"
                  onClick={() => atualizarStatus(item._id, "aprovar")}
                  disabled={salvandoId === item._id || item.status === "aprovado"}
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  className="reject"
                  onClick={() => atualizarStatus(item._id, "recusar")}
                  disabled={salvandoId === item._id || item.status === "recusado"}
                >
                  Não aprovar
                </button>
              </div>
            </div>
          </article>
        ))}
 codex/revise-code-to-identify-errors-y4xdq2

 codex/revise-code-to-identify-errors-s1mcto

main
 main
      </div>

      {aba === "enviar" ? (
        <form className="modal-form-layout" style={{ marginTop: "20px" }} onSubmit={enviar}>
          {sucesso ? (
            <div className="modal-success">
              Enviado com sucesso! A foto e as configurações aguardam aprovação antes de aparecerem para outros clientes.
            </div>
          ) : null}

          <div className="form-grid gallery-form-grid">
            <label>
              <span>Resina usada *</span>
              <input
                value={form.resina}
                onChange={(e) => alterar("resina", e.target.value)}
                placeholder="Ex.: IRON Cinza"
              />
            </label>
            <label>
              <span>Impressora *</span>
              <input
                value={form.impressora}
                onChange={(e) => alterar("impressora", e.target.value)}
                placeholder="Ex.: Anycubic Photon M3 Max"
              />
            </label>
            <label className="partner-grid-full">
              <span>Foto do trabalho feito *</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="gallery-config-box">
            <h3>Configurações do Chitubox</h3>
            <p>Preencha os campos que aparecem na aba Imprimir. Deixe em branco o que você não souber.</p>
            <div className="form-grid gallery-settings-grid">
              {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => (
                <label key={campo.name}>
                  <span>{campo.label}</span>
                  <input
                    value={form.parametros[campo.name]}
                    onChange={(e) => alterarParametro(campo.name, e.target.value)}
                    placeholder={campo.placeholder}
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="gallery-observation">
            <span>Observações para o próximo cliente</span>
            <textarea
              rows="4"
              value={form.observacao}
              onChange={(e) => alterar("observacao", e.target.value)}
              placeholder="Ex.: temperatura do ambiente, suporte usado, se a peça saiu perfeita ou precisou ajuste."
            />
          </label>

          <button type="submit" className="submit-registration" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar para aprovação"}
          </button>
        </form>
      ) : (
        <div className="gallery-approved-list">
          {carregandoItens ? <div className="gallery-empty">Carregando fotos aprovadas...</div> : null}
          {erroItens ? <div className="modal-error">{erroItens}</div> : null}
          {!carregandoItens && !erroItens && itens.length === 0 ? (
            <div className="gallery-empty">
              Ainda não há fotos aprovadas. Assim que o painel administrativo for ajustado,
              as configurações aprovadas aparecerão aqui para consulta dos próximos clientes.
            </div>
          ) : null}

          {itens.map((item) => (
            <article className="gallery-approved-card" key={item._id || item.imagem}>
              {item.imagem ? <img src={item.imagem} alt={`Peça impressa com ${item.resina || "resina"}`} /> : null}
              <div>
                <h3>{item.resina || "Resina não informada"}</h3>
                <p>{item.impressora || "Impressora não informada"}</p>
                {item.observacao ? <p className="gallery-note">{item.observacao}</p> : null}
                <div className="gallery-param-list">
                  {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                    const valor = item.parametros?.[campo.name];
                    return valor ? <span key={campo.name}><strong>{campo.label}:</strong> {valor}</span> : null;
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

function BotContent({ cliente }) {
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
      setMensagens(prev => [...prev, { text: res.data.data.reply, isBot: true }]);
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
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && enviar()} placeholder="Tire sua dúvida técnica..." />
        <button onClick={enviar} disabled={pensando}>Enviar</button>
      </div>
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
