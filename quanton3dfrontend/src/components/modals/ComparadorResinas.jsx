import { useState } from "react";
import { X, Check, ShoppingCart, Scale } from "lucide-react";

// Dados estruturados para comparação — propriedades-chave de cada resina
const RESINAS_COMP = [
  {
    nome: "PyroBlast",      cat: "Uso Geral",
    shoreD: 73,             densidade: "1,296 g/cm³",
    odor: "Médio",          lavagem: "Álcool IPA",
    flexibilidade: "Rígida",
    aplicacoes: ["Decorativo", "Protótipos", "Arte", "Iniciantes"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-pyroblast/",
    img: "/images/resinas/pyroblast.webp",
  },
  {
    nome: "Iron",           cat: "Engenharia",
    shoreD: 55,             densidade: "1,09 g/cm³",
    odor: "Baixo",          lavagem: "Álcool IPA",
    flexibilidade: "Semi-flexível (50% elongação)",
    aplicacoes: ["Peças técnicas", "Encaixes", "Impacto real"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-iron/",
    img: "/images/resinas/iron.webp",
  },
  {
    nome: "Poseidon",       cat: "Uso Geral",
    shoreD: 64,             densidade: "1,10 g/cm³",
    odor: "Baixo",          lavagem: "Água (sem álcool)",
    flexibilidade: "Rígida com leve flex",
    aplicacoes: ["Protótipos", "Miniaturas", "Peças funcionais"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-poseidon/",
    img: "/images/resinas/poseidon.webp",
  },
  {
    nome: "Flexform",       cat: "Engenharia",
    shoreD: null,           densidade: "—",
    odor: "Médio",          lavagem: "Álcool IPA",
    flexibilidade: "Ultra-flexível",
    aplicacoes: ["Juntas", "Vedações", "Peças industriais", "Simulação de borracha"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-flexform/",
    img: "/images/resinas/flexform.webp",
  },
  {
    nome: "Spin",           cat: "Action Figures",
    shoreD: 73,             densidade: "1,39 g/cm³",
    odor: "Médio",          lavagem: "Álcool IPA",
    flexibilidade: "Rígida com leve flex",
    aplicacoes: ["Action figures", "Grande formato", "Encaixes firmes"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-spin/",
    img: "/images/resinas/spin.webp",
  },
  {
    nome: "Athom Dental",   cat: "Odontologia",
    shoreD: null,           densidade: "—",
    odor: "Baixo",          lavagem: "Álcool IPA",
    flexibilidade: "Rígida — alta precisão",
    aplicacoes: ["Modelos de estudo", "Troquéis", "Protótipos dentários"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-athom-dental/",
    img: "/images/resinas/athom-dental.webp",
  },
  {
    nome: "Athom Alinhadores", cat: "Odontologia",
    shoreD: null,           densidade: "—",
    odor: "Baixo",          lavagem: "Álcool IPA",
    flexibilidade: "Rígida — resistência térmica",
    aplicacoes: ["Alinhadores", "Contenções", "Placas de bruxismo"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-athom-alinhadores/",
    img: "/images/resinas/athom-alinhadores.webp",
  },
  {
    nome: "Athom Washable", cat: "Odontologia",
    shoreD: null,           densidade: "—",
    odor: "Muito baixo",    lavagem: "Água (sem álcool)",
    flexibilidade: "Rígida com leve flex",
    aplicacoes: ["Modelos odontológicos", "Alta precisão", "Sem álcool"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-athom-washable1/",
    img: "/images/resinas/athom-washable.webp",
  },
  {
    nome: "Spark",          cat: "Action Figures",
    shoreD: null,           densidade: "—",
    odor: "Médio",          lavagem: "Álcool IPA",
    flexibilidade: "Rígida — acabamento cristalino",
    aplicacoes: ["Peças coloridas", "Colecionáveis", "Decoração"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-spark/",
    img: "/images/resinas/spark.webp",
  },
  {
    nome: "70/30",          cat: "Engenharia",
    shoreD: null,           densidade: "—",
    odor: "Médio",          lavagem: "Álcool IPA",
    flexibilidade: "70% rígida + 30% flex",
    aplicacoes: ["Equilíbrio mecânico", "Peças técnicas", "Uso geral"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-70-30/",
    img: "/images/resinas/70-30.webp",
  },
  {
    nome: "Lowsmell",       cat: "Uso Geral",
    shoreD: null,           densidade: "—",
    odor: "Muito baixo",    lavagem: "Álcool IPA",
    flexibilidade: "Rígida",
    aplicacoes: ["Baixo odor", "Decorativo", "Protótipos"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-low-smell/",
    img: "/images/resinas/lowsmell.webp",
  },
  {
    nome: "Alchemist",      cat: "Action Figures",
    shoreD: null,           densidade: "—",
    odor: "Médio",          lavagem: "Álcool IPA",
    flexibilidade: "Rígida — translúcida colorida",
    aplicacoes: ["Efeitos especiais", "Colecionáveis", "Decoração"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-alchemist/",
    img: "/images/resinas/alchemist.webp",
  },
  {
    nome: "Vulcan Cast",    cat: "Fundição",
    shoreD: null,           densidade: "—",
    odor: "Alto",           lavagem: "Álcool IPA",
    flexibilidade: "Rígida — queima limpa",
    aplicacoes: ["Fundição de precisão", "Joias", "Cera perdida"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-vulcan-cast-jxap7/",
    img: "/images/resinas/vulcan-cast.webp",
  },
  {
    nome: "Velvet Skin",    cat: "Uso Geral",
    shoreD: null,           densidade: "—",
    odor: "Médio",          lavagem: "Álcool IPA",
    flexibilidade: "Rígida — acabamento aveludado",
    aplicacoes: ["Produtos finais", "Protótipos premium", "Peças cosméticas"],
    url: "https://quanton3d.com.br/produtos/resina-quanton-velvet-skin1kg-11udz/",
    img: "/images/resinas/velvet-skin.webp",
  },
];

const MAX = 3;

const COR_ODOR = {
  "Muito baixo": "var(--q-verde, #22c55e)",
  "Baixo": "#4ade80",
  "Médio": "var(--warning, #f59e0b)",
  "Alto": "var(--danger, #ef4444)",
};

function OdorChip({ nivel }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "99px",
      fontSize: "0.78rem", fontWeight: 600,
      background: (COR_ODOR[nivel] || "#888") + "22",
      color: COR_ODOR[nivel] || "#888",
      border: "1px solid " + (COR_ODOR[nivel] || "#888") + "44",
    }}>{nivel}</span>
  );
}

export default function ComparadorResinas({ onClose }) {
  const [selecionadas, setSelecionadas] = useState([]);
  const [fase, setFase] = useState("selecao");

  function toggle(nome) {
    setSelecionadas((prev) => {
      if (prev.includes(nome)) return prev.filter((n) => n !== nome);
      if (prev.length >= MAX) return prev;
      return [...prev, nome];
    });
  }

  function comparar() {
    if (selecionadas.length >= 2) setFase("comparacao");
  }

  const cols = RESINAS_COMP.filter((r) => selecionadas.includes(r.nome));

  return (
    <div
      className="q-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="q-modal q-modal--wide"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "900px", display: "flex", flexDirection: "column", gap: 0, padding: 0 }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Scale size={18} style={{ color: "var(--primary)" }} />
            <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Comparador de Resinas</h2>
            {fase === "selecao" && (
              <span style={{
                fontSize: "0.75rem", color: "var(--text-muted)",
                background: "var(--surface-up)", border: "1px solid var(--border)",
                padding: "2px 8px", borderRadius: "99px",
              }}>
                {selecionadas.length}/{MAX} selecionadas
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {fase === "comparacao" && (
              <button
                type="button"
                className="q-btn q-btn--ghost q-btn--sm"
                onClick={() => setFase("selecao")}
              >
                ← Alterar seleção
              </button>
            )}
            <button type="button" className="q-modal-close" onClick={onClose} style={{ position: "static" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {fase === "selecao" && (
            <>
              <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Escolha 2 ou 3 resinas para comparar lado a lado.
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
                gap: "10px",
                marginBottom: "20px",
              }}>
                {RESINAS_COMP.map((r) => {
                  const sel = selecionadas.includes(r.nome);
                  const bloqueada = !sel && selecionadas.length >= MAX;
                  return (
                    <button
                      key={r.nome}
                      type="button"
                      disabled={bloqueada}
                      onClick={() => toggle(r.nome)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: "8px", padding: "12px 8px",
                        borderRadius: "var(--r, 8px)",
                        border: sel ? "2px solid var(--primary)" : "1px solid var(--border)",
                        background: sel ? "var(--primary-dim, rgba(59,130,246,0.12))" : "var(--surface-up)",
                        cursor: bloqueada ? "not-allowed" : "pointer",
                        opacity: bloqueada ? 0.4 : 1,
                        transition: "all 0.15s",
                        position: "relative",
                      }}
                    >
                      {sel && (
                        <span style={{
                          position: "absolute", top: "6px", right: "6px",
                          background: "var(--primary)", color: "#fff",
                          borderRadius: "50%", width: "18px", height: "18px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Check size={11} />
                        </span>
                      )}
                      <img
                        src={r.img} alt={r.nome} loading="lazy"
                        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
                      />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", textAlign: "center" }}>
                        {r.nome}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.cat}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="q-btn q-btn--ghost" onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="q-btn q-btn--primary"
                  disabled={selecionadas.length < 2}
                  onClick={comparar}
                >
                  <Scale size={14} /> Comparar {selecionadas.length >= 2 ? `(${selecionadas.length})` : ""}
                </button>
              </div>
            </>
          )}

          {fase === "comparacao" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%", borderCollapse: "collapse",
                fontSize: "0.88rem", minWidth: "520px",
              }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: "160px" }}></th>
                    {cols.map((r) => (
                      <th key={r.nome} style={{ ...thStyle, textAlign: "center", padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                          <img
                            src={r.img} alt={r.nome}
                            style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "8px" }}
                          />
                          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>{r.nome}</span>
                          <span style={{
                            fontSize: "0.72rem", color: "var(--primary)",
                            background: "var(--primary-dim)", padding: "2px 8px",
                            borderRadius: "99px",
                          }}>{r.cat}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TrComp label="Rigidez (Shore D)" cols={cols}
                    render={(r) => r.shoreD ? `Shore D ${r.shoreD}` : "—"} />
                  <TrComp label="Flexibilidade" cols={cols}
                    render={(r) => r.flexibilidade} />
                  <TrComp label="Odor" cols={cols}
                    render={(r) => <OdorChip nivel={r.odor} />} />
                  <TrComp label="Lavagem" cols={cols}
                    render={(r) => (
                      <span style={{ color: r.lavagem.includes("Água") ? "#22c55e" : "var(--text-muted)" }}>
                        {r.lavagem}
                      </span>
                    )} />
                  <TrComp label="Densidade" cols={cols}
                    render={(r) => r.densidade} />
                  <TrComp label="Aplicações" cols={cols}
                    render={(r) => (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                        {r.aplicacoes.map((a) => (
                          <span key={a} style={{
                            fontSize: "0.72rem", padding: "2px 7px", borderRadius: "99px",
                            background: "var(--surface-up)", border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                          }}>{a}</span>
                        ))}
                      </div>
                    )} />
                  <TrComp label="Ver na loja" cols={cols}
                    render={(r) => (
                      <a href={r.url} target="_blank" rel="noreferrer"
                        className="q-btn q-btn--primary q-btn--sm"
                        style={{ display: "inline-flex", textDecoration: "none", fontSize: "0.78rem" }}
                      >
                        <ShoppingCart size={12} /> Comprar
                      </a>
                    )} />
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "10px 14px",
  borderBottom: "2px solid var(--border-strong, #3D4F70)",
  textAlign: "left",
  color: "var(--text-muted)",
  fontWeight: 600,
  fontSize: "0.8rem",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

function TrComp({ label, cols, render }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{
        padding: "12px 14px",
        fontWeight: 600,
        color: "var(--text-muted)",
        fontSize: "0.82rem",
        whiteSpace: "nowrap",
      }}>
        {label}
      </td>
      {cols.map((r) => (
        <td key={r.nome} style={{
          padding: "12px 14px",
          textAlign: "center",
          color: "var(--text)",
          verticalAlign: "middle",
        }}>
          {render(r)}
        </td>
      ))}
    </tr>
  );
                        }
