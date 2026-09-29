import { useState } from "react";
import { Lock, Atom, X } from "lucide-react";
import { WHATSAPP_SUPORTE_URL } from "../../data/contact";
import TunelEntrada from "./TunelEntrada";

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
    // o tunel acelera (efeito de "dobra") e a tela some logo depois
    setTimeout(onEntrar, 750);
  }
  return (
    <div className={"welcome-screen" + (saindo ? " leaving" : "")}>
      <TunelEntrada acelerar={saindo} />
      <div className="welcome-logo welcome-entra" style={{ "--atraso": "0.1s" }}>
        <Atom size={34} color="#bfe8ff" />
      </div>

      <h1 className="welcome-entra" style={{ "--atraso": "0.35s", fontFamily: "var(--font-display)", fontSize: "clamp(2.6rem, 11vw, 5.6rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1, margin: "0 0 12px", background: "linear-gradient(135deg, #ffffff 0%, var(--q-marine) 50%, var(--q-ametista) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        Quanton3D<sup style={{ fontSize: "0.32em", WebkitTextFillColor: "var(--q-marine)" }}>®</sup>
      </h1>

      <p className="welcome-entra" style={{ "--atraso": "0.6s", fontSize: "clamp(0.82rem, 2.5vw, 1.05rem)", color: "rgba(200,220,240,0.9)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, margin: "0 0 6px" }}>
        Resinas UV para impressão 3D LCD/DLP
      </p>
      <p className="welcome-entra" style={{ "--atraso": "0.75s", fontSize: "clamp(0.72rem, 2vw, 0.88rem)", color: "var(--text-muted)", margin: 0 }}>
        Fabricação nacional · Belo Horizonte, MG · Desde 2020
      </p>

      <div className="welcome-badge-row welcome-entra" style={{ "--atraso": "0.9s" }}>
        {["🧪 14 linhas exclusivas", "🇧🇷 100% nacional", "🏆 Pioneira em resina acessível"].map((b) => (
          <span key={b} className="q-badge">{b}</span>
        ))}
      </div>

      <button type="button" className="q-btn q-btn--primary welcome-botao welcome-entra" style={{ "--atraso": "1.1s", padding: "16px 46px", fontSize: "1rem" }} onClick={handleEntrar}>
        ▶ Acessar o Suporte Técnico
      </button>

      <p style={{ position: "absolute", bottom: "18px", fontSize: "0.68rem", color: "var(--text-muted)" }}>
        © 2026 Quanton3D LTDA · quanton3d.com.br
      </p>
    </div>
  );
}

// Termo de Privacidade (LGPD - Lei 13.709/2018). Se mudar o texto, atualize TERMO_VERSAO.
const TERMO_VERSAO = "29/09/2026";
const TERMO_PRIVACIDADE = [
  ["1. Quem cuida dos seus dados", "A Quanton 3D LTDA (CNPJ 11.165.962/0001-17), fabricante de resinas UV de Belo Horizonte (MG), é a responsável pelos dados coletados neste site. Para qualquer assunto sobre seus dados, fale com a gente pelo WhatsApp (31) 3271-6935."],
  ["2. Dados que podem ser coletados", "Nome, WhatsApp, e-mail e como nos conheceu (no cadastro); as mensagens e dúvidas enviadas ao suporte e à IAQ3D; resina, impressora e parâmetros de impressão informados; pedidos de formulação; e imagens enviadas por você."],
  ["3. Para que usamos", "Para liberar e prestar o suporte técnico, responder suas dúvidas, manter o histórico do seu atendimento, lembrar sua resina e impressora na próxima conversa, organizar pedidos de formulação e melhorar as respostas da base de conhecimento da Quanton3D."],
  ["4. Assistente com inteligência artificial (IAQ3D)", "As perguntas que você digita no chat, junto com a resina e a impressora informadas, são enviadas para processamento a um provedor de inteligência artificial (DeepSeek), que pode processá-las em servidores fora do Brasil. Seu nome, telefone e e-mail não são enviados à IA. Não escreva no chat dados pessoais ou sigilosos que não sejam necessários para o suporte."],
  ["5. Estatísticas de uso (Google Analytics)", "Usamos o Google Analytics para saber, de forma estatística, quais páginas e ferramentas do site são mais usadas. Os cookies do Google Analytics só são ativados depois que você aceita este termo. Não enviamos seu nome, telefone ou e-mail ao Google e não usamos esses dados para anúncios."],
  ["6. Imagens enviadas", "Fotos de peças e falhas são usadas para a análise técnica. Não são publicadas sem a sua autorização específica (por exemplo, ao enviar para a galeria da Comunidade)."],
  ["7. Compartilhamento e segurança", "A Quanton3D não vende seus dados. Eles ficam em serviços de hospedagem e banco de dados contratados pela Quanton3D e só são compartilhados com os provedores citados neste termo, na medida necessária para o site funcionar. Adotamos medidas de segurança como senha e controle de acesso para a equipe e uma chave secreta que protege o seu histórico do chat."],
  ["8. Por quanto tempo guardamos", "Os dados de cadastro, o histórico do chat e os chamados ficam guardados enquanto forem úteis para o seu atendimento, ou até você pedir a exclusão. Os registros de uso das ferramentas do site são apagados automaticamente após 12 meses."],
  ["9. Seus direitos", "Você pode pedir, a qualquer momento, para ver, corrigir ou apagar seus dados, ou retirar este consentimento. Basta chamar a Quanton3D pelo WhatsApp (31) 3271-6935 informando o nome e o telefone do cadastro. Você também pode reclamar à ANPD (Autoridade Nacional de Proteção de Dados)."],
  ["10. Consentimento", "Ao marcar a opção abaixo, você confirma que leu este termo e autoriza a Quanton3D a tratar seus dados como descrito aqui."],
];

// somenteLeitura: aberto pelo rodape do site, so para consultar (sem o aceite).
export function PrivacidadeModal({ aceitarPrivacidade, somenteLeitura = false, onFechar }) {
  const [confirmouAceite, setConfirmouAceite] = useState(false);
  return (
    <div className="q-modal-backdrop" onClick={(event) => somenteLeitura && event.target === event.currentTarget && onFechar?.()}>
      <section className="q-modal q-modal--narrow" role="dialog" aria-label="Termo de Privacidade">
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Lock size={30} /></div>
          <h2 style={{ fontSize: "1.15rem" }}>Termo de Privacidade e Consentimento</h2>
          <p style={{ fontSize: "0.85rem" }}>{somenteLeitura ? "Como a Quanton3D trata os seus dados neste site." : "Antes de acessar o suporte técnico da Quanton3D, leia com atenção este termo."}</p>
        </div>
        <div style={{ maxHeight: "40vh", overflowY: "auto", padding: "4px 4px 4px 0", marginBottom: "16px", textAlign: "left" }}>
          {TERMO_PRIVACIDADE.map(([titulo, texto]) => (
            <div key={titulo}>
              <h3 style={{ fontSize: "0.88rem", color: "var(--primary)", margin: "14px 0 6px" }}>{titulo}</h3>
              <p style={{ fontSize: "0.82rem" }}>{texto}</p>
            </div>
          ))}
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "14px" }}>Versão de {TERMO_VERSAO}.</p>
        </div>
        {somenteLeitura ? (
          <button type="button" className="q-btn q-btn--primary q-btn--block" onClick={onFechar}>Fechar</button>
        ) : (
          <>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", marginBottom: "16px", cursor: "pointer" }}>
              <input type="checkbox" checked={confirmouAceite} onChange={(e) => setConfirmouAceite(e.target.checked)} />
              <span>Li e aceito o Termo de Privacidade e autorizo o uso dos meus dados.</span>
            </label>
            <button type="button" className="q-btn q-btn--primary q-btn--block" disabled={!confirmouAceite} onClick={aceitarPrivacidade}>
              Aceitar e continuar
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export function CadastroInicial({ formCliente, salvandoCliente, erroCadastro, alterarCliente, salvarCliente, onFechar, onAcessoEquipe, motivo }) {
  return (
    <div className="q-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onFechar()}>
      <form className="q-modal q-modal--narrow" onSubmit={salvarCliente} style={{ position: "relative" }}>
        <button type="button" className="q-modal-close q-modal-close--icon" onClick={onFechar} aria-label="Fechar cadastro" title="Fechar">
          <X size={18} />
        </button>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "6px", paddingRight: "42px" }}>Seja bem-vindo!</h2>
        <p style={{ fontSize: "0.86rem", marginBottom: "16px" }}>Identifique-se para liberar o suporte técnico especializado.</p>
        {motivo
          ? <div className="q-alert" style={{ marginBottom: "14px", fontSize: "0.82rem", border: "1px solid rgba(47,123,255,0.4)", background: "rgba(47,123,255,0.08)" }}>{motivo}</div>
          : <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: "-8px 0 14px" }}>Sem cadastro você pode navegar pelo site. Para conversar com a IAQ3D, abrir chamado ou enviar peça, o cadastro é necessário.</p>}
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
        <button type="button" className="q-btn q-btn--ghost q-btn--block" style={{ marginTop: "10px" }} onClick={onAcessoEquipe}>
          <Lock size={14} /> Sou administrador ou atendente
        </button>
      </form>
    </div>
  );
}
