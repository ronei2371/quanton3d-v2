import { useState } from "react";
import { Timer, AlertTriangle, MapPin, Lightbulb, Layers } from "lucide-react";

function toSegundos(h, m, s) {
  return (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseFloat(s) || 0);
}

function HMSInput({ label, value, onChange }) {
  return (
    <div className="calc-field" style={{ marginBottom: "16px" }}>
      <label className="calc-label">{label}</label>
      <div className="calc-hms-row">
        {["h", "m", "s"].map((unit, i) => (
          <div key={unit} className="calc-hms-group">
            <input
              type="number" min="0"
              max={unit === "h" ? undefined : 59}
              step={unit === "s" ? "0.1" : "1"}
              value={value[i]}
              onChange={e => {
                const novo = [...value];
                novo[i] = e.target.value;
                onChange(novo);
              }}
              placeholder="0"
              className="calc-input calc-hms-input"
            />
            <span className="calc-hms-label">{unit === "h" ? "horas" : unit === "m" ? "minutos" : "segundos"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideStep({ n, children }) {
  return (
    <div className="calc-step-row">
      <span className="calc-step-number">{n}</span>
      <p className="calc-step-text">{children}</p>
    </div>
  );
}

export default function CalculadoraCompensacao() {
  const [tempoPrevisto, setTempoPrevisto] = useState(["", "", ""]);
  const [tempoReal, setTempoReal] = useState(["", "", ""]);
  const [modoCamadas, setModoCamadas] = useState("numero");
  const [camadas, setCamadas] = useState("");
  const [alturaTotalMm, setAlturaTotalMm] = useState("");
  const [alturaCamadaMm, setAlturaCamadaMm] = useState("0.05");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [fatiadorGuia, setFatiadorGuia] = useState("chitubox");
  // Lychee pede o tempo da camada normal e o da camada de base separados.
  const [camadasBaseL, setCamadasBaseL] = useState("");
  const [expBaseL, setExpBaseL] = useState("");

  function calcular() {
    setErro(""); setResultado(null);

    const prevSeg = toSegundos(...tempoPrevisto);
    const realSeg = toSegundos(...tempoReal);
    const cam = modoCamadas === "numero"
      ? parseInt(camadas)
      : Math.round(parseFloat(alturaTotalMm) / parseFloat(alturaCamadaMm));

    if (prevSeg <= 0) { setErro("Tempo de previsão do software deve ser maior que zero."); return; }
    if (realSeg <= 0) { setErro("Tempo real de impressão deve ser maior que zero."); return; }
    if (!cam || cam < 1) { setErro(modoCamadas === "numero" ? "Contagem de camadas deve ser pelo menos 1." : "Informe altura total e altura de camada válidas."); return; }

    const compensacao = (realSeg - prevSeg) / cam;
    const diferenca = realSeg - prevSeg;
    const fator = realSeg / prevSeg;
    const tempoMedioPorCamada = realSeg / cam;

    // Lychee: camada de base ~ exposicao de base + 10 s (orientacao da propria Lychee);
    // o resto do tempo real dividido pelas camadas normais da o "Time per layer".
    const nBase = Math.max(0, parseInt(camadasBaseL) || 0);
    const eb = parseFloat(expBaseL) || 0;
    let tempoCamadaBaseLychee = null;
    let tempoCamadaNormalLychee = tempoMedioPorCamada;
    if (nBase > 0 && eb > 0 && nBase < cam) {
      tempoCamadaBaseLychee = eb + 10;
      const restante = realSeg - nBase * tempoCamadaBaseLychee;
      if (restante > 0) tempoCamadaNormalLychee = restante / (cam - nBase);
    }

    setResultado({ compensacao, diferenca, fator, prevSeg, realSeg, cam, tempoMedioPorCamada, tempoCamadaNormalLychee, tempoCamadaBaseLychee });
  }

  function limpar() {
    setTempoPrevisto(["", "", ""]);
    setTempoReal(["", "", ""]);
    setCamadas("");
    setAlturaTotalMm("");
    setCamadasBaseL("");
    setExpBaseL("");
    setResultado(null);
    setErro("");
  }

  function fmtHMS(seg) {
    const s = Math.abs(seg);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = (s % 60).toFixed(1);
    return `${h}h ${m}m ${sc}s`;
  }

  return (
    <section className="calc-section">
      <div className="calc-header">
        <span className="calc-badge"><Timer size={12} /> Calibração do fatiador</span>
        <h2 className="calc-title">Compensação de Tempo — Chitubox e Lychee</h2>
        <p className="calc-subtitle">Compare o tempo previsto pelo fatiador com o tempo real da impressora e descubra o valor de compensação por camada que deixa a estimativa precisa.</p>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <p className="calc-mini-title" style={{ marginBottom: "8px" }}>Qual fatiador você usa?</p>
        <div className="calc-toggle-row" style={{ marginBottom: 0 }}>
          {[
            { id: "chitubox", label: "Chitubox" },
            { id: "lychee", label: "Lychee" },
          ].map(f => (
            <button key={f.id} type="button" className={"calc-toggle-btn" + (fatiadorGuia === f.id ? " is-active" : "")} onClick={() => setFatiadorGuia(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="calc-hint" style={{ marginTop: "8px" }}>
          {fatiadorGuia === "chitubox"
            ? "O CHITUBOX usa a mesma conta: (tempo real − tempo previsto) ÷ número de camadas."
            : "No final você verá os valores para o Lychee (Print Time Override). Informe também as camadas de base, mais abaixo."}
        </p>
      </div>

      <div className="q-alert q-alert--warning" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
        <span>O tempo de previsão do software e o tempo real de impressão precisam vir dos dados registrados na <strong>mesma impressão!</strong></span>
      </div>

      <HMSInput label="1. Tempo de previsão do software" value={tempoPrevisto} onChange={setTempoPrevisto} />
      <HMSInput label="2. Tempo real de impressão" value={tempoReal} onChange={setTempoReal} />

      <div className="calc-field" style={{ marginTop: "8px" }}>
        <label className="calc-label">3. Contagem de camadas</label>

        <div className="calc-toggle-row">
          <button type="button" className={"calc-toggle-btn" + (modoCamadas === "numero" ? " is-active" : "")} onClick={() => setModoCamadas("numero")}>
            Número de camadas
          </button>
          <button type="button" className={"calc-toggle-btn" + (modoCamadas === "altura" ? " is-active" : "")} onClick={() => setModoCamadas("altura")}>
            Altura do modelo (mm)
          </button>
        </div>

        {modoCamadas === "numero" ? (
          <>
            <input type="number" min="1" step="1" className="calc-input" style={{ width: "160px" }}
              value={camadas} onChange={e => setCamadas(e.target.value)} placeholder="Ex: 850" />
            <span className="calc-hint">Total de camadas que a peça tinha (visível no Chitubox após fatiar)</span>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="number" min="0" step="0.01" className="calc-input" style={{ flex: 1 }}
                value={alturaTotalMm} onChange={e => setAlturaTotalMm(e.target.value)} placeholder="Altura total (mm)" />
              <input type="number" min="0" step="0.001" className="calc-input" style={{ flex: 1 }}
                value={alturaCamadaMm} onChange={e => setAlturaCamadaMm(e.target.value)} placeholder="Altura de camada (mm)" />
            </div>
            <span className="calc-hint">Use se seu fatiador (ex: Elegoo Saturn 4 Ultra) mostra a altura total do modelo em mm em vez do número de camadas.</span>
            {alturaTotalMm && alturaCamadaMm && parseFloat(alturaCamadaMm) > 0 && (
              <div style={{ marginTop: "6px", padding: "8px 12px", borderRadius: "var(--r-sm)", background: "rgba(47,123,255,0.08)", fontSize: "0.82rem", color: "var(--primary)" }}>
                <Layers size={13} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
                Camadas calculadas: <strong>{Math.round(parseFloat(alturaTotalMm) / parseFloat(alturaCamadaMm))}</strong>
              </div>
            )}
          </>
        )}
      </div>

      {fatiadorGuia === "lychee" && (
        <div className="calc-grid-2" style={{ marginTop: "12px" }}>
          <div className="calc-field">
            <label className="calc-label">Camadas de base (opcional)</label>
            <input type="number" min="0" step="1" className="calc-input" value={camadasBaseL} onChange={e => setCamadasBaseL(e.target.value)} placeholder="Ex: 6" />
          </div>
          <div className="calc-field">
            <label className="calc-label">Exposição de base em segundos (opcional)</label>
            <input type="number" min="0" step="0.1" className="calc-input" value={expBaseL} onChange={e => setExpBaseL(e.target.value)} placeholder="Ex: 35" />
          </div>
          <span className="calc-hint" style={{ gridColumn: "1 / -1" }}>Com esses dois, a conta separa o tempo das camadas de base e o valor da camada normal fica mais certo.</span>
        </div>
      )}

      {erro && <div className="q-alert q-alert--error" style={{ marginTop: "12px" }}>{erro}</div>}

      <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
        <button type="button" className="q-btn q-btn--primary" style={{ flex: 1 }} onClick={calcular}>Calcular</button>
        <button type="button" className="q-btn q-btn--ghost" onClick={limpar}>Limpar</button>
      </div>

      {resultado && (
        <div className="calc-result-panel">
          <span className="calc-metric-label" style={{ fontSize: "0.72rem" }}>4. Compensação de tempo de impressão da camada</span>
          <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)", display: "block", lineHeight: 1, marginTop: "4px" }}>
            {resultado.compensacao >= 0 ? "+" : ""}{resultado.compensacao.toFixed(2)}
          </span>
          <span className="calc-metric-unit">segundos por camada</span>

          <div className="calc-metrics-grid" style={{ marginTop: "16px" }}>
            {[
              { label: "Diferença total", valor: `${resultado.diferenca >= 0 ? "+" : ""}${fmtHMS(resultado.diferenca)}`, cor: resultado.diferenca > 0 ? "var(--q-vermelho)" : "var(--q-verde)" },
              { label: "Fator real/previsto", valor: `×${resultado.fator.toFixed(3)}`, cor: "var(--primary)" },
              { label: "Desvio %", valor: `${resultado.diferenca >= 0 ? "+" : ""}${((resultado.fator - 1) * 100).toFixed(1)}%`, cor: resultado.diferenca > 0 ? "var(--q-laranja)" : "var(--q-verde)" },
            ].map(item => (
              <div key={item.label} className="calc-metric-card" style={{ textAlign: "center" }}>
                <p className="calc-metric-label">{item.label}</p>
                <strong style={{ fontSize: "1.1rem", color: item.cor }}>{item.valor}</strong>
              </div>
            ))}
          </div>

          {fatiadorGuia === "chitubox" && (
            <div className="calc-guide-card" style={{ marginTop: "16px", marginBottom: 0 }}>
              <p className="calc-guide-card-title" style={{ color: "var(--q-ametista)" }}>
                <MapPin size={15} /> Onde colocar o valor <strong style={{ color: "var(--primary)" }}>{resultado.compensacao >= 0 ? "+" : ""}{resultado.compensacao.toFixed(2)}s</strong> no Chitubox
              </p>
              <GuideStep n={1}>No CHITUBOX, abra as <strong>configurações de impressão</strong> da sua impressora</GuideStep>
              <GuideStep n={2}>Vá na aba <strong>Avançado</strong></GuideStep>
              <GuideStep n={3}>Ative <strong>Compensação de tempo de impressão</strong> (Print Time Compensation) e escolha a entrada <strong>manual</strong></GuideStep>
              <GuideStep n={4}>No campo <strong>Compensação de tempo de impressão da camada</strong>, coloque <strong style={{ color: "var(--primary)" }}>{resultado.compensacao.toFixed(2)}</strong> (segundos)</GuideStep>
              <GuideStep n={5}>Salve. Nas próximas impressões com esse perfil, o tempo estimado fica bem mais perto do real</GuideStep>
              <div className="calc-tip" style={{ marginTop: "4px", background: "rgba(220,145,60,0.07)", borderColor: "rgba(220,145,60,0.22)" }}>
                <Lightbulb size={15} />
                <span>Número negativo (ex.: −1,50) é normal: a impressora está mais rápida que o previsto. O campo aceita de −99,99 a 99,99. Se mudar exposição ou velocidades no perfil, refaça a conta.</span>
              </div>
            </div>
          )}

          {fatiadorGuia === "lychee" && (
            <div className="calc-guide-card" style={{ marginTop: "16px", marginBottom: 0 }}>
              <p className="calc-guide-card-title" style={{ color: "var(--q-verde)" }}>
                <MapPin size={15} /> No Lychee o processo é diferente — chama-se "Print Time Override"
              </p>
              <p className="calc-step-text" style={{ marginBottom: "14px" }}>
                O Lychee pede dois tempos: o de <strong>uma camada normal completa</strong> (subida, descida, pausa e exposição) e o de <strong>uma camada de base</strong>. Com os dados que você colocou:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                <div style={{ background: "rgba(23,201,130,0.08)", borderRadius: "var(--r-sm)", padding: "14px", textAlign: "center" }}>
                  <span className="calc-metric-label">Time per layer (camada normal)</span>
                  <strong style={{ fontSize: "1.6rem", color: "var(--q-verde)" }}>{resultado.tempoCamadaNormalLychee.toFixed(2)}s</strong>
                </div>
                {resultado.tempoCamadaBaseLychee !== null && (
                  <div style={{ background: "rgba(23,201,130,0.08)", borderRadius: "var(--r-sm)", padding: "14px", textAlign: "center" }}>
                    <span className="calc-metric-label">Time per burn-in layer (base)</span>
                    <strong style={{ fontSize: "1.6rem", color: "var(--q-verde)" }}>{resultado.tempoCamadaBaseLychee.toFixed(2)}s</strong>
                  </div>
                )}
              </div>
              {resultado.tempoCamadaBaseLychee === null && (
                <p className="calc-hint" style={{ marginBottom: "12px" }}>Sem as camadas de base informadas, o valor acima é a média do job inteiro (fica um pouco alto). Para a camada de base, o Lychee sugere usar a exposição de base + 10 s.</p>
              )}

              <GuideStep n={1}>No Lychee, abra as <strong>preferências da resina</strong> (perfil que você usa)</GuideStep>
              <GuideStep n={2}>Ative <strong>Print Time Override</strong></GuideStep>
              <GuideStep n={3}>Em <strong>Time per layer</strong> coloque <strong style={{ color: "var(--q-verde)" }}>{resultado.tempoCamadaNormalLychee.toFixed(2)}</strong> s{resultado.tempoCamadaBaseLychee !== null && <> e em <strong>Time per Burn-in layer</strong> coloque <strong style={{ color: "var(--q-verde)" }}>{resultado.tempoCamadaBaseLychee.toFixed(2)}</strong> s</>}</GuideStep>
              <GuideStep n={4}>Salve. O Lychee não atualiza sozinho: se mudar exposição ou velocidades, refaça os valores</GuideStep>

              <div className="calc-tip" style={{ marginTop: "4px", background: "rgba(220,145,60,0.07)", borderColor: "rgba(220,145,60,0.22)" }}>
                <Lightbulb size={15} />
                <span><strong>Jeito mais preciso (orientação da Lychee):</strong> depois de umas 50 camadas, cronometre 10 ciclos completos (começa quando a plataforma sobe) e divida por 10. Esse é o Time per layer exato.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
