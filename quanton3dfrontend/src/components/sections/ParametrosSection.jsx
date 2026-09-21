import { useEffect, useRef, useState } from "react";
import { trackViewProfile, trackCopyProfile } from "../../utils/analytics";
import { AlertTriangle, CheckCircle2, ThumbsUp, ThumbsDown, History, X } from "lucide-react";
import api from "../../lib/api";

function limparTexto(valor) { return String(valor || "").trim(); }
function toTitleCase(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}
function corrigirNomeResina(nome) {
  const limpo = limparTexto(nome);
  if (!limpo) return limpo;
  const corrigido = limpo
    .replace(/^FERRO\s*70\/30\b/i, "70/30")
    .replace(/^IRON\s*70\/30\b/i, "70/30")
    .replace(/^FERRO\s*7030\b/i, "Iron 7030")
    .replace(/^FERRO\b/i, "IRON")
    .replace(/^Iron\b/i, "IRON")
    .replace(/^iron\b/i, "IRON");
  return toTitleCase(corrigido);
}
function chaveResina(nome) { return corrigirNomeResina(nome).toUpperCase(); }

const METODO_LABELS = {
  "teste-fisico": "Validado em teste fisico",
  "calculado": "Parametros calculados",
  "fornecedor": "Dados do fornecedor",
};

// Historico de calibracao (p2-2) — localStorage, max 8 entradas
const HIST_KEY = 'q3d-hist-calibracao';
const MAX_HIST = 8;
function loadHist() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
}
function saveToHist(resinaKey, impressoraSel, p) {
  const entry = {
    ts: new Date().toISOString(),
    resinaKey,
    impressoraSel,
    resinaLabel: corrigirNomeResina(p.resina),
    impressoraLabel: [limparTexto(p.marca), limparTexto(p.impressora)].filter(Boolean).join(' '),
    alturaCamada: p.alturaCamada,
    exposicaoNormal: p.exposicaoNormal,
  };
  const hist = [entry, ...loadHist().filter(h => !(h.resinaKey === entry.resinaKey && h.impressoraSel === entry.impressoraSel))].slice(0, MAX_HIST);
  try { localStorage.setItem(HIST_KEY, JSON.stringify(hist)); } catch {}
  return hist;
}

function ParamItem({ label, value }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: "var(--r-sm)", background: "rgba(0,146,255,0.05)", border: "1px solid var(--border-soft)" }}>
      <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</span>
      <strong style={{ color: "var(--text-primary)", fontSize: "1rem" }}>{value || "-"}</strong>
    </div>
  );
}

function FeedbackParametros({ resina, impressora }) {
  const [voto, setVoto] = useState(null);
  const [obs, setObs] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(v) {
    if (enviando || enviado) return;
    setVoto(v);
    if (v === "positivo") {
      await submeter(v, "");
    }
  }

  async function submeter(v, observacao) {
    setEnviando(true);
    try {
      await api.post("/feedback-parametros", { resina, impressora, voto: v, observacao });
      setEnviado(true);
    } catch (e) {
      console.error("[FEEDBACK]", e);
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", padding: "10px 14px", borderRadius: "var(--r-sm)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <CheckCircle2 size={14} style={{ color: "#22C55E", flexShrink: 0 }} />
        Obrigado pelo feedback! Vamos usar isso para melhorar os perfis.
      </div>
    );
  }

  return (
    <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-soft)", paddingTop: "14px" }}>
      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Esses parametros funcionaram para voce?</span>
      <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => enviar("positivo")}
          disabled={enviando}
          className={"q-btn q-btn--sm " + (voto === "positivo" ? "q-btn--success" : "q-btn--ghost")}
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
        >
          <ThumbsUp size={13} /> Sim
        </button>
        <button
          type="button"
          onClick={() => setVoto("negativo")}
          disabled={enviando}
          className={"q-btn q-btn--sm " + (voto === "negativo" ? "q-btn--danger" : "q-btn--ghost")}
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
        >
          <ThumbsDown size={13} /> Nao
        </button>
      </div>
      {voto === "negativo" && (
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <textarea
            rows={2}
            placeholder="O que nao funcionou? (opcional)"
            value={obs}
            onChange={e => setObs(e.target.value)}
            maxLength={500}
            style={{
              width: "100%",
              resize: "vertical",
              fontSize: "0.8rem",
              padding: "8px 10px",
              borderRadius: "var(--r-sm)",
              border: "1px solid var(--border-soft)",
              background: "var(--surface, #161B27)",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            className="q-btn q-btn--primary q-btn--sm"
            disabled={enviando}
            onClick={() => submeter("negativo", obs)}
          >
            {enviando ? "Enviando..." : "Enviar feedback"}
          </button>
        </div>
      )}
    </div>
  );
}

function ParametrosSection({ onAbrirExposicao }) {
  const [parametros, setParametros] = useState([]);
  const [todasImpressoras, setTodasImpressoras] = useState([]);
  const [fotosImpressoras, setFotosImpressoras] = useState(new Map());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [buscaImpressora, setBuscaImpressora] = useState("");
  const [resultado, setResultado] = useState(null);
  const [semParametros, setSemParametros] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [historico, setHistorico] = useState(() => loadHist());
  const _pendingURL = useRef(null);

  async function carregarParametros() {
    try {
      setCarregando(true); setErro("");
      const [resParametros, resImpressoras] = await Promise.all([
        api.get("/parametros"),
        api.get("/parametros/impressoras"),
      ]);
      const lista = resParametros.data?.data || resParametros.data?.parametros || [];
      setParametros(lista.map((item) => ({
        ...item,
        resina: corrigirNomeResina(item.resina),
        impressora: limparTexto(item.impressora),
        marca: limparTexto(item.marca),
      })));
      const nomes = resImpressoras.data?.data || resImpressoras.data?.impressoras || [];
      setTodasImpressoras(nomes.map(limparTexto).filter(Boolean).sort((a, b) => a.localeCompare(b)));
      try {
        const resFotos = await api.get("/parametros/impressoras-com-foto");
        const rawList = resFotos.data?.data || [];
        if (rawList.length > 0 && typeof rawList[0] === 'object') {
          const mapa = new Map(rawList.map(i => [i.nome.trim().toLowerCase(), i.fotoImpressora || '']));
          setFotosImpressoras(mapa);
        }
      } catch { }
    } catch (err) {
      console.error("Erro ao carregar parametros:", err);
      setErro("Nao foi possivel carregar os parametros tecnicos.");
    } finally { setCarregando(false); }
  }

  // Le params de URL na montagem para auto-selecionar perfil (SEO p2-8)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const r = p.get('resina'); const i = p.get('impressora');
    if (r) _pendingURL.current = { resina: r, impressora: i || '' };
  }, []);

  useEffect(() => { const t = setTimeout(carregarParametros, 0); return () => clearTimeout(t); }, []);

  // Apos carregar dados, aplica auto-selecao da URL
  useEffect(() => {
    if (carregando || !parametros.length || !_pendingURL.current) return;
    const { resina, impressora } = _pendingURL.current;
    _pendingURL.current = null;
    selecionarResina(resina);
    if (impressora) setTimeout(() => selecionarImpressora(impressora), 80);
  }, [carregando, parametros]); // eslint-disable-line

  // Atualiza SEO (titulo, meta description, JSON-LD, URL) ao exibir resultado
  useEffect(() => {
    if (!resultado) return;
    const resina = corrigirNomeResina(resultado.resina);
    const impressora = [limparTexto(resultado.marca), limparTexto(resultado.impressora)].filter(Boolean).join(' ');
    document.title = `Parametros ${resina} + ${impressora} - Quanton3D`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', `Parametros de impressao para ${resina} na ${impressora}: camada ${resultado.alturaCamada || '-'}, exposicao ${resultado.exposicaoNormal || '-'}, base ${resultado.exposicaoBase || '-'}. Perfil testado pela Quanton3D.`);
    let ld = document.getElementById('q3d-ld');
    if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'q3d-ld'; document.head.appendChild(ld); }
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": `Parametros de impressao: ${resina} + ${impressora}`,
      "description": meta.getAttribute('content'),
      "publisher": { "@type": "Organization", "name": "Quanton3D", "url": "https://quanton3d.com.br" },
      "dateModified": resultado.updatedAt || new Date().toISOString(),
    });
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('resina', resultado.resina);
      url.searchParams.set('impressora', resultado.impressora);
      history.replaceState(null, '', url.toString());
    } catch { }
  }, [resultado]);

  const RESINAS_OCULTAR = ["ATHOM CASTABLE", "ATHOM CASTABLE 2"];
  const resinas = Array.from(new Set(parametros.map((item) => corrigirNomeResina(item.resina)).filter(Boolean)))
    .filter(r => !RESINAS_OCULTAR.includes(r.toUpperCase()))
    .sort((a, b) => a.localeCompare(b));

  const impressoras = buscaImpressora && !impressoraSelecionada
    ? todasImpressoras.filter(i => i.toLowerCase().includes(buscaImpressora.toLowerCase()))
    : todasImpressoras;

  function selecionarResina(nome) { setResinaSelecionada(nome); setImpressoraSelecionada(""); setBuscaImpressora(""); setResultado(null); setSemParametros(false); }
  function selecionarImpressora(valor) {
    setImpressoraSelecionada(valor);
    setBuscaImpressora(valor);
    if (!valor) { setResultado(null); setSemParametros(false); return; }
    const nomeModelo = valor.includes(" - ") ? valor.split(" - ").slice(1).join(" - ") : valor;
    const marcaModelo = valor.includes(" - ") ? valor.split(" - ")[0] : "";
    const p = parametros.find((item) =>
      chaveResina(item.resina) === chaveResina(resinaSelecionada) &&
      limparTexto(item.impressora).toLowerCase() === nomeModelo.toLowerCase() &&
      (!marcaModelo || limparTexto(item.marca).toLowerCase() === marcaModelo.toLowerCase())
    );
    if (p) {
      setResultado(p);
      setSemParametros(false);
      trackViewProfile({ resin_name: p.resina, printer_name: p.impressora });
      // Historico de calibracao (p2-2)
      setHistorico(saveToHist(resinaSelecionada, valor, p));
    } else {
      setResultado(null);
      setSemParametros(true);
    }
  }

  function getFotoImpressora(nomeImpressora) {
    if (!nomeImpressora) return '';
    const chave = nomeImpressora.trim().toLowerCase();
    const fotoExata = fotosImpressoras.get(chave);
  if (fotoExata) return fotoExata;
    for (const [catalogNome, foto] of fotosImpressoras) {
      if (foto && (catalogNome.endsWith(chave) || catalogNome.includes(chave))) return foto;
    }
    return '';
  }

  const perfilChituboxTeste = chaveResina(resultado?.resina) === "SPIN+"
    && limparTexto(resultado?.impressora).toUpperCase() === "SATURN 3 ULTRA";
  const codigoChitubox = limparTexto(resultado?.codigoChitubox);

  async function copiarCodigoChitubox() {
    if (!codigoChitubox) return;
    await navigator.clipboard.writeText(codigoChitubox);
    trackCopyProfile({ resin_name: resultado?.resina, printer_name: resultado?.impressora });
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  function limparHistorico() {
    try { localStorage.removeItem(HIST_KEY); } catch {}
    setHistorico([]);
  }

  return (
    <section className="q-card q-panel">
      <div className="q-section-head">
        <span className="q-eyebrow">Consulta rapida</span>
      </div>
      <h2 className="q-section-title">Parametros de impressao</h2>
      <p className="q-section-desc">
        Selecione sua resina e impressora para ver a configuracao inicial recomendada pela Quanton3D.
        {" "}Quer entender o que cada parametro faz? <a href="/guias/secao-parametros-detalhados.html" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Veja a referencia completa</a>
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        {carregando && <span className="q-badge">Carregando...</span>}
        <button type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={carregarParametros}>Atualizar</button>
      </div>
      {erro && <div className="q-alert q-alert--error">{erro}</div>}

      <div className="q-form-grid" style={{ marginBottom: "20px" }}>
        <label className="q-field">
          <span>1. Selecione a Resina</span>
          <select className="q-select" value={resinaSelecionada} onChange={(e) => selecionarResina(e.target.value)} disabled={carregando}>
            <option value="">Selecione a resina</option>
            {resinas.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <div className="q-field">
          <span>2. Selecione a Impressora</span>
          <input
            type="text"
            className="q-select"
            placeholder="Filtrar impressora..."
            value={buscaImpressora}
            disabled={!resinaSelecionada}
            onChange={(e) => { setBuscaImpressora(e.target.value); setImpressoraSelecionada(""); setResultado(null); setSemParametros(false); }}
            style={{ marginBottom: "6px" }}
          />
          <select className="q-select" value={impressoraSelecionada} onChange={(e) => selecionarImpressora(e.target.value)} disabled={!resinaSelecionada || impressoras.length === 0}>
            <option value="">{resinaSelecionada ? "Selecione a impressora" : "Escolha uma resina primeiro"}</option>
            {impressoras.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      {!resultado && !semParametros && (
        <div className="q-empty">
          <h3>Selecione resina e impressora</h3>
          <p>A configuracao inicial recomendada aparecera aqui automaticamente.</p>
        </div>
      )}

      {semParametros && (
        <div className="q-empty" style={{ borderColor: "rgba(255,165,0,0.3)", background: "rgba(255,165,0,0.05)" }}>
          {(() => { const foto = getFotoImpressora(impressoraSelecionada); return foto ? <img src={foto} alt={impressoraSelecionada} onError={e => e.target.style.display='none'} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', marginBottom: '10px' }} /> : null; })()}
          <AlertTriangle size={28} style={{ color: "orange", marginBottom: 8 }} />
          <h3 style={{ color: "var(--text-primary)" }}>Parametros ainda nao disponiveis</h3>
          <p>
            Ainda nao temos parametros validados para <strong>{impressoraSelecionada}</strong> com a resina <strong>{resinaSelecionada}</strong>.
          </p>
        </div>
      )}

      {resultado && (
        <div style={{ background: "rgba(0,146,255,0.04)", border: "1px solid var(--border-soft)", borderRadius: "var(--r-md)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {(() => { const foto = resultado.fotoImpressora || getFotoImpressora(resultado.impressora); return foto ? <img src={foto} alt={resultado.impressora} onError={e => e.target.style.display='none'} style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', flexShrink: 0 }} /> : null; })()}
              <h3 style={{ fontSize: "1.3rem" }}>{corrigirNomeResina(resultado.resina)} + {resultado.marca} {resultado.impressora}</h3>
            </div>
            {perfilChituboxTeste && (
              <button type="button" className={"q-btn q-btn--sm " + (copiado ? "q-btn--success" : "q-btn--primary")} onClick={copiarCodigoChitubox} disabled={!codigoChitubox}>
                {copiado ? <><CheckCircle2 size={13} /> Codigo copiado!</> : "Copiar Codigo CHITUBOX"}
              </button>
            )}
          </div>

          <span className={"q-badge " + (resultado.confianca === "estimado" ? "q-badge--warning" : "q-badge--success")} style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
            {resultado.confianca === "estimado" ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
            {resultado.confianca === "estimado" ? "Estimativa inicial" : "Testado pela Quanton3D"}
          </span>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", fontSize: "0.71rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            {resultado.updatedAt && (
              <span>Atualizado: {new Date(resultado.updatedAt).toLocaleDateString("pt-BR")}</span>
            )}
            {resultado.versao && (
              <span>&#xB7; v{resultado.versao}</span>
            )}
            {resultado.metodoValidacao && (
              <span>&#xB7; {METODO_LABELS[resultado.metodoValidacao] || resultado.metodoValidacao}</span>
            )}
          </div>

          <div className="q-grid" style={{ marginTop: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            <ParamItem label="Altura de Camada" value={resultado.alturaCamada} />
            <ParamItem label="Tempo de Exposicao" value={resultado.exposicaoNormal} />
            <ParamItem label="Exposicao Base" value={resultado.exposicaoBase} />
            <ParamItem label="Camadas de Base" value={resultado.camadasBase} />
          </div>

          <p style={{ margin: "16px 0 0", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Essa e uma configuracao inicial recomendada. Pequenos ajustes podem ser necessarios conforme temperatura ambiente, manutencao da impressora e estado do FEP.
            {onAbrirExposicao && (
              <>
                {" "}Ambiente fora de 20-25 C?{" "}
                <button type="button" onClick={onAbrirExposicao} style={{ padding: 0, border: 0, background: "transparent", color: "var(--primary)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
                  Ajuste a exposicao na calculadora
                </button>
              </>
            )}
          </p>

          <FeedbackParametros
            key={resultado._id || (resultado.resina + resultado.impressora)}
            resina={resultado.resina}
            impressora={resultado.impressora}
          />
        </div>
      )}

      {/* Historico de calibracao (p2-2) */}
      {historico.length > 0 && (
        <div style={{ marginTop: "24px", borderTop: "1px solid var(--border-soft)", paddingTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>
              <History size={14} /> Historico recente
            </span>
            <button type="button" onClick={limparHistorico} title="Limpar historico"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", display: "flex", alignItems: "center" }}>
              <X size={13} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {historico.map((h, i) => (
              <button key={i} type="button"
                onClick={() => { selecionarResina(h.resinaKey); setTimeout(() => selecionarImpressora(h.impressoraSel), 80); }}
                className="q-card q-card--interactive"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", textAlign: "left", gap: "12px", width: "100%" }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>{h.resinaLabel}</strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "8px" }}>{h.impressoraLabel}</span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {[h.alturaCamada, h.exposicaoNormal].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default ParametrosSection;
