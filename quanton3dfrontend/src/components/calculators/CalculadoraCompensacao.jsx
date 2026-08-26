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

    setResultado({ compensacao, diferenca, fator, prevSeg, realSeg, cam, tempoMedioPorCamada });
  }

  function limpar() {
    setTempoPrevisto(["", "", ""]);
    setTempoReal(["", "", ""]);
    setCamadas("");
    setAlturaTotalMm("");
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
            ? "Os campos abaixo seguem exatamente o modal \"Configuração de compensação\" do Chitubox."
            : "Preencha os mesmos dados abaixo — no final, você verá o valor certo para colar no Lychee (Print Time Override)."}
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

      {erro && <div className="q-alert q-alert--error" style={{ marginTop: "12px" }}>{erro}</div>}

      <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
        <button type="button" className="q-btn q-btn--primary" style={{ flex: 1 }} onClick={calcular}>Aplicar</button>
        <button type="button" className="q-btn q-btn--ghost" onClick={limpar}>Cancelar</button>
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
              <GuideStep n={1}>Abra o Chitubox e clique em <strong>Configurações</strong> (ícone de engrenagem) da sua impressora</GuideStep>
              <GuideStep n={2}>Clique na aba <strong>Configurações de Resina</strong> (o perfil da resina que você usa)</GuideStep>
              <GuideStep n={3}>Procure a aba <strong>Avançado</strong> no topo da janela</GuideStep>
              <GuideStep n={4}>Ative o interruptor <strong>"Compensação de tempo de impressão"</strong></GuideStep>
              <GuideStep n={5}>Vai aparecer um campo chamado <strong>"Compensação de tempo de impressão da camada"</strong> — cole exatamente <strong style={{ color: "var(--primary)" }}>{resultado.compensacao.toFixed(2)}</strong> ali (em segundos)</GuideStep>
              <GuideStep n={6}>Clique em <strong>Salvar</strong>. Pronto — a partir da próxima impressão, o tempo estimado vai bater bem mais perto do real</GuideStep>
              <div className="calc-tip" style={{ marginTop: "4px", background: "rgba(220,145,60,0.07)", borderColor: "rgba(220,145,60,0.22)" }}>
                <Lightbulb size={15} />
                <span>Se o número for negativo (ex: -1.50), o Chitubox aceita normalmente — significa que a impressora está mais rápida do que o previsto.</span>
              </div>
            </div>
          )}

          {fatiadorGuia === "lychee" && (
            <div className="calc-guide-card" style={{ marginTop: "16px", marginBottom: 0 }}>
              <p className="calc-guide-card-title" style={{ color: "var(--q-verde)" }}>
                <MapPin size={15} /> No Lychee o processo é diferente — chama-se "Print Time Override"
              </p>
              <p className="calc-step-text" style={{ marginBottom: "14px" }}>
                Em vez de comparar tempo estimado × real como no Chitubox, o Lychee pede o <strong>tempo médio de UMA camada completa</strong> (subida + cura + descida). Com os dados que você já colocou aqui, esse valor é:
              </p>

              <div style={{ background: "rgba(23,201,130,0.08)", borderRadius: "var(--r-sm)", padding: "14px", textAlign: "center", marginBottom: "14px" }}>
                <span className="calc-metric-label">Tempo médio por camada (use esse valor)</span>
                <strong style={{ fontSize: "1.6rem", color: "var(--q-verde)" }}>{resultado.tempoMedioPorCamada.toFixed(2)}s</strong>
              </div>

              <GuideStep n={1}>No Lychee, abra o perfil da sua resina em <strong>Configurações de Resina</strong></GuideStep>
              <GuideStep n={2}>Procure a opção <strong>"Print Time Override"</strong> (Substituir tempo de impressão)</GuideStep>
              <GuideStep n={3}>Ative essa opção e no campo <strong>"Time per layer"</strong> (tempo por camada) insira <strong style={{ color: "var(--q-verde)" }}>{resultado.tempoMedioPorCamada.toFixed(2)}</strong> segundos</GuideStep>
              <GuideStep n={4}>Salve o perfil. O Lychee vai passar a mostrar o tempo total baseado nesse valor real por camada</GuideStep>

              <div className="calc-tip" style={{ marginTop: "4px", background: "rgba(220,145,60,0.07)", borderColor: "rgba(220,145,60,0.22)" }}>
                <Lightbulb size={15} />
                <span><strong>Dica do próprio Lychee:</strong> pra um valor ainda mais preciso, cronometre com um relógio o tempo de UMA camada normal (do início da descida até o início da próxima) e ajuste esse número se notar diferença nas próximas impressões.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
