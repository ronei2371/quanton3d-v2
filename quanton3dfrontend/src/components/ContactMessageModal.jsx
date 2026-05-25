import { useEffect, useState } from "react";
import api from "../api";
import "./ContactMessageModal.css";

const estadoInicial = {
  nome: "",
  telefone: "",
  email: "",
  assunto: "",
  mensagem: "",
  origem: "site",
};

function ContactMessageModal({ aberto, aoFechar, cliente }) {
  const [form, setForm] = useState(estadoInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    if (!aberto) return;

    setForm({
      ...estadoInicial,
      nome: cliente?.nome || "",
      telefone: cliente?.telefone || "",
      email: cliente?.email || "",
    });

    setErro("");
    setSucesso("");
  }, [aberto, cliente]);

  if (!aberto) return null;

  function alterar(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function enviar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (
      !String(form.nome || "").trim() ||
      !String(form.assunto || "").trim() ||
      !String(form.mensagem || "").trim()
    ) {
      setErro("Preencha nome, assunto e mensagem.");
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        clienteId: cliente?._id || cliente?.id || "",
        nome: String(form.nome || "").trim(),
        telefone: String(form.telefone || "").trim(),
        email: String(form.email || "").trim(),
        assunto: String(form.assunto || "").trim(),
        mensagem: String(form.mensagem || "").trim(),
        origem: "site",
      };

      const resposta = await api.post("/contact-messages", payload);

      if (resposta.data?.success) {
        setSucesso(
          "Mensagem enviada com sucesso. Ela já foi registrada para a equipe da Quanton3D."
        );

        setTimeout(() => {
          aoFechar();
        }, 1200);
      } else {
        setErro("Não foi possível enviar sua mensagem.");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);

      setErro(
        error?.response?.data?.message ||
          "Erro ao enviar sua mensagem para a Quanton3D."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contact-modal-backdrop">
      <div className="contact-modal-shell">
        <button
          type="button"
          className="contact-floating-close"
          onClick={aoFechar}
        >
          ✕ Fechar
        </button>

        <form className="contact-modal" onSubmit={enviar}>
          <div className="contact-modal-header">
            <div className="contact-icon">💬</div>

            <div className="contact-header-text">
              <span className="contact-badge">Fale Conosco</span>
              <h2>Envie sua mensagem para a Quanton3D</h2>
              <p>
                Escreva aqui sua dúvida, necessidade ou pedido. A mensagem será
                salva no sistema para análise da equipe.
              </p>
            </div>
          </div>

          {erro && <div className="contact-error">{erro}</div>}
          {sucesso && <div className="contact-success">{sucesso}</div>}

          <div className="contact-grid">
            <label>
              <span>Nome *</span>
              <input
                value={form.nome}
                onChange={(e) => alterar("nome", e.target.value)}
                placeholder="Seu nome"
              />
            </label>

            <label>
              <span>WhatsApp</span>
              <input
                value={form.telefone}
                onChange={(e) => alterar("telefone", e.target.value)}
                placeholder="DDD + número"
              />
            </label>

            <label className="contact-grid-full">
              <span>E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => alterar("email", e.target.value)}
                placeholder="seu@email.com"
              />
            </label>

            <label className="contact-grid-full">
              <span>Assunto *</span>
              <input
                value={form.assunto}
                onChange={(e) => alterar("assunto", e.target.value)}
                placeholder="Ex.: dúvida sobre resina, pedido, suporte técnico..."
              />
            </label>

            <label className="contact-grid-full">
              <span>Mensagem *</span>
              <textarea
                rows="6"
                value={form.mensagem}
                onChange={(e) => alterar("mensagem", e.target.value)}
                placeholder="Escreva sua mensagem para a equipe Quanton3D."
              />
            </label>
          </div>

          <div className="contact-actions">
            <button
              type="button"
              className="contact-secondary"
              onClick={aoFechar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="contact-primary"
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Enviar mensagem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactMessageModal;
