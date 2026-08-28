import { useState } from "react";
import { UserCog, Check, Bot } from "lucide-react";
import api from "./lib/api";
import NavBar from "./components/layout/NavBar";
import { BoasVindasModal, PrivacidadeModal, CadastroInicial, SOCIAL_LINKS } from "./components/modals/GatingModals";
import ContactMessageModal from "./components/modals/ContactMessageModal";
import PartnerRequestModal from "./components/modals/PartnerRequestModal";
import HomeSection from "./components/sections/HomeSection";
import ParametrosSection from "./components/sections/ParametrosSection";
import CalculadorasSection from "./components/sections/CalculadorasSection";
import GuiasSection from "./components/sections/GuiasSection";
import AcademySection from "./components/sections/AcademySection";
import AtendimentoSection from "./components/sections/AtendimentoSection";
import ComunidadeSection from "./components/sections/ComunidadeSection";
import CatalogoSection from "./components/sections/CatalogoSection";
import SobreSection from "./components/sections/SobreSection";
import GuideViewer from "./components/guides/GuideViewer";
import BotModal from "./components/modals/BotModal";
import AdminModal from "./components/modals/AdminModal";

function getClienteSalvo() {
  try { const s = localStorage.getItem("quanton3d_cliente"); return s ? JSON.parse(s) : null; } catch { return null; }
}
function getPrivacidadeAceita() {
  return localStorage.getItem("quanton3d_privacidade_aceita") === "true";
}

function App() {
  const [paginaAtiva, setPaginaAtiva] = useState("inicio");

  const [clienteSalvoInicial] = useState(() => getClienteSalvo());
  const [privacidadeAceitaInicial] = useState(() => getPrivacidadeAceita());
  const [cliente, setCliente] = useState(clienteSalvoInicial);
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(!clienteSalvoInicial && !privacidadeAceitaInicial);
  const [mostrarPrivacidade, setMostrarPrivacidade] = useState(false);
  const [mostrarCadastro, setMostrarCadastro] = useState(!clienteSalvoInicial && privacidadeAceitaInicial);
  const [formCliente, setFormCliente] = useState({ nome: "", telefone: "", email: "", origem: "Instagram" });
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");

  const [activeGuide, setActiveGuide] = useState(null);
  const [mostrarBot, setMostrarBot] = useState(false);
  const [mostrarContatoMensagem, setMostrarContatoMensagem] = useState(false);
  const [mostrarParceiroModal, setMostrarParceiroModal] = useState(false);
  const [mostrarAdm, setMostrarAdm] = useState(false);

  const [atendenteLogado, setAtendenteLogado] = useState(() => {
    try { return JSON.parse(localStorage.getItem("quanton3d_atendente")); } catch { return null; }
  });
  const [showLoginAtendente, setShowLoginAtendente] = useState(false);
  const [loginAtForm, setLoginAtForm] = useState({ email: "", senha: "" });
  const [loginAtErro, setLoginAtErro] = useState("");
  const [loginAtLoading, setLoginAtLoading] = useState(false);

  async function loginAtendente() {
    if (!loginAtForm.email || !loginAtForm.senha) { setLoginAtErro("Preencha email e senha."); return; }
    try {
      setLoginAtLoading(true);
      const r = await api.post("/atendentes/login", loginAtForm);
      if (r.data?.success) {
        setAtendenteLogado(r.data.atendente);
        localStorage.setItem("quanton3d_atendente", JSON.stringify(r.data.atendente));
        localStorage.setItem("quanton3d_atendente_token", r.data.token);
        setShowLoginAtendente(false);
        setLoginAtErro("");
        setLoginAtForm({ email: "", senha: "" });
      }
    } catch (err) {
      setLoginAtErro(err?.response?.data?.error || "Erro ao fazer login.");
    } finally { setLoginAtLoading(false); }
  }
  function logoutAtendente() {
    setAtendenteLogado(null);
    localStorage.removeItem("quanton3d_atendente");
    localStorage.removeItem("quanton3d_atendente_token");
  }

  function aceitarPrivacidade() { localStorage.setItem("quanton3d_privacidade_aceita", "true"); setMostrarPrivacidade(false); setMostrarCadastro(!cliente); }
  function abrirCadastro() { setErroCadastro(""); if (!getPrivacidadeAceita()) { setMostrarPrivacidade(true); return; } setMostrarCadastro(true); }
  function fecharCadastro() { setMostrarCadastro(false); setErroCadastro(""); }
  function alterarCliente(campo, valor) { setFormCliente((a) => ({ ...a, [campo]: valor })); }

  function validarTelefone(tel) {
    const digitos = String(tel || "").replace(/\D/g, "");
    if (digitos.length < 10 || digitos.length > 11) return false;
    const ddd = parseInt(digitos.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99) return false;
    if (/^(\d)\1+$/.test(digitos)) return false;
    if (digitos === "12345678900" || digitos === "1234567890") return false;
    return true;
  }
  function validarEmail(email) {
    const e = String(email || "").trim();
    const regex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(e)) return false;
    const dominiosInvalidos = ["teste.com", "test.com", "email.com", "exemplo.com", "asdf.com", "xxx.com"];
    const dominio = e.split("@")[1]?.toLowerCase();
    if (dominiosInvalidos.includes(dominio)) return false;
    return true;
  }

  async function salvarCliente(e) {
    e.preventDefault(); setErroCadastro("");
    if (!formCliente.nome || !formCliente.telefone || !formCliente.email) { setErroCadastro("Preencha todos os campos obrigatórios."); return; }
    if (formCliente.nome.trim().length < 2) { setErroCadastro("Digite um nome válido."); return; }
    if (!validarTelefone(formCliente.telefone)) { setErroCadastro("Telefone inválido. Use o formato DDD + número (ex: 31987654321)."); return; }
    if (!validarEmail(formCliente.email)) { setErroCadastro("E-mail inválido. Verifique se digitou corretamente."); return; }
    try {
      setSalvandoCliente(true);
      const res = await api.post("/clientes", formCliente);
      const novoCliente = res.data.data;
      setCliente(novoCliente);
      localStorage.setItem("quanton3d_cliente", JSON.stringify(novoCliente));
      setMostrarCadastro(false);
    } catch (err) { console.error("Erro ao salvar cliente:", err); setErroCadastro("Erro ao realizar cadastro."); }
    finally { setSalvandoCliente(false); }
  }

  const [calcInicial, setCalcInicial] = useState(null);

  function navegar(pagina) {
    setPaginaAtiva(pagina);
    setCalcInicial(null);
    setActiveGuide(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Abre a página de calculadoras já com uma calculadora específica aberta (ex: link cruzado de Parâmetros → Exposição).
  function abrirCalculadora(id) {
    setCalcInicial(id);
    setPaginaAtiva("calculadoras");
    setActiveGuide(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const paginas = {
    inicio: <HomeSection onNavegar={navegar} />,
    parametros: <ParametrosSection onAbrirExposicao={() => abrirCalculadora("exposicao")} />,
    calculadoras: <CalculadorasSection calculadoraInicial={calcInicial} onNavegar={navegar} />,
    guias: <GuiasSection abrirGuia={(g) => setActiveGuide(g)} />,
    academy: <AcademySection abrirAcademy={(g) => setActiveGuide({ ...g, returnLabel: "Voltar à Quanton Academy" })} />,
    atendimento: <AtendimentoSection cliente={cliente} onAbrirContato={() => setMostrarContatoMensagem(true)} />,
    comunidade: <ComunidadeSection cliente={cliente} onAbrirParceiroModal={() => setMostrarParceiroModal(true)} />,
    catalogo: <CatalogoSection />,
    sobre: <SobreSection onAbrirParceiroModal={() => setMostrarParceiroModal(true)} />,
  };

  return (
    <div className={`app-shell${activeGuide ? " is-guide" : ""}`}>
      {mostrarBoasVindas && (
        <BoasVindasModal onEntrar={() => { setMostrarBoasVindas(false); setMostrarPrivacidade(true); }} />
      )}
      {!mostrarBoasVindas && mostrarPrivacidade && <PrivacidadeModal aceitarPrivacidade={aceitarPrivacidade} />}
      {mostrarCadastro && !mostrarPrivacidade && (
        <CadastroInicial formCliente={formCliente} salvandoCliente={salvandoCliente} erroCadastro={erroCadastro} alterarCliente={alterarCliente} salvarCliente={salvarCliente} onFechar={fecharCadastro} />
      )}

      {mostrarBot && <BotModal cliente={cliente} onClose={() => setMostrarBot(false)} />}
      {mostrarAdm && <AdminModal atendenteLogado={atendenteLogado} onClose={() => setMostrarAdm(false)} />}
      <ContactMessageModal aberto={mostrarContatoMensagem} aoFechar={() => setMostrarContatoMensagem(false)} cliente={cliente} />
      <PartnerRequestModal aberto={mostrarParceiroModal} aoFechar={() => setMostrarParceiroModal(false)} cliente={cliente} />

      {showLoginAtendente && (
        <div className="q-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowLoginAtendente(false)}>
          <div className="q-modal q-modal--narrow">
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "center" }}><UserCog size={30} /></div>
              <h2 style={{ fontSize: "1.1rem" }}>Login de Atendente</h2>
              <p style={{ fontSize: "0.8rem" }}>Área exclusiva para a equipe Quanton3D</p>
            </div>
            {loginAtErro && <div className="q-alert q-alert--error">{loginAtErro}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
              <input className="q-input" value={loginAtForm.email} onChange={(e) => setLoginAtForm((p) => ({ ...p, email: e.target.value }))} placeholder="Seu email" autoComplete="off" />
              <input className="q-input" value={loginAtForm.senha} onChange={(e) => setLoginAtForm((p) => ({ ...p, senha: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && loginAtendente()} placeholder="Sua senha" type="password" autoComplete="new-password" />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" className="q-btn q-btn--primary" style={{ flex: 1 }} onClick={loginAtendente} disabled={loginAtLoading}>
                {loginAtLoading ? "Entrando..." : <><Check size={14} /> Entrar</>}
              </button>
              <button type="button" className="q-btn q-btn--ghost" onClick={() => { setShowLoginAtendente(false); setLoginAtErro(""); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <NavBar
        paginaAtiva={paginaAtiva}
        onNavegar={navegar}
        cliente={cliente}
        onAbrirCadastro={abrirCadastro}
        atendenteLogado={atendenteLogado}
        onAbrirAdm={() => setMostrarAdm(true)}
        onAbrirLoginAtendente={() => setShowLoginAtendente(true)}
        onLogoutAtendente={logoutAtendente}
      />

      <main className="app-main q-shell">
        {activeGuide
          ? <GuideViewer guide={activeGuide} onVoltar={() => setActiveGuide(null)} />
          : paginas[paginaAtiva]}
      </main>

      <footer className="site-footer">
        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.86rem" }}>Quanton3D © Suporte técnico e resinas UV de alta performance.</span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Copyright Quanton 3D LTDA · CNPJ 11.165.962/0001-17 · 2026. Todos os direitos reservados.</span>
        <div className="footer-social-links">
          {SOCIAL_LINKS.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
          ))}
        </div>
      </footer>

      {!mostrarBot && (
        <button type="button" className="elio-fab" onClick={() => setMostrarBot(true)} aria-label="Converse com o Assistente">
          <span className="elio-fab-dot" /> <Bot size={22} /> <span className="elio-fab-label">Converse com o Assistente</span>
        </button>
      )}
    </div>
  );
}

export default App;
