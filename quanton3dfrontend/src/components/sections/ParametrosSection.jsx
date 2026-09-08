import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "../../lib/api";

function limparTexto(valor) { return String(valor || "").trim(); }
function corrigirNomeResina(nome) {
  return limparTexto(nome)
    .replace(/^FERRO\s*70\/30\b/i, "IRON 70/30")
    .replace(/^FERRO\s*7030\b/i, "IRON 7030")
    .replace(/^FERRO\b/i, "IRON")
    .replace(/^Iron\b/i, "IRON")
    .replace(/^iron\b/i, "IRON");
}
function chaveResina(nome) { return corrigirNomeResina(nome).toUpperCase(); }

function ParamItem({ label, value }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: "var(--r-sm)", background: "rgba(0,146,255,0.05)", border: "1px solid var(--border-soft)" }}>
      <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</span>
      <strong style={{ color: "var(--text-primary)", fontSize: "1rem" }}>{value || "-"}</strong>
    </div>
  );
}

function ParametrosSection({ onAbrirExposicao }) {
  const [parametros, setParametros] = useState([]);
  const [todasImpressoras, setTodasImpressoras] = useState([]); // lista mesclada (parametros + catálogo)
  const [fotosImpressoras, setFotosImpressoras] = useState(new Map()); // nome.lower -> fotoImpressora
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [buscaImpressora, setBuscaImpressora] = useState("");
  const [resultado, setResultado] = useState(null);
  const [semParametros, setSemParametros] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function carregarParametros() {
    try {
      setCarregando(true); setErro("");
      const [resParametros, resImpressoras] = await Promise.all([
        api.get("/parametros"),
        api.get("/parametros/impressoras-com-foto"),
      ]);
      const lista = resParametros.data?.data || resParametros.data?.parametros || [];
      setParametros(lista.map((item) => ({
        ...item,
        resina: corrigirNomeResina(item.resina),
        impressora: limparTexto(item.impressora),
        marca: limparTexto(item.marca),
      })));
      // endpoint retorna { success, data: [{nome, fotoImpressora}] } ou fallback string[]
      const rawList = resImpressoras.data?.data || resImpressoras.data?.impressoras || [];
      if (rawList.length > 0 && typeof rawList[0] === 'object') {
        // novo formato com fotos
        const mapa = new Map(rawList.map(i => [i.nome.trim().toLowerCase(), i.fotoImpressora || '']));
        setFotosImpressoras(mapa);
        setTodasImpressoras(rawList.map(i => limparTexto(i.nome)).filter(Boolean));
      } else {
        // fallback formato antigo (strings)
        setFotosImpressoras(new Map());
        setTodasImpressoras(rawList.map(limparTexto).filter(Boolean).sort((a, b) => a.localeCompare(b)));
      }
    } catch (err) {
      console.error("Erro ao carregar parâmetros:", err);
      setErro("Não foi possível carregar os parâmetros técnicos.");
    } finally { setCarregando(false); }
  }

  useEffect(() => { const t = setTimeout(carregarParametros, 0); return () => clearTimeout(t); }, []);

  const resinas = Array.from(new Set(parametros.map((item) => corrigirNomeResina(item.resina)).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  // Impressoras disponíveis: todas do catálogo mesclado, filtradas pela busca
  const impressoras = buscaImpressora && !impressoraSelecionada
    ? todasImpressoras.filter(i => i.toLowerCase().includes(buscaImpressora.toLowerCase()))
    : todasImpressoras;

  function selecionarResina(nome) { setResinaSelecionada(nome); setImpressoraSelecionada(""); setBuscaImpressora(""); setResultado(null); setSemParametros(false); }
  function selecionarImpressora(valor) {
    setImpressoraSelecionada(valor);
    setBuscaImpressora(valor);
    if (!valor) { setResultado(null); setSemParametros(false); return; }
    const chaveR = chaveResina(resinaSelecionada);
    const valorLower = valor.trim().toLowerCase();
    // Tenta match: 1) impressora exata, 2) catálogo tem "Marca Modelo" e parametro tem só "Modelo"
    const p = parametros.find((item) => {
      if (chaveResina(item.resina) !== chaveR) return false;
      const imp = limparTexto(item.impressora).toLowerCase();
      const marca = limparTexto(item.marca).toLowerCase();
      // Match exato nome do catálogo com impressora
      if (imp === valorLower) return true;
      // Catálogo: "ELEGOO Mars 2 Pro" → item.impressora: "Mars 2 Pro", item.marca: "ELEGOO"
      if (valorLower === `${marca} ${imp}`) return true;
      // Catálogo nome contém o nome da impressora e começa com a marca
      if (marca && valorLower.startsWith(marca) && valorLower.includes(imp)) return true;
      // fallback: catálogo nome termina com o nome da impressora
      if (valorLower.endsWith(imp)) return true;
      return false;
    });
    if (p) { setResultado(p); setSemParametros(false); }
    else { setResultado(null); setSemParametros(true); }
  }

  // Foto da impressora: prioriza o campo do parâmetro, depois busca no mapa do catálogo
  function getFotoImpressora(nomeImpressora) {
    if (!nomeImpressora) return '';
    const chave = nomeImpressora.trim().toLowerCase();
    return fotosImpressoras.get(chave) || '';
  }

  const perfilChituboxTeste = chaveResina(resultado?.resina) === "SPIN+"
    && limparTexto(resultado?.impressora).toUpperCase() === "SATURN 3 ULTRA";
  const codigoChitubox = limparTexto(resultado?.codigoChitubox);

  async function copiarCodigoChitubox() {
    if (!codigoChitubox) return;
    await navigator.clipboard.writeText(codigoChitubox);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <section className="q-card q-panel">
      <div className="q-section-head">
        <span className="q-eyebrow">Consulta rápida</span>
      </div>
      <h2 className="q-section-title">Parâmetros de impressão</h2>
      <p className="q-section-desc">
        Selecione sua resina e impressora para ver a configuração inicial recomendada pela Quanton3D.
        {" "}Quer entender o que cada parâmetro faz? <a href="/guias/secao-parametros-detalhados.html" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Veja a referência completa →</a>
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
        <label className="q-field">
          <span>2. Selecione a Impressora</span>
          <input
            className="q-select"
            type="text"
            placeholder={resinaSelecionada ? (impressoraSelecionada || "Digite para buscar...") : "Escolha uma resina primeiro"}
            value={buscaImpressora}
            disabled={!resinaSelecionada}
            onChange={(e) => { setBuscaImpressora(e.target.value); setImpressoraSelecionada(""); setResultado(null); setSemParametros(false); }}
            style={{ marginBottom: impressoras.length > 0 && buscaImpressora && !impressoraSelecionada ? "0" : undefined }}
          />
          {impressoras.length > 0 && buscaImpressora && !impressoraSelecionada && (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 99, background: "var(--surface-2, #1a1a2e)", border: "1px solid var(--border-soft)", borderTop: "none", borderRadius: "0 0 10px 10px", maxHeight: "200px", overflowY: "auto" }}>
                {impressoras.slice(0, 50).map((i) => (
                  <div key={i} onClick={() => selecionarImpressora(i)}
                    style={{ padding: "9px 14px", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-primary)", borderBottom: "1px solid var(--border-soft)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(79,209,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {i}
                  </div>
                ))}
                {impressoras.length > 50 && <div style={{ padding: "8px 14px", fontSize: "0.75rem", color: "var(--text-muted)" }}>+{impressoras.length - 50} resultados — refine a busca</div>}
              </div>
            </div>
          )}
        </label>
      </div>

      {!resultado && !semParametros && (
        <div className="q-empty">
          <h3>Selecione resina e impressora</h3>
          <p>A configuração inicial recomendada aparecerá aqui automaticamente.</p>
        </div>
      )}

      {semParametros && (
        <div className="q-empty" style={{ borderColor: "rgba(255,165,0,0.3)", background: "rgba(255,165,0,0.05)" }}>
          {(() => { const foto = getFotoImpressora(impressoraSelecionada); return foto ? <img src={foto} alt={impressoraSelecionada} onError={e => e.target.style.display='none'} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', marginBottom: '10px' }} /> : null; })()}
          <AlertTriangle size={28} style={{ color: "orange", marginBottom: 8 }} />
          <h3 style={{ color: "var(--text-primary)" }}>Parâmetros ainda não disponíveis</h3>
          <p>
            Ainda não temos parâmetros validados para <strong>{impressoraSelecionada}</strong> com a resina <strong>{resinaSelecionada}</strong>.
            <br />
            Conhece essa combinação? Ajude a comunidade!
          </p>
        </div>
      )}

      {resultado && (
        <div style={{ background: "rgba(0,146,255,0.04)", border: "1px solid var(--border-soft)", borderRadius: "var(--r-md)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {(() => { const foto = resultado.fotoImpressora || getFotoImpressora(resultado.impressora); return foto ? <img src={foto} alt={resultado.impressora} onError={e => e.target.style.display='none'} style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', flexShrink: 0 }} /> : null; })()}
              <h3 style={{ fontSize: "1.05rem" }}>{corrigirNomeResina(resultado.resina)} + {resultado.marca} {resultado.impressora}</h3>
            </div>
            {perfilChituboxTeste && (
              <button type="button" className={"q-btn q-btn--sm " + (copiado ? "q-btn--success" : "q-btn--primary")} onClick={copiarCodigoChitubox} disabled={!codigoChitubox} title={codigoChitubox ? "Copiar código para importar no CHITUBOX" : "Aguardando publicação do perfil no Fusion Material Center"}>
                {copiado ? <><CheckCircle2 size={13} /> Código copiado!</> : "Copiar Código CHITUBOX"}
              </button>
            )}
          </div>

          <span className={"q-badge " + (resultado.confianca === "estimado" ? "q-badge--warning" : "q-badge--success")} style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginBottom: "14px" }}>
            {resultado.confianca === "estimado" ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
            {resultado.confianca === "estimado" ? "Estimativa inicial" : "Testado pela Quanton3D"}
          </span>

          <div className="q-grid" style={{ marginTop: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            <ParamItem label="Altura de Camada" value={resultado.alturaCamada} />
            <ParamItem label="Tempo de Exposição" value={resultado.exposicaoNormal} />
            <ParamItem label="Exposição Base" value={resultado.exposicaoBase} />
            <ParamItem label="Camadas de Base" value={resultado.camadasBase} />
          </div>

          {perfilChituboxTeste && !codigoChitubox && (
            <p style={{ margin: "16px 0 0", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              O perfil ainda precisa ser publicado no Fusion Material Center. Depois, salve o código fornecido pelo CHITUBOX no campo <strong>codigoChitubox</strong> deste parâmetro para habilitar a cópia.
            </p>
          )}

          <p style={{ margin: "16px 0 0", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Essa é uma configuração inicial recomendada. Pequenos ajustes podem ser necessários conforme temperatura ambiente, manutenção da impressora e estado do FEP.
            {onAbrirExposicao && (
              <>
                {" "}Ambiente fora de 20–25&nbsp;°C?{" "}
                <button type="button" onClick={onAbrirExposicao} style={{ padding: 0, border: 0, background: "transparent", color: "var(--primary)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
                  Ajuste a exposição na calculadora →
                </button>
              </>
            )}
          </p>
        </div>
      )}
    </section>
  );
}

export default ParametrosSection;
