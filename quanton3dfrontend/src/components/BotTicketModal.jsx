import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./BotTicketModal.css";

const estadoInicial = {
  nome: "",
  telefone: "",
  email: "",
  resina: "",
  impressora: "",
  problemaId: "",
  problemaLabel: "",
  descricao: "",
};

const estadoParametrosInicial = {
  exposicaoNormal: "",
  exposicaoBase: "",
  camadasBase: "",
  alturaCamada: "",
  liftSpeed: "",
  temperaturaAmbiente: "",
  nivelamentoRecente: "",
  resinaCondicao: "",
  momentoFalha: "",
  localFalha: "",
  diametroSuporte: "",
  contatoSuporte: "",
  angulacaoPeca: "",
  tempoCuraUv: "",
  secagemAntesCura: "",
  alcoolPureza: "",
  alcoolReuso: "",
  observacoesTecnicas: "",
};

const CAMPOS_TECNICOS = {
  exposicaoNormal: {
    label: "Exposição normal (seg)",
    placeholder: "Ex.: 2.2",
  },
  exposicaoBase: {
    label: "Exposição base (seg)",
    placeholder: "Ex.: 35",
  },
  camadasBase: {
    label: "Camadas base",
    placeholder: "Ex.: 5",
  },
  alturaCamada: {
    label: "Altura de camada (mm)",
    placeholder: "Ex.: 0.05",
  },
  liftSpeed: {
    label: "Lift speed (mm/min)",
    placeholder: "Ex.: 80",
  },
  temperaturaAmbiente: {
    label: "Temperatura ambiente",
    options: [
      "Fria (abaixo de 20°C)",
      "Normal (20°C a 28°C)",
      "Quente (acima de 28°C)",
    ],
  },
  nivelamentoRecente: {
    label: "Nivelamento recente?",
    options: ["Sim, recentemente", "Não, faz alguns dias", "Não sei"],
  },
  resinaCondicao: {
    label: "Condição da resina",
    options: ["Nova", "Já usada", "Velha", "Não sei"],
  },
  momentoFalha: {
    label: "Quando a falha acontece?",
    options: [
      "No começo da impressão",
      "No meio da impressão",
      "No final da impressão",
      "Depois da cura",
    ],
  },
  localFalha: {
    label: "Onde o problema aparece?",
    options: ["Plataforma", "Suportes", "Peça toda", "Só em algumas áreas"],
  },
  diametroSuporte: {
    label: "Diâmetro dos suportes",
    options: ["Finos", "Médios", "Grossos", "Não sei"],
  },
  contatoSuporte: {
    label: "Contato do suporte",
    options: ["Baixo / pequeno", "Médio", "Alto / profundo", "Não sei"],
  },
  angulacaoPeca: {
    label: "Angulação da peça",
    options: ["Reta", "Com angulação leve", "Com angulação forte", "Não sei"],
  },
  tempoCuraUv: {
    label: "Tempo de cura UV (min)",
    placeholder: "Ex.: 4",
  },
  secagemAntesCura: {
    label: "Secou antes da cura UV?",
    options: ["Sim", "Não", "Parcialmente", "Não sei"],
  },
  alcoolPureza: {
    label: "Pureza do álcool",
    options: ["IPA 99%", "Álcool 95%", "Menor que 95%", "Não sei"],
  },
  alcoolReuso: {
    label: "Reuso do álcool",
    options: ["1 a 2 vezes", "3 a 5 vezes", "Muitas vezes", "Não sei"],
  },
};

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function BotTicketModal({
  aberto,
  aoFechar,
  cliente,
  resinas = [],
  impressoras = [],
}) {
  const [catalogo, setCatalogo] = useState([]);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(false);
  const [erroCatalogo, setErroCatalogo] = useState("");

  const [form, setForm] = useState(estadoInicial);
  const [parametros, setParametros] = useState(estadoParametrosInicial);
  const [respostasGuiadas, setRespostasGuiadas] = useState({});
  const [fotos, setFotos] = useState([]);

  const [etapa, setEtapa] = useState("selecionar");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!aberto) return;

    setForm({
      ...estadoInicial,
      nome: cliente?.nome || "",
      telefone: cliente?.telefone || "",
      email: cliente?.email || "",
    });
    setParametros(estadoParametrosInicial);
    setRespostasGuiadas({});
    setFotos([]);
    setEtapa("selecionar");
    setErro("");
    setResultado(null);

    carregarCatalogo();
  }, [aberto, cliente]);

  async function carregarCatalogo() {
    try {
      setCarregandoCatalogo(true);
      setErroCatalogo("");
      const resposta = await api.get("/bot-tickets/catalog");
      setCatalogo(resposta.data?.catalog || []);
    } catch (error) {
      console.error("Erro ao carregar catálogo do bot:", error);
      setErroCatalogo("Não foi possível carregar o catálogo de problemas.");
      setCatalogo([]);
    } finally {
      setCarregandoCatalogo(false);
    }
  }

  const itensCatalogo = useMemo(() => {
    return catalogo.flatMap((grupo) =>
      (grupo.items || []).map((item) => ({
        ...item,
        category: grupo.category,
        categoryTitle: grupo.title,
      }))
    );
  }, [catalogo]);

  const problemaSelecionado = useMemo(() => {
    return itensCatalogo.find((item) => item.id === form.problemaId) || null;
  }, [itensCatalogo, form.problemaId]);

  const perguntasGuiadasVisiveis = useMemo(() => {
    if (!problemaSelecionado?.guidedQuestions) return [];

    return (problemaSelecionado.guidedQuestions || []).filter((pergunta) => {
      const normalizada = normalizeText(pergunta);

      if (!normalizada) return false;
      if (normalizada.includes("qual impressora")) return false;
      if (normalizada.includes("qual resina")) return false;
      if (normalizada.includes("potencia do led")) return false;
      if (normalizada.includes("tempo de exposicao base e normal")) return false;
      if (normalizada.includes("temperatura ambiente")) return false;
      if (normalizada.includes("a linha esta nova oufa")) return false;
      if (normalizada === "qual e a sua situacao") return false;
      if (normalizada === "qual agora") return false;

      return true;
    });
  }, [problemaSelecionado]);

  const camposTecnicosVisiveis = useMemo(() => {
    return (problemaSelecionado?.technicalFields || []).filter(
      (campo) => CAMPOS_TECNICOS[campo]
    );
  }, [problemaSelecionado]);

  if (!aberto) return null;

  function alterar(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function alterarParametro(campo, valor) {
    setParametros((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function selecionarProblema(item) {
    setForm((atual) => ({
      ...atual,
      problemaId: item.id,
      problemaLabel: item.label,
    }));

    const respostasIniciais = {};
    for (const pergunta of item.guidedQuestions || []) {
      respostasIniciais[pergunta] = "";
    }

    setParametros(estadoParametrosInicial);
    setRespostasGuiadas(respostasIniciais);
    setEtapa("detalhes");
    setErro("");
    setResultado(null);
  }

  function alterarRespostaGuiada(pergunta, valor) {
    setRespostasGuiadas((atual) => ({
      ...atual,
      [pergunta]: valor,
    }));
  }

  function selecionarFotos(event) {
    const arquivos = Array.from(event.target.files || []).slice(0, 6);
    setFotos(arquivos);
  }

  function montarParametrosInformados() {
    const linhas = [];
    const push = (label, value) => {
      const texto = String(value || "").trim();
      if (texto) linhas.push(`${label}: ${texto}`);
    };

    push("Exposição normal", parametros.exposicaoNormal ? `${parametros.exposicaoNormal}s` : "");
    push("Exposição base", parametros.exposicaoBase ? `${parametros.exposicaoBase}s` : "");
    push("Camadas base", parametros.camadasBase);
    push("Altura de camada", parametros.alturaCamada ? `${parametros.alturaCamada}mm` : "");
    push("Lift speed", parametros.liftSpeed ? `${parametros.liftSpeed} mm/min` : "");
    push("Temperatura ambiente", parametros.temperaturaAmbiente);
    push("Nivelamento recente", parametros.nivelamentoRecente);
    push("Resina", parametros.resinaCondicao);
    push("Momento da falha", parametros.momentoFalha);
    push("Onde soltou", parametros.localFalha);
    push("Diâmetro dos suportes", parametros.diametroSuporte);
    push("Contato do suporte", parametros.contatoSuporte);
    push("Angulação da peça", parametros.angulacaoPeca);
    push("Tempo de cura UV", parametros.tempoCuraUv ? `${parametros.tempoCuraUv} min` : "");
    push("Secagem antes da cura", parametros.secagemAntesCura);
    push("Pureza do álcool", parametros.alcoolPureza);
    push("Reuso do álcool", parametros.alcoolReuso);
    push("Observações técnicas", parametros.observacoesTecnicas);

    return linhas.join("\n");
  }

  function montarDescricaoCompleta() {
    const linhas = [];

    if (String(form.descricao || "").trim()) {
      linhas.push(`Descrição principal: ${String(form.descricao).trim()}`);
    }

    const respostas = Object.entries(respostasGuiadas)
      .map(([pergunta, resposta]) => ({
        pergunta,
        resposta: String(resposta || "").trim(),
      }))
      .filter((item) => item.resposta);

    if (respostas.length > 0) {
      linhas.push("Respostas guiadas:");
      respostas.forEach((item) => {
        linhas.push(`- ${item.pergunta} ${item.resposta}`);
      });
    }

    return linhas.join("\n");
  }

  async function enviar(event) {
    event.preventDefault();
    setErro("");
    setResultado(null);

    if (
      !String(form.nome || "").trim() ||
      !String(form.problemaLabel || "").trim() ||
      !String(form.descricao || "").trim()
    ) {
      setErro("Preencha nome, problema e descrição principal.");
      return;
    }

    try {
      setEnviando(true);

      const dados = new FormData();
      dados.append("clienteId", cliente?._id || cliente?.id || "");
      dados.append("nome", String(form.nome || "").trim());
      dados.append("telefone", String(form.telefone || "").trim());
      dados.append("email", String(form.email || "").trim());
      dados.append("resina", String(form.resina || "").trim());
      dados.append("impressora", String(form.impressora || "").trim());
      dados.append("problema", String(form.problemaLabel || "").trim());
      dados.append("descricao", montarDescricaoCompleta());
      dados.append("parametrosInformados", montarParametrosInformados());
      Object.entries(parametros).forEach(([campo, valor]) => {
        dados.append(campo, String(valor || "").trim());
      });
      dados.append("guidedAnswers", JSON.stringify(respostasGuiadas));

      fotos.forEach((foto) => {
        dados.append("fotos", foto);
      });

      const resposta = await api.post("/bot-tickets", dados, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (resposta.data?.success) {
        setResultado({
          ticket: resposta.data?.botTicket || null,
          diagnostico: resposta.data?.diagnostico || null,
        });
        setEtapa("resultado");
      } else {
        setErro("Não foi possível gerar o diagnóstico.");
      }
    } catch (error) {
      console.error("Erro ao enviar ticket do bot:", error);
      setErro(
        error?.response?.data?.message ||
          "Erro ao enviar diagnóstico técnico."
      );
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    setForm({
      ...estadoInicial,
      nome: cliente?.nome || "",
      telefone: cliente?.telefone || "",
      email: cliente?.email || "",
    });
    setParametros(estadoParametrosInicial);
    setRespostasGuiadas({});
    setFotos([]);
    setErro("");
    setResultado(null);
    setEtapa("selecionar");
  }

  function renderPerguntaGuiada(pergunta) {
    const normalizada = normalizeText(pergunta);
    const valor = respostasGuiadas[pergunta] || "";

    const commonProps = {
      value: valor,
      onChange: (e) => alterarRespostaGuiada(pergunta, e.target.value),
    };

    if (normalizada.includes("deixou o alcool evaporar")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
          <option value="Parcialmente">Parcialmente</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (normalizada.includes("toda superficie ou so em pontos")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Em toda a superfície">Em toda a superfície</option>
          <option value="Só em alguns pontos">Só em alguns pontos</option>
          <option value="Metade da peça">Metade da peça</option>
        </select>
      );
    }

    if (normalizada.includes("pureza do alcool")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="IPA 99%">IPA 99%</option>
          <option value="Álcool 95%">Álcool 95%</option>
          <option value="Menor que 95%">Menor que 95%</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (normalizada.includes("quantas vezes voce reutiliza o alcool")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="1 a 2 vezes">1 a 2 vezes</option>
          <option value="3 a 5 vezes">3 a 5 vezes</option>
          <option value="Muitas vezes">Muitas vezes</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (normalizada.includes("a peca esta reta ou com angulacao")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Reta">Reta</option>
          <option value="Com angulação leve">Com angulação leve</option>
          <option value="Com angulação forte">Com angulação forte</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (normalizada.includes("diametro dos suportes")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Finos">Finos</option>
          <option value="Médios">Médios</option>
          <option value="Grossos">Grossos</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (
      normalizada.includes("a peca e grande pesada") ||
      normalizada.includes("overhangs")
    ) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Pequena e leve">Pequena e leve</option>
          <option value="Média">Média</option>
          <option value="Grande ou pesada">Grande ou pesada</option>
          <option value="Tem muitos overhangs">Tem muitos overhangs</option>
        </select>
      );
    }

    if (normalizada.includes("metodo voce usa")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Papel">Papel</option>
          <option value="Home / 0.0">Home / 0.0</option>
          <option value="Sensor automático">Sensor automático</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (normalizada.includes("tanque esta bem encaixado")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (normalizada.includes("fep esta danificada") || normalizada.includes("tela fep")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Sim, está danificada">Sim, está danificada</option>
          <option value="Não, parece normal">Não, parece normal</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (normalizada.includes("apertou demais os parafusos")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (
      normalizada.includes("agitada antes do uso") ||
      normalizada.includes("agita bem a resina")
    ) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
          <option value="Mais ou menos">Mais ou menos</option>
        </select>
      );
    }

    if (normalizada.includes("areas grossas e finas")) {
      return (
        <select {...commonProps}>
          <option value="">Selecione</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
          <option value="Não sei">Não sei</option>
        </select>
      );
    }

    if (normalizada.includes("filtro uv") || normalizada.includes("cabine de cura")) {
      return (
        <input
          {...commonProps}
          placeholder="Ex.: cabine 405nm, sol, câmara UV..."
        />
      );
    }

    if (normalizada.includes("distancia entre a peca e a lampada")) {
      return (
        <input
          {...commonProps}
          placeholder="Ex.: 10 cm"
        />
      );
    }

    if (normalizada.includes("erro aparece na tela")) {
      return (
        <input
          {...commonProps}
          placeholder="Ex.: leveling failed, lcd error..."
        />
      );
    }

    if (normalizada.includes("descreva o problema em detalhes")) {
      return (
        <textarea
          rows="3"
          value={valor}
          onChange={(e) => alterarRespostaGuiada(pergunta, e.target.value)}
          placeholder="Explique com mais detalhes o que aconteceu."
        />
      );
    }

    return (
      <input
        {...commonProps}
        placeholder="Sua resposta"
      />
    );
  }

  function renderCampoTecnico(campo) {
    const config = CAMPOS_TECNICOS[campo];
    if (!config) return null;

    const valor = parametros[campo] || "";

    if (config.options) {
      return (
        <label key={campo}>
          <span>{config.label}</span>
          <select
            value={valor}
            onChange={(e) => alterarParametro(campo, e.target.value)}
          >
            <option value="">Selecione</option>
            {config.options.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label key={campo}>
        <span>{config.label}</span>
        <input
          value={valor}
          onChange={(e) => alterarParametro(campo, e.target.value)}
          placeholder={config.placeholder || "Informe o valor"}
        />
      </label>
    );
  }

  return (
    <div className="bot-ticket-backdrop">
      <div className="bot-ticket-shell">
        <button type="button" className="bot-ticket-close" onClick={aoFechar}>
          ✕ Fechar
        </button>

        <div className="bot-ticket-modal">
          <div className="bot-ticket-header">
            <div>
              <span className="bot-ticket-badge">Diagnóstico Quanton3D IA</span>
              <h2>Diagnosticar meu problema</h2>
              <p>
                Escolha o sintoma, preencha só o necessário e receba uma resposta
                técnica mais clara para o cliente e para o painel admin.
              </p>
            </div>

            <div className="bot-ticket-progress">
              <div className={`step ${etapa === "selecionar" ? "active" : ""}`}>
                1. Problema
              </div>
              <div className={`step ${etapa === "detalhes" ? "active" : ""}`}>
                2. Dados
              </div>
              <div className={`step ${etapa === "resultado" ? "active" : ""}`}>
                3. Resultado
              </div>
            </div>
          </div>

          {erro && <div className="bot-ticket-error">{erro}</div>}

          {etapa === "selecionar" && (
            <div className="bot-ticket-section">
              <div className="bot-ticket-section-top">
                <div>
                  <h3>Selecione o problema principal</h3>
                  <p>Comece pela categoria do defeito para o bot entender melhor o seu caso.</p>
                </div>

                <button
                  type="button"
                  className="bot-ticket-ghost"
                  onClick={carregarCatalogo}
                >
                  Atualizar catálogo
                </button>
              </div>

              {carregandoCatalogo && (
                <div className="bot-ticket-info">Carregando catálogo...</div>
              )}

              {erroCatalogo && (
                <div className="bot-ticket-error">{erroCatalogo}</div>
              )}

              {!carregandoCatalogo &&
                catalogo.map((grupo) => (
                  <section key={grupo.category} className="bot-ticket-group">
                    <h4>{grupo.title}</h4>

                    <div className="bot-ticket-card-grid">
                      {(grupo.items || []).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="bot-problem-card"
                          onClick={() => selecionarProblema(item)}
                        >
                          <span className="bot-problem-title">{item.label}</span>
                          <small>{(item.guidedQuestions || []).length} perguntas guiadas</small>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          )}

          {etapa === "detalhes" && problemaSelecionado && (
            <form className="bot-ticket-section" onSubmit={enviar}>
              <div className="bot-ticket-section-top">
                <div>
                  <h3>{problemaSelecionado.label}</h3>
                  <p>{problemaSelecionado.categoryTitle}</p>
                </div>

                <button
                  type="button"
                  className="bot-ticket-ghost"
                  onClick={() => setEtapa("selecionar")}
                >
                  Voltar
                </button>
              </div>

              <div className="bot-ticket-grid">
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

                <label>
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => alterar("email", e.target.value)}
                    placeholder="seu@email.com"
                  />
                </label>

                <label>
                  <span>Resina</span>
                  <select
                    value={form.resina}
                    onChange={(e) => alterar("resina", e.target.value)}
                  >
                    <option value="">Selecione a resina</option>
                    {resinas.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Impressora</span>
                  <select
                    value={form.impressora}
                    onChange={(e) => alterar("impressora", e.target.value)}
                  >
                    <option value="">Selecione a impressora</option>
                    {impressoras.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="bot-ticket-full">
                  <span>Descrição principal *</span>
                  <textarea
                    rows="4"
                    value={form.descricao}
                    onChange={(e) => alterar("descricao", e.target.value)}
                    placeholder="Ex.: peça soltando da plataforma logo no começo, ou peça rachando depois da cura."
                  />
                </label>
              </div>

              {(camposTecnicosVisiveis.length > 0 ||
                problemaSelecionado.kind !== "hardware") && (
                <div className="bot-ticket-structured">
                  <h4>Parâmetros técnicos</h4>
                  <p className="bot-ticket-subtext">
                    Preencha só os campos que combinam com este problema.
                  </p>

                  {camposTecnicosVisiveis.length > 0 ? (
                    <div className="bot-ticket-params-grid">
                      {camposTecnicosVisiveis.map(renderCampoTecnico)}

                      <label className="bot-ticket-full">
                        <span>Observações técnicas</span>
                        <textarea
                          rows="3"
                          value={parametros.observacoesTecnicas}
                          onChange={(e) => alterarParametro("observacoesTecnicas", e.target.value)}
                          placeholder="Ex.: usei álcool 99%, sala fria, resina parada há 2 semanas..."
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="bot-ticket-info">
                      Este problema depende mais da descrição, fotos e perguntas guiadas do que de parâmetros de exposição.
                    </div>
                  )}
                </div>
              )}

              {perguntasGuiadasVisiveis.length > 0 && (
                <div className="bot-ticket-guided">
                  <h4>Perguntas guiadas</h4>
                  <p className="bot-ticket-subtext">
                    Só aparecem perguntas realmente úteis para esse tipo de problema.
                  </p>

                  <div className="bot-ticket-guided-grid">
                    {perguntasGuiadasVisiveis.map((pergunta) => (
                      <label key={pergunta} className="bot-ticket-full">
                        <span>{pergunta}</span>
                        {renderPerguntaGuiada(pergunta)}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className="bot-ticket-full">
                <span>Fotos do problema</span>
                <input type="file" accept="image/*" multiple onChange={selecionarFotos} />
                <small>Você pode enviar até 6 imagens.</small>
              </label>

              {fotos.length > 0 && (
                <div className="bot-ticket-files">
                  {fotos.map((foto) => (
                    <div key={`${foto.name}-${foto.size}`} className="bot-ticket-file-item">
                      {foto.name}
                    </div>
                  ))}
                </div>
              )}

              <div className="bot-ticket-actions">
                <button type="button" className="bot-ticket-secondary" onClick={aoFechar}>
                  Cancelar
                </button>

                <button type="submit" className="bot-ticket-primary" disabled={enviando}>
                  {enviando ? "Gerando diagnóstico..." : "Analisar meu problema"}
                </button>
              </div>
            </form>
          )}

          {etapa === "resultado" && resultado?.diagnostico && (
            <div className="bot-ticket-section">
              <div className="bot-ticket-section-top">
                <div>
                  <h3>{resultado.diagnostico.detectedProblem?.label || "Diagnóstico"}</h3>
                  <p>
                    Confiança estimada:{" "}
                    <strong>{resultado.diagnostico.confidence || 0}%</strong>
                  </p>
                </div>

                <button type="button" className="bot-ticket-ghost" onClick={reiniciar}>
                  Novo diagnóstico
                </button>
              </div>

              <div className="bot-result-grid">
                <section className="bot-result-card bot-result-main">
                  <h4>Resposta técnica</h4>
                  <p>{resultado.diagnostico.finalAnswer}</p>
                </section>

                <section className="bot-result-card">
                  <h4>Causas mais prováveis</h4>
                  <ul>
                    {(resultado.diagnostico.probableCauses || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="bot-result-card">
                  <h4>O que testar agora</h4>
                  <ul className="checklist">
                    {(resultado.diagnostico.checklist || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="bot-result-card">
                  <h4>Prevenção</h4>
                  <ul>
                    {(resultado.diagnostico.preventionTips || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                {resultado.diagnostico.parameterMatch && (
                  <section className="bot-result-card">
                    <h4>Parâmetros encontrados</h4>
                    <div className="bot-result-params">
                      <div><strong>Resina:</strong> {resultado.diagnostico.parameterMatch.resina}</div>
                      <div><strong>Impressora:</strong> {resultado.diagnostico.parameterMatch.impressora}</div>
                      <div><strong>Altura:</strong> {resultado.diagnostico.parameterMatch.alturaCamada}</div>
                      <div><strong>Normal:</strong> {resultado.diagnostico.parameterMatch.exposicaoNormal}</div>
                      <div><strong>Base:</strong> {resultado.diagnostico.parameterMatch.exposicaoBase}</div>
                      <div><strong>Camadas base:</strong> {resultado.diagnostico.parameterMatch.camadasBase}</div>
                    </div>
                  </section>
                )}

                {resultado.diagnostico.knowledgeMatch && (
                  <section className="bot-result-card">
                    <h4>Base técnica consultada</h4>
                    <p><strong>Título:</strong> {resultado.diagnostico.knowledgeMatch.title}</p>
                    <p><strong>Fonte:</strong> {resultado.diagnostico.knowledgeMatch.source}</p>
                    <p>{resultado.diagnostico.knowledgeMatch.preview}</p>
                  </section>
                )}

                <section className="bot-result-card">
                  <h4>Status do atendimento</h4>
                  <p>
                    {resultado.diagnostico.shouldEscalateToAdmin
                      ? "Este caso também foi sinalizado para revisão humana, porque a confiança ainda pode melhorar."
                      : "O sistema entendeu seu caso com boa confiança e já retornou a solução principal."}
                  </p>
                </section>
              </div>

              <div className="bot-ticket-actions">
                <button type="button" className="bot-ticket-secondary" onClick={aoFechar}>
                  Fechar
                </button>

                <button type="button" className="bot-ticket-primary" onClick={reiniciar}>
                  Diagnosticar outro problema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BotTicketModal;
