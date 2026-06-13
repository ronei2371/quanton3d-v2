import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./PartnerRequestModal.css";

const TIPOS = [
  "Quero ser parceiro",
  "Quero divulgar meus trabalhos",
  "Tenho curso",
  "Tenho serviço",
  "Tenho projeto",
  "Quero aparecer na área de parceiros",
];

const CATEGORIAS = [
  "Parceiro",
  "Curso",
  "Serviço",
  "Projeto",
  "Artista",
  "Loja",
];

const estadoInicial = {
  nome: "",
  telefone: "",
  email: "",
  instagram: "",
  site: "",
  tipo: "Quero ser parceiro",
  titulo: "",
  descricao: "",
  categoria: "Parceiro",
  cidade: "",
  estado: "",
  portfolio: "",
  origem: "site",
};

function PartnerRequestModal({ aberto, aoFechar, cliente }) {
  const [form, setForm] = useState(estadoInicial);
  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    if (!aberto) return undefined;

    const resetModal = setTimeout(() => {
      setForm({
        ...estadoInicial,
        nome: cliente?.nome || "",
        telefone: cliente?.telefone || "",
        email: cliente?.email || "",
      });

      setFotos([]);
      setErro("");
      setSucesso("");
    }, 0);

    return () => clearTimeout(resetModal);
  }, [aberto, cliente]);

  const nomesFotos = useMemo(() => {
    return fotos.map((foto) => foto.name);
  }, [fotos]);

  if (!aberto) return null;

  function alterar(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function selecionarFotos(event) {
    const arquivos = Array.from(event.target.files || []).slice(0, 6);
    setFotos(arquivos);
  }

  async function enviar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const nomeLimpo = String(form.nome || "").trim();
    const telefoneLimpo = String(form.telefone || "").trim();
    const emailLimpo = String(form.email || "").trim();
    const tituloLimpo = String(form.titulo || "").trim();
    const descricaoLimpo = String(form.descricao || "").trim();

    if (!nomeLimpo || !telefoneLimpo || !emailLimpo || !tituloLimpo || !descricaoLimpo) {
      setErro("Preencha todos os campos obrigatórios (*)");
      return;
    }

    try {
      setEnviando(true);

      const dados = new FormData();

      Object.entries(form).forEach(([chave, valor]) => {
        dados.append(chave, String(valor || ""));
      });

      fotos.forEach((foto) => {
        dados.append("fotos", foto);
      });

      const resposta = await api.post("/partner-requests", dados, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (resposta.data?.success) {
        setSucesso(
          "Solicitação enviada com sucesso. Ela já foi salva para análise no painel administrativo."
        );

        setTimeout(() => {
          aoFechar();
        }, 1200);
      } else {
        setErro("Não foi possível enviar a solicitação.");
      }
    } catch (error) {
      console.error("Erro ao enviar parceiro:", error);
      setErro(
        error?.response?.data?.message ||
          "Erro ao enviar solicitação de parceiro."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="partner-modal-backdrop">
      <div className="partner-modal-shell">
        <button
          type="button"
          className="partner-floating-close"
          onClick={aoFechar}
        >
          ✕ Fechar
        </button>

        <form className="partner-modal" onSubmit={enviar}>
          <div className="partner-modal-header">
            <div className="partner-icon">🤝</div>

            <div className="partner-header-text">
              <span className="partner-badge">Parcerias Quanton3D</span>
              <h2>Quero ser parceiro</h2>
              <p>
                Envie sua proposta para divulgar curso, serviço, projeto ou
                trabalho na área de parceiros da Quanton3D.
              </p>
            </div>
          </div>

          {erro && <div className="partner-error">{erro}</div>}
          {sucesso && <div className="partner-success">{sucesso}</div>}

          <div className="partner-grid">
            <label>
              <span>Nome *</span>
              <input value={form.nome} onChange={(e) => alterar("nome", e.target.value)} placeholder="Seu nome" />
            </label>

            <label>
              <span>WhatsApp *</span>
              <input value={form.telefone} onChange={(e) => alterar("telefone", e.target.value)} placeholder="DDD + número" />
            </label>

            <label>
              <span>E-mail *</span>
              <input type="email" value={form.email} onChange={(e) => alterar("email", e.target.value)} placeholder="seu@email.com" />
            </label>

            <label>
              <span>Tipo *</span>
              <select value={form.tipo} onChange={(e) => alterar("tipo", e.target.value)}>
                {TIPOS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Título *</span>
              <input value={form.titulo} onChange={(e) => alterar("titulo", e.target.value)} placeholder="Ex.: Curso de pintura realista" />
            </label>

            <label>
              <span>Categoria</span>
              <select value={form.categoria} onChange={(e) => alterar("categoria", e.target.value)}>
                {CATEGORIAS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Instagram</span>
              <input value={form.instagram} onChange={(e) => alterar("instagram", e.target.value)} placeholder="@seuinstagram" />
            </label>

            <label>
              <span>Site</span>
              <input value={form.site} onChange={(e) => alterar("site", e.target.value)} placeholder="https://..." />
            </label>

            <label>
              <span>Cidade</span>
              <input value={form.cidade} onChange={(e) => alterar("cidade", e.target.value)} placeholder="Sua cidade" />
            </label>

            <label>
              <span>Estado</span>
              <input value={form.estado} onChange={(e) => alterar("estado", e.target.value)} placeholder="UF" />
            </label>

            <label className="partner-grid-full">
              <span>Portfólio</span>
              <input value={form.portfolio} onChange={(e) => alterar("portfolio", e.target.value)} placeholder="Link do portfólio, drive ou página" />
            </label>

            <label className="partner-grid-full">
              <span>Descrição *</span>
              <textarea rows="5" value={form.descricao} onChange={(e) => alterar("descricao", e.target.value)} placeholder="Descreva seu trabalho, curso, serviço ou proposta." />
            </label>

            <label className="partner-grid-full">
              <span>Fotos dos trabalhos para avaliação</span>
              <input type="file" accept="image/*" multiple onChange={selecionarFotos} />
              <small>Você pode enviar até 6 imagens.</small>
            </label>
          </div>

          {nomesFotos.length > 0 && (
            <div className="partner-files">
              <strong>Arquivos selecionados:</strong>
              <div className="partner-files-list">
                {nomesFotos.map((nome) => (
                  <div key={nome} className="partner-file-item">{nome}</div>
                ))}
              </div>
            </div>
          )}

          <div className="partner-actions">
            <button type="button" className="partner-secondary" onClick={aoFechar}>
              Cancelar
            </button>

            <button type="submit" className="partner-primary" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar proposta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PartnerRequestModal;
