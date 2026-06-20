import { useEffect, useState } from "react";
import api from "../api";

const PARAMETRO_FIELDS = [
  { name: "alturaCamada", label: "Altura da camada", placeholder: "Ex.: 0,05 mm" },
  { name: "exposicaoNormal", label: "Exposição normal", placeholder: "Ex.: 2,5 s" },
  { name: "exposicaoBase", label: "Exposição base", placeholder: "Ex.: 35 s" },
  { name: "camadasBase", label: "Camadas base", placeholder: "Ex.: 5" },
  { name: "velocidadeElevacao", label: "Velocidade de elevação", placeholder: "Ex.: 60 mm/min" },
  { name: "distanciaElevacao", label: "Distância de elevação", placeholder: "Ex.: 6 mm" },
];

const parametrosIniciais = PARAMETRO_FIELDS.reduce((acc, field) => {
  acc[field.name] = "";
  return acc;
}, {});

function resolverImagem(imagem) {
  if (!imagem) return "";
  if (/^https?:\/\//i.test(imagem)) return imagem;
  return imagem.startsWith("/") ? imagem : `/${imagem}`;
}

function listarParametros(parametros = {}) {
  return PARAMETRO_FIELDS
    .map((field) => ({ label: field.label, value: parametros[field.name] }))
    .filter((item) => item.value);
}

export default function GaleriaContent({ cliente }) {
  const [aba, setAba] = useState("enviar");
  const [form, setForm] = useState({ resina: "", impressora: "", observacao: "" });
  const [parametros, setParametros] = useState(parametrosIniciais);
  const [foto, setFoto] = useState(null);
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregarGaleria() {
    try {
      setCarregando(true);
      const { data } = await api.get("/gallery");
      setItens(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error("Erro ao carregar galeria:", err);
      setMensagem("Não foi possível carregar as fotos aprovadas agora.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (aba !== "ver") return undefined;

    const carregamento = setTimeout(carregarGaleria, 0);
    return () => clearTimeout(carregamento);
  }, [aba]);

  async function enviar(event) {
    event.preventDefault();

    if (!form.resina.trim() || !form.impressora.trim() || !foto) {
      setMensagem("Informe resina, impressora e uma foto antes de enviar.");
      return;
    }

    try {
      setEnviando(true);
      setMensagem("");

      const formData = new FormData();
      formData.append("nome", cliente?.nome || "");
      formData.append("telefone", cliente?.telefone || "");
      formData.append("email", cliente?.email || "");
      formData.append("clienteId", cliente?._id || "");
      formData.append("resina", form.resina);
      formData.append("impressora", form.impressora);
      formData.append("observacao", form.observacao);
      formData.append("fotos", foto);

      Object.entries(parametros).forEach(([key, value]) => {
        if (value) formData.append(`parametros.${key}`, value);
      });

      await api.post("/gallery", formData);
      setMensagem("Foto enviada! Ela ficará pendente até aprovação antes de aparecer na galeria.");
      setForm({ resina: "", impressora: "", observacao: "" });
      setParametros({ ...parametrosIniciais });
      setFoto(null);
      event.target.reset();
    } catch (err) {
      console.error("Erro ao enviar para galeria:", err);
      setMensagem("Erro ao enviar para galeria. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-rich-content gallery-content">
      <p>Envie uma foto real da peça com os parâmetros usados. A publicação só aparece depois de aprovação.</p>

      <div className="gallery-tabs" role="tablist" aria-label="Galeria e configurações">
        <button type="button" className={aba === "enviar" ? "active" : ""} onClick={() => setAba("enviar")}>Enviar foto</button>
        <button type="button" className={aba === "ver" ? "active" : ""} onClick={() => setAba("ver")}>Ver aprovadas</button>
      </div>

      {mensagem && <div className="modal-success gallery-message">{mensagem}</div>}

      {aba === "enviar" ? (
        <form className="gallery-form" onSubmit={enviar}>
          <div className="form-grid gallery-form-grid">
            <label><span>Resina usada</span><input value={form.resina} onChange={(event) => setForm({ ...form, resina: event.target.value })} placeholder="Ex.: Iron Cinza" /></label>
            <label><span>Impressora</span><input value={form.impressora} onChange={(event) => setForm({ ...form, impressora: event.target.value })} placeholder="Ex.: Saturn 4 Ultra" /></label>
            <label className="full-width"><span>Foto da peça</span><input type="file" accept="image/*" onChange={(event) => setFoto(event.target.files?.[0] || null)} /></label>
          </div>

          <div className="gallery-config-box">
            <h3>Parâmetros usados</h3>
            <div className="form-grid gallery-settings-grid">
              {PARAMETRO_FIELDS.map((field) => (
                <label key={field.name}>
                  <span>{field.label}</span>
                  <input value={parametros[field.name]} onChange={(event) => setParametros({ ...parametros, [field.name]: event.target.value })} placeholder={field.placeholder} />
                </label>
              ))}
            </div>
            <label className="gallery-observation"><span>Observações</span><textarea rows="3" value={form.observacao} onChange={(event) => setForm({ ...form, observacao: event.target.value })} placeholder="Conte detalhes importantes da impressão." /></label>
          </div>

          <button type="submit" className="submit-registration" disabled={enviando}>{enviando ? "Enviando..." : "Enviar para aprovação"}</button>
        </form>
      ) : (
        <div className="gallery-approved-list">
          {carregando && <div className="gallery-empty">Carregando fotos aprovadas...</div>}
          {!carregando && itens.length === 0 && <div className="gallery-empty">Ainda não há fotos aprovadas na galeria.</div>}
          {itens.map((item) => (
            <article className="gallery-approved-card" key={item._id}>
              {item.imagem && <img src={resolverImagem(item.imagem)} alt={`Peça impressa com ${item.resina || "resina"}`} />}
              <div>
                <h3>{item.resina || "Resina não informada"}</h3>
                <p><strong>Impressora:</strong> {item.impressora || "Não informada"}</p>
                {item.observacao && <p className="gallery-note">{item.observacao}</p>}
                <div className="gallery-param-list">
                  {listarParametros(item.parametros).map((parametro) => <span key={parametro.label}>{parametro.label}: {parametro.value}</span>)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
