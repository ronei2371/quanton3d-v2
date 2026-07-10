import { useState } from "react";

const S = {
  wrap: { padding: "8px 4px" },
  section: { marginBottom: "18px" },
  sectionTitle: {
    display: "block", fontSize: "0.72rem", fontWeight: 900,
    color: "#4fd1ff", textTransform: "uppercase", letterSpacing: "0.08em",
    margin: "0 0 10px", padding: "6px 10px",
    background: "rgba(79,209,255,0.08)", borderRadius: "8px",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" },
  field: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "0.78rem", fontWeight: 700, color: "#9fb4c7" },
  input: {
    padding: "9px 11px", borderRadius: "9px",
    border: "1px solid rgba(79,209,255,0.22)",
    background: "rgba(4,10,24,0.7)", color: "#ffffff", fontSize: "0.88rem",
    outline: "none", fontFamily: "inherit",
  },
  hint: { fontSize: "0.72rem", color: "#8ba3be", marginTop: "3px" },
  hmRow: { display: "flex", gap: "8px", alignItems: "flex-end" },
  hmGroup: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  hmLabel: { fontSize: "0.68rem", color: "#8ba3be", fontWeight: 700 },
  resultBox: {
    background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.25)",
    borderRadius: "14px", padding: "16px", marginTop: "6px",
  },
  resultGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginTop: "12px" },
  resultCard: (cor) => ({
    background: `${cor}11`, border: `1px solid ${cor}33`,
    borderRadius: "10px", padding: "12px", textAlign: "center",
  }),
  resultLabel: { fontSize: "0.72rem", color: "#9fb4c7", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" },
  resultValue: (cor) => ({ fontSize: "1.4rem", fontWeight: 800, color: cor, display: "block" }),
  btn: {
    width: "100%", padding: "12px", borderRadius: "10px", border: 0,
    background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff",
    fontWeight: 900, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit",
    marginTop: "14px", boxShadow: "0 6px 20px rgba(37,99,235,0.3)",
  },
  infoBox: {
    padding: "12px 14px", borderRadius: "10px",
    background: "rgba(127,90,240,0.08)", border: "1px solid rgba(127,90,240,0.2)",
    color: "#b89cff", fontSize: "0.82rem", lineHeight: 1.6, marginTop: "14px",
  },
  warnBox: {
    padding: "10px 14px", borderRadius: "10px",
    background: "rgba(255,166,0,0.08)", border: "1px solid rgba(255,166,0,0.25)",
    color: "#ffd166", fontSize: "0.82rem", lineHeight: 1.6, marginTop: "10px",
  },
  toggleRow: { display: "flex", gap: "8px", marginBottom: "12px" },
  toggleBtn: (ativo) => ({
    flex: 1, padding: "9px", borderRadius: "9px", cursor: "pointer", fontFamily: "inherit",
    fontSize: "0.78rem", fontWeight: 800, border: "1px solid rgba(79,209,255,0.25)",
    background: ativo ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(79,209,255,0.05)",
    color: ativo ? "#fff" : "#9fb4c7",
  }),
};

function fmtTempo(minutos) {
  if (!minutos || minutos <= 0) return "0 min";
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Campo de tempo em horas + minutos
function HMInput({ label, horas, minutos, onChangeHoras, onChangeMinutos, hint }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <div style={S.hmRow}>
        <div style={S.hmGroup}>
          <span style={S.hmLabel}>Horas</span>
          <input type="number" min="0" value={horas} onChange={e => onChangeHoras(e.target.value)} placeholder="0" style={S.input} />
        </div>
        <div style={S.hmGroup}>
          <span style={S.hmLabel}>Minutos</span>
          <input type="number" min="0" max="59" value={minutos} onChange={e => onChangeMinutos(e.target.value)} placeholder="0" style={S.input} />
        </div>
      </div>
      {hint && <span style={S.hint}>{hint}</span>}
    </div>
  );
}

function hmParaMinutos(h, m) {
  return (parseFloat(h) || 0) * 60 + (parseFloat(m) || 0);
}

export default function CalculadoraTempo() {
  const [aba, setAba] = useState("compensacao");

  // Aba 1 — Compensação de Tempo (h/m)
  const [estH, setEstH] = useState(""); const [estM, setEstM] = useState("");
  const [realH, setRealH] = useState(""); const [realM, setRealM] = useState("");
  const [novaH, setNovaH] = useState(""); const [novaM, setNovaM] = useState("");

  // Aba 2 — Tempo por camadas
  const [modoCamadas, setModoCamadas] = useState("numero"); // "numero" | "altura"
  const [totalCamadas, setTotalCamadas] = useState("");
  const [alturaTotalMm, setAlturaTotalMm] = useState("");
  const [alturaCamadaMm, setAlturaCamadaMm] = useState("0.05");
  const [camadasBase, setCamadasBase] = useState("6");
  const [expBase, setExpBase] = useState("");
  const [expNormal, setExpNormal] = useState("");
  const [lightOffDelay, setLightOffDelay] = useState("0");
  const [restTime, setRestTime] = useState("0");
  const [liftTime, setLiftTime] = useState("3");
  const [resultado, setResultado] = useState(null);

  // Aba 3 — Wait/Rest time (h/m)
  const [tiH, setTiH] = useState(""); const [tiM, setTiM] = useState("");
  const [camadas, setCamadas] = useState("");
  const [restAtual, setRestAtual] = useState("");
  const [restNovo, setRestNovo] = useState("");

  function calcCompensacao() {
    const est = hmParaMinutos(estH, estM);
    const real = hmParaMinutos(realH, realM);
    if (!est || !real || est <= 0 || real <= 0) return;
    const fator = real / est;
    const nova = hmParaMinutos(novaH, novaM);
    const previsaoCorrigida = nova > 0 ? nova * fator : null;
    setResultado({
      tipo: "compensacao",
      fator: fator.toFixed(3),
      diferenca: ((fator - 1) * 100).toFixed(1),
      previsaoCorrigida,
      recomendacao: fator > 1.15 ? "Aumente Light-off delay ou Rest Time" : fator < 0.90 ? "Reduza Light-off delay ou Rest Time" : "Tempos calibrados ✅",
    });
  }

  // Calcula número de camadas a partir da altura total (útil para Saturn 4 Ultra e fatiadores que mostram mm em vez de camadas)
  function camadasCalculadas() {
    if (modoCamadas === "numero") return parseInt(totalCamadas) || 0;
    const alturaTotal = parseFloat(alturaTotalMm);
    const alturaCam = parseFloat(alturaCamadaMm);
    if (!alturaTotal || !alturaCam) return 0;
    return Math.round((alturaTotal / alturaCam) * 1000) / 1000 | 0 || Math.round(alturaTotal / alturaCam);
  }

  function calcCamadas() {
    const tot = modoCamadas === "numero" ? parseInt(totalCamadas) : Math.round(parseFloat(alturaTotalMm) / parseFloat(alturaCamadaMm));
    const base = parseInt(camadasBase) || 6;
    const eb = parseFloat(expBase);
    const en = parseFloat(expNormal);
    const lod = parseFloat(lightOffDelay) || 0;
    const rt = parseFloat(restTime) || 0;
    const lt = parseFloat(liftTime) || 3;
    if (!tot || tot <= 0 || !eb || !en) return;

    const normais = tot - base;
    const tBase = base * (eb + lod + lt);
    const tNormal = normais * (en + lod + rt + lt);
    const tTotal = tBase + tNormal;
    const tSemRest = base * (eb + lt) + normais * (en + lt);

    setResultado({
      tipo: "camadas",
      totalCamadas: tot,
      totalMin: tTotal / 60,
      semRestMin: tSemRest / 60,
      extras: (tTotal - tSemRest) / 60,
      tBase: tBase / 60,
      tNormal: tNormal / 60,
    });
  }

  function calcRest() {
    const ti = hmParaMinutos(tiH, tiM);
    const cam = parseInt(camadas);
    const ra = parseFloat(restAtual) || 0;
    const rn = parseFloat(restNovo) || 0;
    if (!ti || !cam) return;

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
    { id: "compensacao", label: "⏱️ Compensação" },
    { id: "camadas", label: "📚 Por Camadas" },
    { id: "rest", label: "⏸️ Rest/Wait Time" },
  ];

  return (
    <div style={S.wrap}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", borderBottom: "1px solid rgba(79,209,255,0.15)", paddingBottom: "10px" }}>
        {abas.map(a => (
          <button key={a.id} type="button" onClick={() => { setAba(a.id); setResultado(null); }}
            style={{ padding: "8px 16px", borderRadius: "9px", border: "1px solid rgba(79,209,255,0.2)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 700, transition: "all 0.15s",
              background: aba === a.id ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(79,209,255,0.06)",
              color: aba === a.id ? "#fff" : "#9fb4c7",
              boxShadow: aba === a.id ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA 1 — Compensação de tempo (Chitubox) */}
      {aba === "compensacao" && (
        <div>
          <div style={S.infoBox}>
            <strong style={{ color: "#b89cff" }}>Como usar no Chitubox:</strong> Vá em Configurações da Impressora → Configurações de Resina → aba <strong>Avançado</strong> → ative <strong>Compensação de Tempo de Impressão</strong> → insira tempo estimado e real abaixo.
          </div>
          <div style={{ ...S.section, marginTop: "14px" }}>
            <span style={S.sectionTitle}>Tempos registrados</span>
            <div style={S.grid2}>
              <HMInput label="Tempo estimado pelo Chitubox" horas={estH} minutos={estM} onChangeHoras={setEstH} onChangeMinutos={setEstM} hint="Tempo que o fatiador mostrou antes de imprimir" />
              <HMInput label="Tempo real da impressora" horas={realH} minutos={realM} onChangeHoras={setRealH} onChangeMinutos={setRealM} hint="Tempo que a impressora realmente levou" />
            </div>
            <div style={{ marginTop: "12px" }}>
              <HMInput label="Próxima estimativa do Chitubox (opcional)" horas={novaH} minutos={novaM} onChangeHoras={setNovaH} onChangeMinutos={setNovaM} hint="Para calcular quanto tempo a próxima peça vai levar de verdade" />
            </div>
            <button type="button" onClick={calcCompensacao} style={S.btn}>Calcular compensação</button>
          </div>

          {resultado?.tipo === "compensacao" && (
            <div style={S.resultBox}>
              <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.88rem" }}>Resultado da compensação</p>
              <div style={S.resultGrid}>
                <div style={S.resultCard("#4fd1ff")}>
                  <span style={S.resultLabel}>Fator real</span>
                  <span style={S.resultValue("#4fd1ff")}>×{resultado.fator}</span>
                </div>
                <div style={S.resultCard(parseFloat(resultado.diferenca) > 0 ? "#ff8fab" : "#49e68b")}>
                  <span style={S.resultLabel}>Diferença</span>
                  <span style={S.resultValue(parseFloat(resultado.diferenca) > 0 ? "#ff8fab" : "#49e68b")}>
                    {parseFloat(resultado.diferenca) > 0 ? "+" : ""}{resultado.diferenca}%
                  </span>
                </div>
                {resultado.previsaoCorrigida && (
                  <div style={S.resultCard("#b89cff")}>
                    <span style={S.resultLabel}>Tempo real previsto</span>
                    <span style={S.resultValue("#b89cff")}>{fmtTempo(resultado.previsaoCorrigida)}</span>
                  </div>
                )}
              </div>
              <div style={{ ...S.infoBox, marginTop: "12px" }}>
                💡 <strong>Recomendação:</strong> {resultado.recomendacao}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 2 — Cálculo por camadas */}
      {aba === "camadas" && (
        <div>
          <div style={S.infoBox}>
            Calcule o tempo total de impressão baseado nos seus parâmetros do Chitubox. Inclui camadas base, normais, Light-off delay e Rest Time.
          </div>

          <div style={{ ...S.section, marginTop: "14px" }}>
            <span style={S.sectionTitle}>Como informar o tamanho da peça?</span>
            <div style={S.toggleRow}>
              <button type="button" onClick={() => setModoCamadas("numero")} style={S.toggleBtn(modoCamadas === "numero")}>
                📚 Número de camadas
              </button>
              <button type="button" onClick={() => setModoCamadas("altura")} style={S.toggleBtn(modoCamadas === "altura")}>
                📐 Altura do modelo (mm)
              </button>
            </div>
            {modoCamadas === "altura" && (
              <p style={{ ...S.hint, marginBottom: "10px" }}>
                Use essa opção se seu fatiador (ex: Elegoo Saturn 4 Ultra) mostra a altura total em mm em vez do número de camadas — a gente calcula pra você.
              </p>
            )}

            {modoCamadas === "numero" ? (
              <div style={S.field}>
                <label style={S.label}>Total de camadas</label>
                <input type="number" min="1" value={totalCamadas} onChange={e => setTotalCamadas(e.target.value)} placeholder="Ex: 800" style={S.input} />
              </div>
            ) : (
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>Altura total do modelo (mm)</label>
                  <input type="number" min="0" step="0.01" value={alturaTotalMm} onChange={e => setAlturaTotalMm(e.target.value)} placeholder="Ex: 120.5" style={S.input} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Altura de camada (mm)</label>
                  <input type="number" min="0" step="0.001" value={alturaCamadaMm} onChange={e => setAlturaCamadaMm(e.target.value)} placeholder="Ex: 0.05" style={S.input} />
                </div>
                {alturaTotalMm && alturaCamadaMm && parseFloat(alturaCamadaMm) > 0 && (
                  <div style={{ gridColumn: "1/-1", padding: "8px 12px", borderRadius: "8px", background: "rgba(79,209,255,0.08)", fontSize: "0.82rem", color: "#4fd1ff" }}>
                    📚 Camadas calculadas: <strong>{Math.round(parseFloat(alturaTotalMm) / parseFloat(alturaCamadaMm))}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={S.section}>
            <span style={S.sectionTitle}>Parâmetros do Chitubox</span>
            <div style={S.grid3}>
              <div style={S.field}>
                <label style={S.label}>Camadas base</label>
                <input type="number" min="1" value={camadasBase} onChange={e => setCamadasBase(e.target.value)} placeholder="Ex: 6" style={S.input} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Exposição base (s)</label>
                <input type="number" min="0" step="0.1" value={expBase} onChange={e => setExpBase(e.target.value)} placeholder="Ex: 35" style={S.input} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Exposição normal (s)</label>
                <input type="number" min="0" step="0.1" value={expNormal} onChange={e => setExpNormal(e.target.value)} placeholder="Ex: 2.1" style={S.input} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Light-off delay (s)</label>
                <input type="number" min="0" step="0.1" value={lightOffDelay} onChange={e => setLightOffDelay(e.target.value)} placeholder="Ex: 0.5" style={S.input} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Rest Time (s)</label>
                <input type="number" min="0" step="0.1" value={restTime} onChange={e => setRestTime(e.target.value)} placeholder="Ex: 2" style={S.input} />
              </div>
              <div style={{ ...S.field }}>
                <label style={S.label}>Tempo de elevação (s)</label>
                <input type="number" min="0" step="0.1" value={liftTime} onChange={e => setLiftTime(e.target.value)} placeholder="Ex: 3" style={S.input} />
                <span style={S.hint}>Lift + retraction combinados</span>
              </div>
            </div>
            <button type="button" onClick={calcCamadas} style={S.btn}>Calcular tempo total</button>
          </div>

          {resultado?.tipo === "camadas" && (
            <div style={S.resultBox}>
              <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.88rem" }}>
                Tempo estimado de impressão <span style={{ color: "#8ba3be", fontWeight: 400 }}>({resultado.totalCamadas} camadas)</span>
              </p>
              <div style={S.resultGrid}>
                <div style={S.resultCard("#4fd1ff")}>
                  <span style={S.resultLabel}>Tempo total</span>
                  <span style={S.resultValue("#4fd1ff")}>{fmtTempo(resultado.totalMin)}</span>
                </div>
                <div style={S.resultCard("#49e68b")}>
                  <span style={S.resultLabel}>Sem rest/delay</span>
                  <span style={S.resultValue("#49e68b")}>{fmtTempo(resultado.semRestMin)}</span>
                </div>
                <div style={S.resultCard("#ffd166")}>
                  <span style={S.resultLabel}>Tempo em delays</span>
                  <span style={S.resultValue("#ffd166")}>{fmtTempo(resultado.extras)}</span>
                </div>
                <div style={S.resultCard("#b89cff")}>
                  <span style={S.resultLabel}>Camadas base</span>
                  <span style={S.resultValue("#b89cff")}>{fmtTempo(resultado.tBase)}</span>
                </div>
                <div style={S.resultCard("#ff8fab")}>
                  <span style={S.resultLabel}>Camadas normais</span>
                  <span style={S.resultValue("#ff8fab")}>{fmtTempo(resultado.tNormal)}</span>
                </div>
              </div>
              {resultado.extras > 30 && (
                <div style={S.warnBox}>
                  ⚠️ Os delays (Rest/Light-off) representam <strong>{fmtTempo(resultado.extras)}</strong> do total. Considere reduzir o Rest Time se a resina já estiver estabilizando bem.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ABA 3 — Rest/Wait Time */}
      {aba === "rest" && (
        <div>
          <div style={S.infoBox}>
            <strong style={{ color: "#b89cff" }}>O que é Rest/Wait Time?</strong> É o tempo de descanso entre camadas para a resina estabilizar antes da próxima exposição. Se a impressora tem delays programados no painel dela diferentes do Chitubox, o tempo real será maior que o estimado.
          </div>
          <div style={{ ...S.section, marginTop: "14px" }}>
            <span style={S.sectionTitle}>Simulação de mudança de Rest Time</span>
            <div style={S.grid2}>
              <HMInput label="Tempo atual de impressão" horas={tiH} minutos={tiM} onChangeHoras={setTiH} onChangeMinutos={setTiM} />
              <div style={S.field}>
                <label style={S.label}>Total de camadas</label>
                <input type="number" min="1" value={camadas} onChange={e => setCamadas(e.target.value)} placeholder="Ex: 800" style={S.input} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Rest Time atual (s)</label>
                <input type="number" min="0" step="0.1" value={restAtual} onChange={e => setRestAtual(e.target.value)} placeholder="Ex: 2" style={S.input} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Rest Time novo desejado (s)</label>
                <input type="number" min="0" step="0.1" value={restNovo} onChange={e => setRestNovo(e.target.value)} placeholder="Ex: 0.5" style={S.input} />
              </div>
            </div>
            <button type="button" onClick={calcRest} style={S.btn}>Simular novo tempo</button>
          </div>

          {resultado?.tipo === "rest" && (
            <div style={S.resultBox}>
              <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#eaf3ff", fontSize: "0.88rem" }}>Impacto da mudança no Rest Time</p>
              <div style={S.resultGrid}>
                <div style={S.resultCard("#9fb4c7")}>
                  <span style={S.resultLabel}>Tempo original</span>
                  <span style={S.resultValue("#9fb4c7")}>{fmtTempo(resultado.tempoOriginal)}</span>
                </div>
                <div style={S.resultCard(resultado.novoTempo < resultado.tempoOriginal ? "#49e68b" : "#ff8fab")}>
                  <span style={S.resultLabel}>Novo tempo estimado</span>
                  <span style={S.resultValue(resultado.novoTempo < resultado.tempoOriginal ? "#49e68b" : "#ff8fab")}>{fmtTempo(resultado.novoTempo)}</span>
                </div>
                <div style={S.resultCard(resultado.diferenca < 0 ? "#49e68b" : "#ff8fab")}>
                  <span style={S.resultLabel}>Economia / Adição</span>
                  <span style={S.resultValue(resultado.diferenca < 0 ? "#49e68b" : "#ff8fab")}>
                    {resultado.diferenca < 0 ? "-" : "+"}{fmtTempo(Math.abs(resultado.diferenca))}
                  </span>
                </div>
              </div>
              <div style={{ ...S.infoBox, marginTop: "12px" }}>
                💡 Cada camada terá <strong>{resultado.porCamada > 0 ? "+" : ""}{resultado.porCamada}s</strong> de diferença por camada. {resultado.diferenca < 0 ? "Reduziu o tempo — ótimo para produção em lote!" : "Aumentou o tempo — útil para resinas que precisam estabilizar mais."}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
