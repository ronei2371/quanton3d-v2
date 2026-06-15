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
    carregarParametros();
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

  function abrirParceiroModal() {
    setMostrarParceiroModal(true);
  }

  function abrirGuia(id) {
    setActiveGuide(GUIDES[id]);
  }

  // O restante do retorno do componente App...
  return (
    <div className="app-container">
      {/* 1. Seção de Experiência (Colabore com sua experiência de configuração) */}
      <section className="experience-section">
        <span className="section-label">Colaboração técnica</span>
        <h2>Colabore com sua experiência de configuração</h2>
        <p>Envie uma foto da peça e os tempos usados no Chitubox para ajudar a Quanton3D a melhorar a base técnica.</p>
        <div className="experience-actions">
          <button type="button" onClick={() => setActiveModal("galeria")}>📷 Compartilhar minhas configurações</button>
          <button type="button" onClick={() => setActiveModal("galeriaPublica")}>🖼️ Ver configurações e fotos de clientes</button>
          <button type="button" onClick={abrirParceiroModal}>🤝 Quero ser parceiro</button>
        </div>
      </section>

      {/* Estatísticas */}
      <div className="stats-row">
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
      </div>

      {/* 2. Seção de Produtos (Nossas Resinas) */}
      <section id="produtos" className="panel">
        <div className="panel-header">
          <div>
            <span className="section-label">Catálogo Elite</span>
            <h2>Nossas Resinas</h2>
          </div>
        </div>
        <div className="cards-grid">
          <InfoCard 
            title="Alta Qualidade" 
            text="Conheça linhas, aplicações e FISPQs." 
            onClick={() => setActiveModal("qualidade")} 
          />
          <InfoCard 
            title="Parâmetros detalhados" 
            text="Abra o guia completo do Chitubox." 
            onClick={() => abrirGuia("parametrosDetalhados")} 
          />
          <InfoCard 
            title="Parceiros e cursos" 
            text="Veja parceiros e serviços recomendados." 
            onClick={() => abrirGuia("parceiros")} 
          />
          {/* REMOVIDO: O card duplicado de parceiro foi retirado daqui */}
        </div>
      </section>

      {/* Modais e Componentes adicionais seriam renderizados aqui */}
      {mostrarParceiroModal && <PartnerRequestModal onClose={() => setMostrarParceiroModal(false)} />}
      {activeModal === "qualidade" && <div className="modal">Conteúdo Qualidade</div>}
      {/* ... outros modais ... */}
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

export default App;
