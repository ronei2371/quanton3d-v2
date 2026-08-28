import { useState } from "react";
import { Lock, Atom, X } from "lucide-react";
import { WHATSAPP_SUPORTE_URL } from "../../data/contact";

const SOCIAL_LINKS = [
  { label: "Instagram", url: "https://www.instagram.com/quanton3d" },
  { label: "YouTube", url: "https://www.youtube.com/@quanton3d" },
  { label: "Facebook", url: "https://www.facebook.com/quanton3d" },
  { label: "TikTok", url: "https://www.tiktok.com/@quanton3d" },
  { label: "WhatsApp", url: WHATSAPP_SUPORTE_URL },
  { label: "Site", url: "https://quanton3d.com.br" },
];

const ORIGENS = ["Instagram", "YouTube", "Google / Pesquisa", "Indicação de amigo", "Mercado Livre / Shopee", "Já sou cliente", "Outros"];

export { SOCIAL_LINKS, ORIGENS };

export function BoasVindasModal({ onEntrar }) {
  const [saindo, setSaindo] = useState(false);
  function handleEntrar() {
    setSaindo(true);
    setTimeout(onEntrar, 500);
  }
  return (
    <div className={"welcome-screen" + (saindo ? " leaving" : "")}>
      <video className="welcome-video" src="/images/videos/video_banner_home.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div style={{ width: "76px", height: "76px", borderRadius: "var(--r-lg)", background: "var(--bg-raised)", border: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Atom size={32} color="var(--primary)" />
      </div>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.6rem, 11vw, 5.6rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1, margin: "0 0 12px", background: "linear-gradient(135deg, #ffffff 0%, var(--q-marine) 50%, var(--q-ametista) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        Quanton3D<sup style={{ fontSize: "0.32em", WebkitTextFillColor: "var(--q-marine)" }}>®</sup>
      </h1>

      <p style={{ fontSize: "clamp(0.82rem, 2.5vw, 1.05rem)", color: "rgba(200,220,240,0.9)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, margin: "0 0 6px" }}>
        Resinas UV SLA/DLP de Alta Performance
      </p>
      <p style={{ fontSize: "clamp(0.72rem, 2vw, 0.88rem)", color: "var(--text-muted)", margin: 0 }}>
        Fabricação nacional · Belo Horizonte, MG · Desde 2020
      </p>

      <div className="welcome-badge-row">
        {["🧪 14 linhas exclusivas", "🇧🇷 100% nacional", "🏆 Pioneira no Brasil"].map((b) => (
          <span key={b} className="q-badge">{b}</span>
        ))}
      </div>

      <button type="button" className="q-btn q-btn--primary" style={{ padding: "16px 46px", fontSize: "1rem" }} onClick={handleEntrar}>
        ▶ Acessar o Suporte Técnico
      </button>

      <p style={{ position: "absolute", bottom: "18px", fontSize: "0.68rem", color: "var(--text-muted)" }}>
        © 2026 Quanton3D LTDA · quanton3d.com.br
      </p>
    </div>
  );
}

export function PrivacidadeModal({ aceitarPrivacidade }) {
  const [confirmouAceite, setConfirmouAceite] = useState(false);
  return (
    <div className="q-modal-backdrop">
      <section className="q-modal q-modal--narrow">
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Lock size={30} /></div>
          <h2 style={{ fontSize: "1.15rem" }}>Termo de Privacidade e Consentimento</h2>
          <p style={{ fontSize: "0.85rem" }}>Antes de acessar o suporte técnico da Quanton3D, leia com atenção este termo.</p>
        </div>
        <div style={{ maxHeight: "40vh", overflowY: "auto", padding: "4px 4px 4px 0", marginBottom: "16px", textAlign: "left" }}>
          <h3 style={{ fontSize: "0.88rem", color: "var(--primary)", margin: "14px 0 6px" }}>1. Dados que poderão ser coletados</h3>
          <p style={{ fontSize: "0.82rem" }}>A Quanton3D poderá coletar nome, WhatsApp, e-mail, origem do contato, mensagens enviadas, dúvidas técnicas, resina/impressora utilizada, parâmetros de impressão, pedidos de formulação e imagens enviadas voluntariamente.</p>
          <h3 style={{ fontSize: "0.88rem", color: "var(--primary)", margin: "14px 0 6px" }}>2. Finalidade do uso dos dados</h3>
          <p style={{ fontSize: "0.82rem" }}>Os dados serão utilizados para liberar o acesso ao suporte técnico, responder dúvidas, manter histórico de atendimento, organizar pedidos de formulação e melhorar a base de conhecimento da Quanton3D.</p>
          <h3 style={{ fontSize: "0.88rem", color: "var(--primary)", margin: "14px 0 6px" }}>3. Uso de imagens enviadas</h3>
          <p style={{ fontSize: "0.82rem" }}>Imagens poderão ser usadas para análise técnica. Não serão publicadas sem autorização específica.</p>
          <h3 style={{ fontSize: "0.88rem", color: "var(--primary)", margin: "14px 0 6px" }}>4. Compartilhamento e segurança</h3>
          <p style={{ fontSize: "0.82rem" }}>A Quanton3D não vende seus dados. Medidas razoáveis serão adotadas para proteger as informações.</p>
          <h3 style={{ fontSize: "0.88rem", color: "var(--primary)", margin: "14px 0 6px" }}>5. Direitos do usuário</h3>
          <p style={{ fontSize: "0.82rem" }}>Você poderá solicitar acesso, correção ou exclusão dos seus dados pessoais a qualquer momento.</p>
          <h3 style={{ fontSize: "0.88rem", color: "var(--primary)", margin: "14px 0 6px" }}>6. Consentimento</h3>
          <p style={{ fontSize: "0.82rem" }}>Ao marcar a opção abaixo, você confirma que leu este termo e autoriza a Quanton3D a tratar seus dados.</p>
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", marginBottom: "16px", cursor: "pointer" }}>
          <input type="checkbox" checked={confirmouAceite} onChange={(e) => setConfirmouAceite(e.target.checked)} />
          <span>Li e aceito o Termo de Privacidade e autorizo o uso dos meus dados.</span>
        </label>
        <button type="button" className="q-btn q-btn--primary q-btn--block" disabled={!confirmouAceite} onClick={aceitarPrivacidade}>
          Aceitar e continuar
        </button>
      </section>
    </div>
  );
}

export function CadastroInicial({ formCliente, salvandoCliente, erroCadastro, alterarCliente, salvarCliente, onFechar }) {
  return (
    <div className="q-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onFechar()}>
      <form className="q-modal q-modal--narrow" onSubmit={salvarCliente} style={{ position: "relative" }}>
        <button type="button" className="q-modal-close q-modal-close--icon" onClick={onFechar} aria-label="Fechar cadastro" title="Fechar">
          <X size={18} />
        </button>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "6px", paddingRight: "42px" }}>Seja bem-vindo!</h2>
        <p style={{ fontSize: "0.86rem", marginBottom: "16px" }}>Identifique-se para liberar o suporte técnico especializado.</p>
        {erroCadastro && <div className="q-alert q-alert--error">{erroCadastro}</div>}
        <div className="q-form-grid" style={{ marginBottom: "16px" }}>
          <label className="q-field"><span>Seu Nome</span>
            <input className="q-input" value={formCliente.nome} onChange={(e) => alterarCliente("nome", e.target.value)} placeholder="Digite seu nome" />
          </label>
          <label className="q-field"><span>WhatsApp</span>
            <input className="q-input" value={formCliente.telefone} onChange={(e) => alterarCliente("telefone", e.target.value)} placeholder="DDD + número" />
          </label>
          <label className="q-field"><span>E-mail</span>
            <input className="q-input" value={formCliente.email} onChange={(e) => alterarCliente("email", e.target.value)} placeholder="seu@email.com" />
          </label>
          <label className="q-field"><span>Como nos conheceu?</span>
            <select className="q-select" value={formCliente.origem} onChange={(e) => alterarCliente("origem", e.target.value)}>
              {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <div style={{ background: "rgba(0,146,255,0.05)", border: "1px solid var(--border-soft)", borderRadius: "var(--r-md)", padding: "12px 14px", marginBottom: "18px" }}>
          <strong style={{ fontSize: "0.8rem" }}>Siga a Quanton3D nas redes</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
            {SOCIAL_LINKS.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="q-badge">{link.label}</a>
            ))}
          </div>
        </div>
        <button className="q-btn q-btn--primary q-btn--block" type="submit" disabled={salvandoCliente}>
          {salvandoCliente ? "Salvando..." : "Entrar no Suporte Técnico"}
        </button>
      </form>
    </div>
  );
}
