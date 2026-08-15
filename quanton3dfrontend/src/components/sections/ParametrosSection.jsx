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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [resinaSelecionada, setResinaSelecionada] = useState("");
  const [impressoraSelecionada, setImpressoraSelecionada] = useState("");
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  async function carregarParametros() {
    try {
      setCarregando(true); setErro("");
      const res = await api.get("/parametros");
      const lista = res.data?.data || res.data?.parametros || [];
      setParametros(lista.map((item) => ({
        ...item,
        resina: corrigirNomeResina(item.resina),
        impressora: limparTexto(item.impressora),
        marca: limparTexto(item.marca),
      })));
    } catch (err) {
      console.error("Erro ao carregar parâmetros:", err);
      setErro("Não foi possível carregar os parâmetros técnicos.");
    } finally { setCarregando(false); }
  }

  useEffect(() => { const t = setTimeout(carregarParametros, 0); return () => clearTimeout(t); }, []);

  const resinas = Array.from(new Set(parametros.map((item) => corrigirNomeResina(item.resina)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const impressoras = Array.from(new Set(parametros.filter((item) => chaveResina(item.resina) === chaveResina(resinaSelecionada) && item.impressora).map((item) => item.marca ? `${item.marca} - ${item.impressora}` : item.impressora))).sort((a, b) => a.localeCompare(b));

  function selecionarResina(nome) { setResinaSelecionada(nome); setImpressoraSelecionada(""); setResultado(null); }
  function selecionarImpressora(valor) {
    setImpressoraSelecionada(valor);
    const nomeModelo = valor.includes(" - ") ? valor.split(" - ").slice(1).join(" - ") : valor;
    const marcaModelo = valor.includes(" - ") ? valor.split(" - ")[0] : "";
    const p = parametros.find((item) => chaveResina(item.resina) === chaveResina(resinaSelecionada) && item.impressora === nomeModelo && (!marcaModelo || item.marca === marcaModelo));
    setResultado(p || null);
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
          <select className="q-select" value={impressoraSelecionada} onChange={(e) => selecionarImpressora(e.target.value)} disabled={!resinaSelecionada || impressoras.length === 0}>
            <option value="">{resinaSelecionada ? "Selecione a impressora" : "Escolha uma resina primeiro"}</option>
            {impressoras.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
      </div>

      {!resultado && (
        <div className="q-empty">
          <h3>Selecione resina e impressora</h3>
          <p>A configuração inicial recomendada aparecerá aqui automaticamente.</p>
        </div>
      )}

      {resultado && (
        <div style={{ background: "rgba(0,146,255,0.04)", border: "1px solid var(--border-soft)", borderRadius: "var(--r-md)", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "1.05rem" }}>{corrigirNomeResina(resultado.resina)} + {resultado.marca} {resultado.impressora}</h3>
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
