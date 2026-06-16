import { useCallback, useEffect, useState } from "react";
import api from "../api";

const GALLERY_PARAM_ARIA_LABELS = {
  public: "Parâmetros da configuração aprovada",
  admin: "Parâmetros enviados pelo cliente",
};

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


export function GaleriaContent({ cliente, modoInicial = "enviar", ocultarAbas = false }) {
  const [aba, setAba] = useState(modoInicial);
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
        {aba === "ver"
          ? "Veja fotos aprovadas de clientes e configurações reais usadas no Chitubox para comparar resina, impressora e parâmetros."
          : "Envie uma foto real da peça e os campos de configuração usados no Chitubox. O envio fica pendente até aprovação no painel administrativo."}
      </p>

      {!ocultarAbas ? (
        <div className="gallery-tabs" role="tablist" aria-label="Galeria e configurações">
          <button type="button" className={aba === "enviar" ? "active" : ""} onClick={() => setAba("enviar")}>📷 Enviar configuração</button>
          <button type="button" className={aba === "ver" ? "active" : ""} onClick={() => setAba("ver")}>Ver fotos de clientes e configurações</button>
        </div>
      ) : null}

      {aba === "enviar" ? (
        <form className="modal-form-layout" style={{ marginTop: "20px" }} onSubmit={enviar}>
          {sucesso ? <div className="modal-success">Enviado com sucesso! A foto e as configurações aguardam aprovação antes de aparecerem para outros clientes.</div> : null}
          <div className="form-grid gallery-form-grid">
            <label><span>Resina usada *</span><input value={form.resina} onChange={(e) => alterar("resina", e.target.value)} placeholder="Ex.: IRON Cinza" /></label>
            <label><span>Impressora *</span><input value={form.impressora} onChange={(e) => alterar("impressora", e.target.value)} placeholder="Ex.: Anycubic Photon M3 Max" /></label>
            <label className="partner-grid-full"><span>Foto do trabalho feito *</span><input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} /></label>
          </div>
          <div className="gallery-config-box">
            <h3>Configurações do Chitubox</h3>
            <p>Preencha os campos que aparecem na aba Imprimir. Deixe em branco o que você não souber.</p>
            <div className="form-grid gallery-settings-grid">
              {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => (
                <label key={campo.name}><span>{campo.label}</span><input value={form.parametros[campo.name]} onChange={(e) => alterarParametro(campo.name, e.target.value)} placeholder={campo.placeholder} /></label>
              ))}
            </div>
          </div>
          <label className="gallery-observation"><span>Observações para o próximo cliente</span><textarea rows="4" value={form.observacao} onChange={(e) => alterar("observacao", e.target.value)} placeholder="Ex.: temperatura do ambiente, suporte usado, se a peça saiu perfeita ou precisou ajuste." /></label>
          <button type="submit" className="submit-registration" disabled={enviando}>{enviando ? "Enviando..." : "Enviar para aprovação"}</button>
        </form>
      ) : (
        <div className="gallery-approved-list">
          {carregandoItens ? <div className="gallery-empty">Carregando fotos aprovadas...</div> : null}
          {erroItens ? <div className="modal-error">{erroItens}</div> : null}
          {!carregandoItens && !erroItens && itens.length === 0 ? <div className="gallery-empty">Ainda não há fotos aprovadas. Assim que o painel administrativo for ajustado, as configurações aprovadas aparecerão aqui para consulta dos próximos clientes.</div> : null}
          {itens.map((item) => (
            <article className="gallery-approved-card" key={item._id || item.imagem}>
              {item.imagem ? <img src={item.imagem} alt={`Peça impressa com ${item.resina || "resina"}`} /> : null}
              <div>
                <h3>{item.resina || "Resina não informada"}</h3>
                <p>{item.impressora || "Impressora não informada"}</p>
                {item.observacao ? <p className="gallery-note">{item.observacao}</p> : null}
                <ul className="gallery-param-list" aria-label={GALLERY_PARAM_ARIA_LABELS.public}>
                  {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                    const valor = item.parametros?.[campo.name];
                    return valor ? <li key={campo.name}><strong>{campo.label}:</strong> {valor}</li> : null;
                  })}
                </ul>
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

export function AdminGaleriaContent() {
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
        <label><span>Usuário</span><input value={credenciais.user} onChange={(e) => setCredenciais((atual) => ({ ...atual, user: e.target.value }))} autoComplete="username" /></label>
        <label><span>Senha</span><input type="password" value={credenciais.password} onChange={(e) => setCredenciais((atual) => ({ ...atual, password: e.target.value }))} autoComplete="current-password" /></label>
        <button type="submit" className="submit-registration" disabled={carregando}>{carregando ? "Entrando..." : "Entrar no ADM"}</button>
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
      {!carregando && itens.length === 0 ? <div className="gallery-empty">Nenhum envio encontrado para os filtros selecionados.</div> : null}

      <div className="admin-gallery-list">
        {itens.map((item) => (
          <article className="admin-gallery-card" key={item._id}>
            {item.imagem ? <img src={item.imagem} alt={`Envio de ${item.nome || "cliente"}`} /> : null}
            <div className="admin-gallery-card-body">
              <div className="admin-gallery-card-head"><div><strong>{item.nome || "Cliente sem nome"}</strong><span>{formatarDataHora(item.createdAt)}</span></div><span className={`admin-status admin-status-${item.status || "pendente"}`}>{item.status || "pendente"}</span></div>
              <div className="admin-client-grid"><span><strong>Telefone:</strong> {item.telefone || "-"}</span><span><strong>E-mail:</strong> {item.email || "-"}</span><span><strong>Resina:</strong> {item.resina || "-"}</span><span><strong>Impressora:</strong> {item.impressora || "-"}</span></div>
              {item.observacao ? <p className="gallery-note">{item.observacao}</p> : null}
              <ul className="gallery-param-list" aria-label={GALLERY_PARAM_ARIA_LABELS.admin}>
                {CAMPOS_CONFIGURACAO_GALERIA.map((campo) => {
                  const valor = item.parametros?.[campo.name];
                  return valor ? <li key={campo.name}><strong>{campo.label}:</strong> {valor}</li> : null;
                })}
              </ul>
              <div className="admin-gallery-actions">
                <button type="button" className="approve" onClick={() => atualizarStatus(item._id, "aprovar")} disabled={salvandoId === item._id || item.status === "aprovado"}>Aprovar</button>
                <button type="button" className="reject" onClick={() => atualizarStatus(item._id, "recusar")} disabled={salvandoId === item._id || item.status === "recusado"}>Não aprovar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
