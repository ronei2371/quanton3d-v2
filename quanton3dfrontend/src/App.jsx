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