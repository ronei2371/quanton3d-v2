import { useState } from "react";

const S = {
  wrap: { padding: "8px 4px" },
  aviso: {
    padding: "12px 14px", borderRadius: "10px", marginBottom: "18px",
    background: "rgba(255,209,102,0.1)", borderLeft: "3px solid #ffd166", border: "1px solid rgba(255,209,102,0.2)",
    color: "#eaf7ff", fontSize: "0.82rem", lineHeight: 1.6,
    display: "flex", gap: "10px", alignItems: "flex-start",
  },
  sectionTitle: {
    display: "block", fontSize: "0.72rem", fontWeight: 900,
    color: "#4fd1ff", textTransform: "uppercase", letterSpacing: "0.08em",
    margin: "0 0 12px", padding: "6px 10px",
    background: "rgba(79,209,255,0.08)", borderRadius: "8px",
  },
  label: { fontSize: "0.82rem", fontWeight: 700, color: "#b8cfe8", marginBottom: "8px", display: "block" },
  hint: { fontSize: "0.72rem", color: "#8ba3be", marginTop: "4px" },
  hmsRow: { display: "flex", gap: "8px", alignItems: "center" },
  hmsGroup: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: 1 },
  hmsLabel: { fontSize: "0.7rem", color: "#9fb4c7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" },
  hmsInput: {
    width: "100%", padding: "10px 8px", borderRadius: "9px", textAlign: "center",
    border: "1px solid rgba(79,209,255,0.22)", background: "rgba(4,10,24,0.7)",
    color: "#ffffff", fontSize: "1rem", fontWeight: 700, fontFamily: "inherit", outline: "none",
  },
  separator: { color: "#4fd1ff", fontSize: "1.2rem", fontWeight: 900, paddingTop: "18px" },
  camadasField: { display: "flex", flexDirection: "column", gap: "5px", marginTop: "16px" },
  camadasInput: {
    padding: "10px 14px", borderRadius: "9px",
    border: "1px solid rgba(79,209,255,0.22)", background: "rgba(4,10,24,0.7)",
    color: "#ffffff", fontSize: "0.95rem", fontFamily: "inherit", outline: "none",
    width: "160px",
  },
  resultBox: {
    marginTop: "20px", padding: "20px", borderRadius: "14px",
    background: "rgba(79,209,255,0.06)", border: "1px solid rgba(79,209,255,0.25)",
  },
  resultLabel: { fontSize: "0.75rem", color: "#9fb4c7", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" },
  resultValue: { fontSize: "2.2rem", fontWeight: 900, color: "#4fd1ff", display: "block", lineHeight: 1 },
  resultUnit: { fontSize: "0.85rem", color: "#8ba3be", marginTop: "4px", display: "block" },
  btns: { display: "flex", gap: "10px", marginTop: "20px" },
  btnApply: {
    flex: 1, padding: "13px", borderRadius: "10px", border: 0,
    background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff",
    fontWeight: 900, fontSize: "0.92rem", cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 6px 20px rgba(37,99,235,0.3)",
  },
  btnCancel: {
    padding: "13px 20px", borderRadius: "10px",
    border: "1px solid rgba(113,159,219,0.25)", background: "transparent",
    color: "#8ba3be", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit",
  },
  errorBox: {
    padding: "10px 14px", borderRadius: "9px", marginTop: "12px",
    background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
    color: "#ff8fab", fontSize: "0.82rem",
  },
  contextBox: {
    marginTop: "24px", padding: "14px 16px", borderRadius: "12px",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,159,219,0.12)",
  },
  contextTitle: { fontSize: "0.72rem", fontWeight: 900, color: "#9fb4c7", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", display: "block" },
  contextGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  contextItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: "7px", background: "rgba(79,209,255,0.04)", border: "1px solid rgba(79,209,255,0.08)", fontSize: "0.78rem" },
};

function toSegundos(h, m, s) {
  return (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseFloat(s) || 0);
}

function HMSInput({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={S.label}>{label}</label>
      <div style={S.hmsRow}>
        {["h", "m", "s"].map((unit, i) => (
          <div key={unit} style={S.hmsGroup}>
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
              style={S.hmsInput}
            />
            <span style={S.hmsLabel}>{unit === "h" ? "horas" : unit === "m" ? "minutos" : "segundos"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalculadoraCompensacao() {
  const [tempoPrevisto, setTempoPrevisto] = useState(["", "", ""]);
  const [tempoReal, setTempoReal] = useState(["", "", ""]);
  const [modoCamadas, setModoCamadas] = useState("numero"); // "numero" | "altura"
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

    // Fórmula exata do Chitubox
    const compensacao = (realSeg - prevSeg) / cam;
    const diferenca = realSeg - prevSeg;
    const fator = realSeg / prevSeg;
    // Tempo médio real por camada — é o valor que o Lychee pede em "Print Time Override"
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
    <div style={S.wrap}>
      {/* Aviso igual ao Chitubox */}
      <div style={S.aviso}>
        <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>⚠️</span>
        <span>O tempo de previsão do software e o tempo real de impressão precisam vir dos dados registrados na <strong>mesma impressão!</strong></span>
      </div>

      {/* Campo 1 — Tempo previsto */}
      <HMSInput
        label="1. Tempo de previsão do software"
        value={tempoPrevisto}
        onChange={setTempoPrevisto}
      />

      {/* Campo 2 — Tempo real */}
      <HMSInput
        label="2. Tempo real de impressão"
        value={tempoReal}
        onChange={setTempoReal}
      />

      {/* Campo 3 — Contagem de camadas */}
      <div style={S.camadasField}>
        <label style={S.label}>3. Contagem de camadas</label>

        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <button type="button" onClick={() => setModoCamadas("numero")}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.76rem", fontWeight: 800, border: "1px solid rgba(79,209,255,0.25)",
              background: modoCamadas === "numero" ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(79,209,255,0.05)",
              color: modoCamadas === "numero" ? "#fff" : "#9fb4c7" }}>
            📚 Número de camadas
          </button>
          <button type="button" onClick={() => setModoCamadas("altura")}
            style={{ flex: 1, padding: "8px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.76rem", fontWeight: 800, border: "1px solid rgba(79,209,255,0.25)",
              background: modoCamadas === "altura" ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(79,209,255,0.05)",
              color: modoCamadas === "altura" ? "#fff" : "#9fb4c7" }}>
            📐 Altura do modelo (mm)
          </button>
        </div>

        {modoCamadas === "numero" ? (
          <>
            <input
              type="number" min="1" step="1"
              value={camadas}
              onChange={e => setCamadas(e.target.value)}
              placeholder="Ex: 850"
              style={S.camadasInput}
            />
            <span style={S.hint}>Total de camadas que a peça tinha (visível no Chitubox após fatiar)</span>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number" min="0" step="0.01"
                  value={alturaTotalMm}
                  onChange={e => setAlturaTotalMm(e.target.value)}
                  placeholder="Altura total (mm)"
                  style={{ ...S.camadasInput, width: "100%" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="number" min="0" step="0.001"
                  value={alturaCamadaMm}
                  onChange={e => setAlturaCamadaMm(e.target.value)}
                  placeholder="Altura de camada (mm)"
                  style={{ ...S.camadasInput, width: "100%" }}
                />
              </div>
            </div>
            <span style={S.hint}>Use se seu fatiador (ex: Elegoo Saturn 4 Ultra) mostra a altura total do modelo em mm em vez do número de camadas.</span>
            {alturaTotalMm && alturaCamadaMm && parseFloat(alturaCamadaMm) > 0 && (
              <div style={{ marginTop: "6px", padding: "7px 10px", borderRadius: "8px", background: "rgba(79,209,255,0.08)", fontSize: "0.8rem", color: "#4fd1ff" }}>
                📚 Camadas calculadas: <strong>{Math.round(parseFloat(alturaTotalMm) / parseFloat(alturaCamadaMm))}</strong>
              </div>
            )}
          </>
        )}
      </div>

      {erro && <div style={S.errorBox}>⚠️ {erro}</div>}

      {/* Botões — Aplicar / Cancelar (igual Chitubox) */}
      <div style={S.btns}>
        <button type="button" onClick={calcular} style={S.btnApply}>Aplicar</button>
        <button type="button" onClick={limpar} style={S.btnCancel}>Cancelar</button>
      </div>

      {/* Campo 4 — Resultado: Compensação de tempo por camada */}
      {resultado && (
        <div style={S.resultBox}>
          <span style={S.resultLabel}>4. Compensação de tempo de impressão da camada</span>
          <span style={S.resultValue}>
            {resultado.compensacao >= 0 ? "+" : ""}{resultado.compensacao.toFixed(2)}
          </span>
          <span style={S.resultUnit}>segundos por camada</span>

          {/* Análise extra */}
          <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[
              { label: "Diferença total", valor: `${resultado.diferenca >= 0 ? "+" : ""}${fmtHMS(resultado.diferenca)}`, cor: resultado.diferenca > 0 ? "#ff8fab" : "#49e68b" },
              { label: "Fator real/previsto", valor: `×${resultado.fator.toFixed(3)}`, cor: "#4fd1ff" },
              { label: "Desvio %", valor: `${resultado.diferenca >= 0 ? "+" : ""}${((resultado.fator - 1) * 100).toFixed(1)}%`, cor: resultado.diferenca > 0 ? "#ffd166" : "#49e68b" },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
                <span style={{ fontSize: "0.7rem", color: "#9fb4c7", display: "block", marginBottom: "4px" }}>{item.label}</span>
                <strong style={{ fontSize: "1.1rem", color: item.cor }}>{item.valor}</strong>
              </div>
            ))}
          </div>

          {/* Seletor de fatiador */}
          <div style={{ display: "flex", gap: "8px", marginTop: "18px", marginBottom: "12px" }}>
            {[
              { id: "chitubox", label: "🟦 Sou usuário do Chitubox" },
              { id: "lychee", label: "🟩 Sou usuário do Lychee" },
            ].map(f => (
              <button key={f.id} type="button" onClick={() => setFatiadorGuia(f.id)}
                style={{ flex: 1, padding: "10px", borderRadius: "9px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 800, border: "1px solid rgba(79,209,255,0.25)",
                  background: fatiadorGuia === f.id ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(79,209,255,0.05)",
                  color: fatiadorGuia === f.id ? "#fff" : "#9fb4c7" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* GUIA CHITUBOX — passo a passo visual */}
          {fatiadorGuia === "chitubox" && (
            <div style={{ background: "rgba(127,90,240,0.06)", border: "1px solid rgba(127,90,240,0.2)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ margin: "0 0 14px", fontSize: "0.85rem", fontWeight: 800, color: "#b89cff" }}>
                📍 Onde colocar o valor <strong style={{ color: "#4fd1ff" }}>{resultado.compensacao >= 0 ? "+" : ""}{resultado.compensacao.toFixed(2)}s</strong> no Chitubox:
              </p>
              {[
                { n: 1, texto: <>Abra o Chitubox e clique em <strong>Configurações</strong> (ícone de engrenagem) da sua impressora</> },
                { n: 2, texto: <>Clique na aba <strong>Configurações de Resina</strong> (o perfil da resina que você usa)</> },
                { n: 3, texto: <>Procure a aba <strong>Avançado</strong> no topo da janela</> },
                { n: 4, texto: <>Ative o interruptor <strong>"Compensação de tempo de impressão"</strong></> },
                { n: 5, texto: <>Vai aparecer um campo chamado <strong>"Compensação de tempo de impressão da camada"</strong> — cole exatamente <strong style={{ color: "#4fd1ff" }}>{resultado.compensacao.toFixed(2)}</strong> ali (em segundos)</> },
                { n: 6, texto: <>Clique em <strong>Salvar</strong>. Pronto — a partir da próxima impressão, o tempo estimado vai bater bem mais perto do real</> },
              ].map(passo => (
                <div key={passo.n} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: "rgba(79,209,255,0.15)", border: "1px solid rgba(79,209,255,0.4)", color: "#4fd1ff", fontWeight: 900, fontSize: "0.78rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{passo.n}</span>
                  <p style={{ margin: "3px 0 0", color: "#d3e4f8", fontSize: "0.82rem", lineHeight: 1.6 }}>{passo.texto}</p>
                </div>
              ))}
              <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.2)", color: "#ffd166", fontSize: "0.78rem" }}>
                💡 Se o número for negativo (ex: -1.50), o Chitubox aceita normalmente — significa que a impressora está mais rápida do que o previsto.
              </div>
            </div>
          )}

          {/* GUIA LYCHEE — processo diferente, tempo por camada direto */}
          {fatiadorGuia === "lychee" && (
            <div style={{ background: "rgba(73,230,139,0.06)", border: "1px solid rgba(73,230,139,0.2)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.85rem", fontWeight: 800, color: "#49e68b" }}>
                📍 No Lychee o processo é diferente — chama-se "Print Time Override"
              </p>
              <p style={{ margin: "0 0 14px", fontSize: "0.78rem", color: "#9fb4c7", lineHeight: 1.6 }}>
                Em vez de comparar tempo estimado × real como no Chitubox, o Lychee pede o <strong>tempo médio de UMA camada completa</strong> (subida + cura + descida). Com os dados que você já colocou aqui, esse valor é:
              </p>

              <div style={{ background: "rgba(73,230,139,0.1)", borderRadius: "10px", padding: "14px", textAlign: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "0.72rem", color: "#9fb4c7", display: "block", marginBottom: "4px" }}>Tempo médio por camada (use esse valor)</span>
                <strong style={{ fontSize: "1.6rem", color: "#49e68b" }}>{resultado.tempoMedioPorCamada.toFixed(2)}s</strong>
              </div>

              {[
                { n: 1, texto: <>No Lychee, abra o perfil da sua resina em <strong>Configurações de Resina</strong></> },
                { n: 2, texto: <>Procure a opção <strong>"Print Time Override"</strong> (Substituir tempo de impressão)</> },
                { n: 3, texto: <>Ative essa opção e no campo <strong>"Time per layer"</strong> (tempo por camada) insira <strong style={{ color: "#49e68b" }}>{resultado.tempoMedioPorCamada.toFixed(2)}</strong> segundos</> },
                { n: 4, texto: <>Salve o perfil. O Lychee vai passar a mostrar o tempo total baseado nesse valor real por camada</> },
              ].map(passo => (
                <div key={passo.n} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: "rgba(73,230,139,0.15)", border: "1px solid rgba(73,230,139,0.4)", color: "#49e68b", fontWeight: 900, fontSize: "0.78rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{passo.n}</span>
                  <p style={{ margin: "3px 0 0", color: "#d3e4f8", fontSize: "0.82rem", lineHeight: 1.6 }}>{passo.texto}</p>
                </div>
              ))}

              <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,209,102,0.08)", border: "1px solid rgba(255,209,102,0.2)", color: "#ffd166", fontSize: "0.78rem", lineHeight: 1.6 }}>
                💡 <strong>Dica do próprio Lychee:</strong> pra um valor ainda mais preciso, cronometre com um relógio o tempo de UMA camada normal (do início da descida até o início da próxima) e ajuste esse número se notar diferença nas próximas impressões.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
