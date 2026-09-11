import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Beaker, BookOpen, Calculator, Layers, Home, Users, Headphones, Info, Sparkles } from "lucide-react";

// ─── Índice de busca ─────────────────────────────────────────────────────────
const SECAO_ICONS = { inicio: Home, catalogo: Beaker, parametros: Layers, calculadoras: Calculator, guias: BookOpen, academy: Sparkles, atendimento: Headphones, comunidade: Users, sobre: Info };

const SEARCH_INDEX = [
  // Seções
  { type: "Seção", label: "Início", desc: "Página principal", page: "inicio" },
  { type: "Seção", label: "Catálogo de Resinas", desc: "Todas as resinas Quanton3D com filtros por categoria", page: "catalogo" },
  { type: "Seção", label: "Parâmetros de Impressão", desc: "Parâmetros por impressora e resina", page: "parametros" },
  { type: "Seção", label: "Calculadoras", desc: "Exposição, custo, cura UV e mais", page: "calculadoras" },
  { type: "Seção", label: "Guias Técnicos", desc: "Base de conhecimento técnico", page: "guias" },
  { type: "Seção", label: "Quanton Academy", desc: "Vídeos e conteúdo educativo", page: "academy" },
  { type: "Seção", label: "Atendimento", desc: "Fale com nossa equipe", page: "atendimento" },
  { type: "Seção", label: "Comunidade", desc: "Makers, parceiros e revenda", page: "comunidade" },
  { type: "Seção", label: "Sobre Nós", desc: "Quem somos, CNPJ e missão", page: "sobre" },
  // Resinas
  { type: "Resina", label: "Standard", desc: "Uso Geral · alta definição, boa fluidez", page: "catalogo", keywords: "standard geral fluida impressao" },
  { type: "Resina", label: "Lowsmell", desc: "Uso Geral · odor reduzido, decorativos e protótipos", page: "catalogo", keywords: "lowsmell odor cheiro decorativo prototipo" },
  { type: "Resina", label: "Washable", desc: "Uso Geral · lavável em água, fácil pós-processamento", page: "catalogo", keywords: "washable agua lavavel water wash" },
  { type: "Resina", label: "ABS-Like", desc: "Engenharia · alta rigidez e resistência ao impacto", page: "catalogo", keywords: "abs like engenharia rigido impacto resistente" },
  { type: "Resina", label: "Tough", desc: "Engenharia · alta temperatura e resistência mecânica", page: "catalogo", keywords: "tough resistente mecanico temperatura alto calor" },
  { type: "Resina", label: "Flexible", desc: "Engenharia · flexível, elastômero, borrachoso", page: "catalogo", keywords: "flexible flexivel elastico borracha macio" },
  { type: "Resina", label: "Castable", desc: "Fundição · queima limpa para cera perdida", page: "catalogo", keywords: "castable fundicao cera perdida joalheria anel" },
  { type: "Resina", label: "Dental", desc: "Odontologia · biocompatível classe IIa", page: "catalogo", keywords: "dental odontologia biocompativel protese modelo dentario" },
  { type: "Resina", label: "Model Pro", desc: "Action Figures · detalhes finos, textura de pele", page: "catalogo", keywords: "model pro action figure miniatura detalhe fino skin" },
  // Guias
  { type: "Guia", label: "Nivelamento de Plataforma", desc: "Passo a passo para nivelar a plataforma corretamente", page: "guias", keywords: "nivelar plataforma papel folha fbd" },
  { type: "Guia", label: "Configuração de Fatiadores", desc: "Exposição, camada, orientação no Chitubox e Lychee", page: "guias", keywords: "fatiador chitubox lychee slicer configurar perfil" },
  { type: "Guia", label: "Calibração de Resina", desc: "Método completo para obter parâmetros por medição", page: "guias", keywords: "calibrar calibracao exposicao tempo camada matriz" },
  { type: "Guia", label: "Suportes e Posicionamento", desc: "Geometria, esforço, parâmetros e fluxo de suporte", page: "guias", keywords: "suporte overhang posicionar angulo inclinacao" },
  { type: "Guia", label: "Encaixe Odontológico", desc: "Restaurações, modelos e próteses com encaixe preciso", page: "guias", keywords: "odontologia encaixe protese restauracao margem" },
  { type: "Guia", label: "Cavidades e Efeito de Sucção", desc: "Por que peças ocas precisam de respiro e drenagem", page: "guias", keywords: "succao vácuo cavidade oco respiro drenagem" },
  { type: "Guia", label: "Contato de Suporte e Acabamento", desc: "Esférico ou direto: como escolher e remover sem marcas", page: "guias", keywords: "contato suporte esfera ponta remover marca" },
  { type: "Guia", label: "Diagnóstico de Falhas", desc: "Identifique e resolva os problemas mais comuns", page: "guias", keywords: "diagnostico falha problema erro peça nao cola" },
  { type: "Guia", label: "Bottom Curling", desc: "Por que a borda da base levanta e como corrigir", page: "guias", keywords: "bottom curling borda levanta warping aderencia peel" },
  { type: "Guia", label: "Manutenção de Impressora", desc: "FEP, eixo Z e cuidados periódicos", page: "guias", keywords: "manutencao fep eixo z limpeza troca periodicidade" },
  { type: "Guia", label: "Pós-processamento de Resina", desc: "Segurança, lavagem, cura e inspeção final", page: "guias", keywords: "pos processamento lavagem cura ipa alcool isopropilico" },
  { type: "Guia", label: "Economia de Resina", desc: "Reduza consumo sem virar fragilidade ou falha", page: "guias", keywords: "economia hollowing oco reduzir custo consumo" },
  { type: "Guia", label: "Intensidade de Luz e Precisão", desc: "Voxel, escala de cinza e compensação dimensional", page: "guias", keywords: "luz intensidade voxel escala cinza antialiasing dimensional" },
  { type: "Guia", label: "Overhangs e Ilhas", desc: "Identifique regiões sem apoio e elimine ilhas", page: "guias", keywords: "overhang ilha voando sem apoio preview analise" },
  { type: "Guia", label: "Velocidade de Impressão", desc: "Otimize o ciclo por camada sem trocar por falhas", page: "guias", keywords: "velocidade rapido ciclo lift retract time lapse" },
  { type: "Guia", label: "Resistência de Peças", desc: "Material, geometria, orientação e pós-cura", page: "guias", keywords: "resistencia carga forca mecanico estrutural orientar" },
  { type: "Guia", label: "Correções no Blender", desc: "Malha, normais, furos e volume antes do STL", page: "guias", keywords: "blender stl malha normals furos volume mesh" },
  { type: "Guia", label: "Peças Ocas: Riscos e Prevenção", desc: "Evite resina presa, vazamentos e trincas", page: "guias", keywords: "oco vazio resina presa vazamento trinca explode" },
  { type: "Guia", label: "Altura de Camada", desc: "Detalhe, tempo e estabilidade por resolução Z", page: "guias", keywords: "altura camada layer height resolucao z detalhe" },
  { type: "Guia", label: "Tensão Térmica e Deformação", desc: "Empenamento e tensão residual por temperatura", page: "guias", keywords: "empenar warp temperatura tensao residual cura" },
  { type: "Guia", label: "Tensão e Deformação de Resinas", desc: "Curvas, propriedades e modos de falha funcionais", page: "guias", keywords: "tensao deformacao curva elasticidade ruptura mecanica" },
  { type: "Guia", label: "Parâmetros Chitubox e Lychee", desc: "Glossário completo de cada parâmetro dos fatiadores", page: "guias", keywords: "parametro chitubox lychee glossario referencia" },
];

const TYPE_ORDER = ["Seção", "Resina", "Guia"];
const TYPE_COLOR = { "Seção": "var(--primary)", "Resina": "#A78BFA", "Guia": "#2DD4BF" };

function normalize(str) {
  return String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function score(item, q) {
  const nq = normalize(q);
  const label = normalize(item.label);
  const desc = normalize(item.desc || "");
  const kw = normalize(item.keywords || "");
  const type = normalize(item.type);
  if (label.startsWith(nq)) return 3;
  if (label.includes(nq)) return 2;
  if (desc.includes(nq) || kw.includes(nq) || type.includes(nq)) return 1;
  // split query words
  const words = nq.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every(w => (label + " " + desc + " " + kw).includes(w))) return 1;
  return 0;
}

export default function SearchModal({ onClose, onNavegar }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = query.trim().length === 0
    ? SEARCH_INDEX.filter(i => i.type === "Seção")
    : SEARCH_INDEX.map(i => ({ ...i, _score: score(i, query) }))
        .filter(i => i._score > 0)
        .sort((a, b) => b._score - a._score || TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setCursor(0); }, [query]);

  const select = useCallback((item) => {
    onNavegar(item.page);
    onClose();
  }, [onNavegar, onClose]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === "Enter" && results[cursor]) select(results[cursor]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, cursor, select, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <div className="q-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()} style={{ alignItems: "flex-start", paddingTop: "clamp(48px, 12vh, 120px)" }}>
      <div className="q-modal" style={{ maxWidth: 560, width: "100%", padding: 0, overflow: "hidden" }}>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="q-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar resinas, guias, seções…"
            style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: "0.95rem", padding: 0 }}
          />
          {query && <button type="button" onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}><X size={14} /></button>}
          <kbd style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: 4, background: "var(--surface-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 360, overflowY: "auto", padding: "8px 0" }}>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Nenhum resultado para "<strong>{query}</strong>"
            </div>
          ) : results.map((item, idx) => {
            const Icon = SECAO_ICONS[item.page] || BookOpen;
            const isActive = idx === cursor;
            return (
              <button
                key={item.label + idx}
                type="button"
                data-idx={idx}
                onClick={() => select(item)}
                onMouseEnter={() => setCursor(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "9px 16px", border: "none", cursor: "pointer", textAlign: "left",
                  background: isActive ? "var(--primary-dim)" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "var(--surface-card)", border: "1px solid var(--border)", flexShrink: 0 }}>
                  <Icon size={14} style={{ color: TYPE_COLOR[item.type] || "var(--text-muted)" }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.desc}</div>
                </span>
                <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: 99, background: "var(--surface-card)", border: "1px solid var(--border)", color: "var(--text-faint)", flexShrink: 0 }}>{item.type}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, fontSize: "0.72rem", color: "var(--text-faint)" }}>
          <span>↑↓ navegar</span><span>Enter selecionar</span><span>Esc fechar</span>
        </div>
      </div>
    </div>
  );
}
