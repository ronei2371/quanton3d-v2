import { useState } from "react";
import { Timer, Layers, Pause, Info, AlertTriangle, Wrench, ArrowRight } from "lucide-react";

function fmtTempo(minutos) {
  if (!minutos || minutos <= 0) return "0 min";
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function ResultCard({ cor, label, value }) {
  return (
    <div className="calc-metric-card" style={{ textAlign: "center", borderColor: `${cor}55` }}>
      <p className="calc-metric-label">{label}</p>
      <p className="calc-metric-value" style={{ color: cor, fontSize: "1.4rem" }}>{value}</p>
    </div>
  );
}

// Campo de tempo em horas + minutos
function HMInput({ label, horas, minutos, onChangeHoras, onChangeMinutos, hint }) {
  return (
    <div className="calc-field">
      <label className="calc-label">{label}</label>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <span className="calc-hms-label">Horas</span>
          <input type="number" min="0" className="calc-input" value={horas} onChange={e => onChangeHoras(e.target.value)} placeholder="0" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <span className="calc-hms-label">Minutos</span>
          <input type="number" min="0" max="59" className="calc-input" value={minutos} onChange={e => onChangeMinutos(e.target.value)} placeholder="0" />
        </div>
      </div>
      {hint && <span className="calc-hint">{hint}</span>}
    </div>
  );
}

// Camadas a partir da altura (arredonda para cima, sem erro de ponto flutuante: 120,5 / 0,05 = 2410).
function camadasPorAltura(altura, camada) {
  const a = parseFloat(altura), c = parseFloat(camada);
  if (!(a > 0) || !(c > 0)) return 0;
  return Math.ceil(a / c - 1e-6);
}

function hmParaMinutos(h, m) {
  return (parseFloat(h) || 0) * 60 + (parseFloat(m) || 0);
}

export default function CalculadoraTempo({ onAbrirCompensacao }) {
  const [aba, setAba] = useState("camadas");

  const [modoCamadas, setModoCamadas] = useState("numero");
  const [totalCamadas, setTotalCamadas] = useState("");
  const [alturaTotalMm, setAlturaTotalMm] = useState("");
  const [alturaCamadaMm, setAlturaCamadaMm] = useState("0.05");
  const [camadasBase, setCamadasBase] = useState("6");
  const [camadasTransicao, setCamadasTransicao] = useState("6");
  const [erro, setErro] = useState("");
  const [expBase, setExpBase] = useState("");
  const [expNormal, setExpNormal] = useState("");
  const [lightOffDelay, setLightOffDelay] = useState("0");
  const [restTime, setRestTime] = useState("0");
  const [liftTime, setLiftTime] = useState("3");
  const [resultado, setResultado] = useState(null);

  const [tiH, setTiH] = useState(""); const [tiM, setTiM] = useState("");
  const [camadas, setCamadas] = useState("");
  const [restAtual, setRestAtual] = useState("");
  const [restNovo, setRestNovo] = useState("");

  function calcCamadas() {
    setErro("");
    const tot = modoCamadas === "numero" ? parseInt(totalCamadas) : camadasPorAltura(alturaTotalMm, alturaCamadaMm);
    const base = Math.max(0, parseInt(camadasBase) || 0);
    const trans = Math.max(0, parseInt(camadasTransicao) || 0);
    const eb = parseFloat(expBase);
    const en = parseFloat(expNormal);
    const lod = parseFloat(lightOffDelay) || 0;
    const rt = parseFloat(restTime) || 0;
    const lt = parseFloat(liftTime) || 0;
    if (!tot || tot <= 0) { setResultado(null); setErro(modoCamadas === "numero" ? "Informe o total de camadas." : "Informe a altura do modelo e a altura de camada."); return; }
    if (!(eb > 0) || !(en > 0)) { setResultado(null); setErro("Informe a exposição de base e a exposição normal (em segundos)."); return; }
    if (base + trans >= tot) { setResultado(null); setErro("A soma de camadas de base e de transição precisa ser menor que o total de camadas."); return; }

    // Transicao linear (Chitubox/Lychee): a exposicao desce da base ate a normal,
    // entao em media cada camada de transicao fica com (base + normal) / 2.
    const expTransicaoMedia = (eb + en) / 2;
    const normais = tot - base - trans;
    const porCamada = (exp) => exp + lod + rt + lt;
    const tBase = base * porCamada(eb);
    const tTrans = trans * porCamada(expTransicaoMedia);
    const tNormal = normais * porCamada(en);
    const tTotal = tBase + tTrans + tNormal;
    const tSemRest = base * (eb + lt) + trans * (expTransicaoMedia + lt) + normais * (en + lt);

    setResultado({
      tipo: "camadas",
      totalCamadas: tot,
      totalMin: tTotal / 60,
      semRestMin: tSemRest / 60,
      extras: (tTotal - tSemRest) / 60,
      tBase: tBase / 60,
      tTrans: tTrans / 60,
      tNormal: tNormal / 60,
    });
  }

  function calcRest() {
    const ti = hmParaMinutos(tiH, tiM);
    const cam = parseInt(camadas);
    const ra = parseFloat(restAtual) || 0;
    const rn = parseFloat(restNovo) || 0;
    if (!ti || !cam) { setResultado(null); setErro("Informe o tempo atual de impressão e o total de camadas."); return; }
    setErro("");

    const diffPorCamada = (rn - ra);
    const diffTotal = (diffPorCamada * cam) / 60;
    const novoTempo = ti + diffTotal;

    setResultado({
      tipo: "rest",
      tempoOriginal: ti,
      novoTempo,
      diferenca: diffTotal,
      porCamada: diffPorCamada,
    });
  }

  const abas = [
    { id: "camadas", label: "Por Camadas", icon: Layers },
    { id: "rest", label: "Rest/Wait Time", icon: Pause },
  ];

  return (
    <section className="calc-section">
      <div className="calc-header">
        <span className="calc-badge"><Timer size={12} /> Planejamento de produção</span>
        <h2 className="calc-title">Calculadora de Tempo de Impressão</h2>
        <p className="calc-subtitle">Estime o tempo total a partir dos seus parâmetros do fatiador e simule o impacto de mudar os tempos de descanso entre camadas.</p>
      </div>

      <div className="q-alert q-alert--info" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <span><Wrench size={14} style={{ verticalAlign: "-2px", marginRight: "6px" }} />Quer calibrar a compensação de tempo por camada do Chitubox/Lychee?</span>
        {onAbrirCompensacao
          ? <button type="button" className="home-text-link" onClick={onAbrirCompensacao}>Usar a calculadora dedicada <ArrowRight size={13} /></button>
          : <span style={{ fontWeight: 700 }}>Use a calculadora "Compensação Chitubox/Lychee"</span>}
      </div>

      <div className="calc-tabs">
        {abas.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.id} type="button" className={"calc-tab" + (aba === a.id ? " is-active" : "")}
              onClick={() => { setAba(a.id); setResultado(null); setErro(""); }}>
              <Icon size={14} /> {a.label}
            </button>
          );
        })}
      </div>

      {aba === "camadas" && (
        <div>
          <div className="q-alert q-alert--info">
            Copie os valores do perfil de impressão do seu fatiador (Chitubox, Lychee...). A conta inclui camadas de base, de transição, normais, Light-off delay, Rest Time e o tempo de subida e descida da plataforma.
          </div>

          <div className="calc-form-card" style={{ marginTop: "14px" }}>
            <p className="calc-mini-title">Como informar o tamanho da peça?</p>
            <div className="calc-toggle-row">
              <button type="button" className={"calc-toggle-btn" + (modoCamadas === "numero" ? " is-active" : "")} onClick={() => setModoCamadas("numero")}>
                Número de camadas
              </button>
              <button type="button" className={"calc-toggle-btn" + (modoCamadas === "altura" ? " is-active" : "")} onClick={() => setModoCamadas("altura")}>
                Altura do modelo (mm)
              </button>
            </div>
            {modoCamadas === "altura" && (
              <p className="calc-hint" style={{ marginBottom: "10px" }}>
                Use essa opção se seu fatiador (ex: Elegoo Saturn 4 Ultra) mostra a altura total em mm em vez do número de camadas — a gente calcula pra você.
              </p>
            )}

            {modoCamadas === "numero" ? (
              <div className="calc-field">
                <label className="calc-label">Total de camadas</label>
                <input type="number" min="1" className="calc-input" value={totalCamadas} onChange={e => setTotalCamadas(e.target.value)} placeholder="Ex: 800" />
              </div>
            ) : (
              <div className="calc-grid-2">
                <div className="calc-field">
                  <label className="calc-label">Altura total do modelo (mm)</label>
                  <input type="number" min="0" step="0.01" className="calc-input" value={alturaTotalMm} onChange={e => setAlturaTotalMm(e.target.value)} placeholder="Ex: 120.5" />
                </div>
                <div className="calc-field">
                  <label className="calc-label">Altura de camada (mm)</label>
                  <input type="number" min="0" step="0.001" className="calc-input" value={alturaCamadaMm} onChange={e => setAlturaCamadaMm(e.target.value)} placeholder="Ex: 0.05" />
                </div>
                {alturaTotalMm && alturaCamadaMm && parseFloat(alturaCamadaMm) > 0 && (
                  <div style={{ gridColumn: "1/-1", padding: "8px 12px", borderRadius: "var(--r-sm)", background: "rgba(47,123,255,0.08)", fontSize: "0.82rem", color: "var(--primary)" }}>
                    Camadas calculadas: <strong>{camadasPorAltura(alturaTotalMm, alturaCamadaMm)}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="calc-form-card">
            <p className="calc-mini-title">Parâmetros do fatiador</p>
            <div className="calc-grid-3">
              <div className="calc-field">
                <label className="calc-label">Camadas base</label>
                <input type="number" min="1" className="calc-input" value={camadasBase} onChange={e => setCamadasBase(e.target.value)} placeholder="Ex: 6" />
              </div>
              <div className="calc-field">
                <label className="calc-label">Camadas de transição</label>
                <input type="number" min="0" className="calc-input" value={camadasTransicao} onChange={e => setCamadasTransicao(e.target.value)} placeholder="Ex: 6" />
                <span className="calc-hint">Regra Quanton3D: mesmo número das camadas de base. Use 0 se não usa transição.</span>
              </div>
              <div className="calc-field">
                <label className="calc-label">Exposição base (s)</label>
                <input type="number" min="0" step="0.1" className="calc-input" value={expBase} onChange={e => setExpBase(e.target.value)} placeholder="Ex: 35" />
              </div>
              <div className="calc-field">
                <label className="calc-label">Exposição normal (s)</label>
                <input type="number" min="0" step="0.1" className="calc-input" value={expNormal} onChange={e => setExpNormal(e.target.value)} placeholder="Ex: 2.1" />
              </div>
              <div className="calc-field">
                <label className="calc-label">Light-off delay (s)</label>
                <input type="number" min="0" step="0.1" className="calc-input" value={lightOffDelay} onChange={e => setLightOffDelay(e.target.value)} placeholder="Ex: 0.5" />
              </div>
              <div className="calc-field">
                <label className="calc-label">Rest Time (s)</label>
                <input type="number" min="0" step="0.1" className="calc-input" value={restTime} onChange={e => setRestTime(e.target.value)} placeholder="Ex: 2" />
              </div>
              <div className="calc-field">
                <label className="calc-label">Tempo de elevação (s)</label>
                <input type="number" min="0" step="0.1" className="calc-input" value={liftTime} onChange={e => setLiftTime(e.target.value)} placeholder="Ex: 3" />
                <span className="calc-hint">Tempo que a plataforma leva para subir e voltar em cada camada (cronometre uma camada na máquina se não souber)</span>
              </div>
            </div>
            <button type="button" className="q-btn q-btn--primary q-btn--block" style={{ marginTop: "4px" }} onClick={calcCamadas}>Calcular tempo total</button>
            {erro && aba === "camadas" && <div className="q-alert q-alert--error" style={{ marginTop: "10px", marginBottom: 0 }}>{erro}</div>}
          </div>

          {resultado?.tipo === "camadas" && (
            <div className="calc-result-panel">
              <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--text-primary)", fontSize: "0.88rem" }}>
                Tempo estimado de impressão <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({resultado.totalCamadas} camadas)</span>
              </p>
              <div className="calc-metrics-grid">
                <ResultCard cor="var(--primary)" label="Tempo total" value={fmtTempo(resultado.totalMin)} />
                <ResultCard cor="var(--q-verde)" label="Sem rest/delay" value={fmtTempo(resultado.semRestMin)} />
                <ResultCard cor="var(--q-laranja)" label="Tempo em delays" value={fmtTempo(resultado.extras)} />
                <ResultCard cor="var(--q-ametista)" label="Camadas base" value={fmtTempo(resultado.tBase)} />
                {resultado.tTrans > 0 && <ResultCard cor="var(--q-ciano)" label="Camadas de transição" value={fmtTempo(resultado.tTrans)} />}
                <ResultCard cor="var(--q-vermelho)" label="Camadas normais" value={fmtTempo(resultado.tNormal)} />
              </div>
              {resultado.extras > 30 && (
                <div className="q-alert q-alert--warning" style={{ marginTop: "12px", marginBottom: 0, display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span>As pausas (Rest/Light-off) somam <strong>{fmtTempo(resultado.extras)}</strong>. Dá para reduzir o Rest Time, mas faça isso aos poucos e confira a peça: pausa curta demais pode causar falha em peças grandes ou resina mais grossa.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {aba === "rest" && (
        <div>
          <div className="q-alert q-alert--info">
            <strong>O que é Rest/Wait Time?</strong> É o tempo de descanso entre camadas para a resina estabilizar antes da próxima exposição. Se a impressora tem delays programados no painel dela diferentes do Chitubox, o tempo real será maior que o estimado.
          </div>
          <div className="calc-form-card" style={{ marginTop: "14px" }}>
            <p className="calc-mini-title">Simulação de mudança de Rest Time</p>
            <div className="calc-grid-2">
              <HMInput label="Tempo atual de impressão" horas={tiH} minutos={tiM} onChangeHoras={setTiH} onChangeMinutos={setTiM} />
              <div className="calc-field">
                <label className="calc-label">Total de camadas</label>
                <input type="number" min="1" className="calc-input" value={camadas} onChange={e => setCamadas(e.target.value)} placeholder="Ex: 800" />
              </div>
              <div className="calc-field">
                <label className="calc-label">Rest Time atual (s)</label>
                <input type="number" min="0" step="0.1" className="calc-input" value={restAtual} onChange={e => setRestAtual(e.target.value)} placeholder="Ex: 2" />
              </div>
              <div className="calc-field">
                <label className="calc-label">Rest Time novo desejado (s)</label>
                <input type="number" min="0" step="0.1" className="calc-input" value={restNovo} onChange={e => setRestNovo(e.target.value)} placeholder="Ex: 0.5" />
              </div>
            </div>
            <button type="button" className="q-btn q-btn--primary q-btn--block" style={{ marginTop: "4px" }} onClick={calcRest}>Simular novo tempo</button>
            {erro && aba === "rest" && <div className="q-alert q-alert--error" style={{ marginTop: "10px", marginBottom: 0 }}>{erro}</div>}
          </div>

          {resultado?.tipo === "rest" && (
            <div className="calc-result-panel">
              <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--text-primary)", fontSize: "0.88rem" }}>Impacto da mudança no Rest Time</p>
              <div className="calc-metrics-grid">
                <ResultCard cor="var(--text-secondary)" label="Tempo original" value={fmtTempo(resultado.tempoOriginal)} />
                <ResultCard cor={resultado.novoTempo < resultado.tempoOriginal ? "var(--q-verde)" : "var(--q-vermelho)"} label="Novo tempo estimado" value={fmtTempo(resultado.novoTempo)} />
                <ResultCard cor={resultado.diferenca < 0 ? "var(--q-verde)" : "var(--q-vermelho)"} label="Economia / Adição" value={`${resultado.diferenca < 0 ? "-" : "+"}${fmtTempo(Math.abs(resultado.diferenca))}`} />
              </div>
              <div className="q-alert q-alert--info" style={{ marginTop: "12px", marginBottom: 0, display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <Info size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>Cada camada terá <strong>{resultado.porCamada > 0 ? "+" : ""}{resultado.porCamada}s</strong> de diferença por camada. {resultado.diferenca < 0 ? "Reduziu o tempo — ótimo para produção em lote!" : "Aumentou o tempo — útil para resinas que precisam estabilizar mais."}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
