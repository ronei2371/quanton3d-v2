import { Ruler, MonitorCog, FlaskConical, Wrench, SlidersHorizontal, Stethoscope, Layers, BarChart3, CornerRightUp, Wind, PiggyBank, CircleDot } from "lucide-react";

// "parceiros" saiu daqui — o conteúdo de parceiros vive na seção Comunidade.
export const GUIDES = {
  nivelamento: { title: "Nivelamento de Plataforma", file: "/guias/guia-nivelamento.html", icon: Ruler, desc: "Passo a passo para nivelar a plataforma corretamente.", categoria: "preparar", tags: ["Plataforma", "Papel"] },
  fatiadores: { title: "Configuração de Fatiadores", file: "/guias/guia-configuracao-fatiadores.html", icon: MonitorCog, desc: "Como exposição, camada, orientação e suavização afetam a qualidade.", categoria: "preparar", tags: ["Qualidade", "Perfil"] },
  calibracao: { title: "Calibração de Resina", file: "/guias/guia-calibracao-resina.html", icon: FlaskConical, desc: "Método completo para obter parâmetros por medição e testes controlados.", categoria: "calibrar", tags: ["Exposição", "Encaixe"] },
  suportes: { title: "Suportes e Posicionamento", file: "/guias/guia-posicionamento-suportes.html", icon: Layers, desc: "Geometria, esforço, parâmetros e fluxo completo de suporte.", categoria: "calibrar", tags: ["Overhang", "Suportes"] },
  encaixeodonto: { title: "Encaixe e Orientação Odontológica", file: "/guias/guia-encaixe-orientacao-odontologica.html", icon: Layers, desc: "Oriente restaurações, modelos e próteses preservando encaixe, margens e passividade.", categoria: "calibrar", tags: ["Odontologia", "Encaixe"] },
  succao: { title: "Cavidades Fechadas e Efeito de Sucção", file: "/guias/guia-cavidades-succao.html", icon: Wind, desc: "Por que peças ocas precisam de respiro e drenagem.", categoria: "calibrar", tags: ["Cavidades", "Ventilação"] },
  contatosuporte: { title: "Contato de Suporte e Acabamento", file: "/guias/guia-contato-suporte.html", icon: CircleDot, desc: "Esférico ou direto: como escolher e remover sem marcas.", categoria: "calibrar", tags: ["Suportes", "Acabamento"] },
  diagnostico: { title: "Diagnóstico de Falhas", file: "/guias/guia-diagnostico-problemas.html", icon: Stethoscope, desc: "Identifique e resolva os problemas mais comuns.", categoria: "corrigir", tags: ["Sintomas", "Soluções"] },
  bottomcurling: { title: "Bottom Curling", file: "/guias/guia-bottom-curling.html", icon: CornerRightUp, desc: "Por que a borda da base levanta e como corrigir a causa.", categoria: "corrigir", tags: ["Aderência", "Peel"] },
  manutencao: { title: "Manutenção de Impressora", file: "/guias/guia-manutencao-impressora.html", icon: Wrench, desc: "Cuidados periódicos para prolongar a vida útil.", categoria: "manter", tags: ["FEP", "Eixo Z"] },
  otimizacao: { title: "Pós-processamento de Resina", file: "/guias/guia-otimizacao-parametros.html", icon: SlidersHorizontal, desc: "Segurança, lavagem, remoção, cura e inspeção final.", categoria: "manter", tags: ["Lavagem", "Acabamento"] },
  economia: { title: "Economia Inteligente de Resina", file: "/guias/guia-economia-resina.html", icon: PiggyBank, desc: "Reduza consumo sem virar fragilidade ou falha.", categoria: "manter", tags: ["Hollowing", "Calculadora"] },
  intensidade: { title: "Intensidade de Luz e Precisão", file: "/guias/guia-intensidade-luz-precisao.html", icon: FlaskConical, desc: "Voxel, escala de cinza, antialiasing e compensação dimensional.", categoria: "calibrar", tags: ["Voxel", "Precisão"] },
  overhangs: { title: "Overhangs e Ilhas", file: "/guias/guia-overhangs-ilhas.html", icon: Layers, desc: "Identifique regiões sem apoio e elimine ilhas antes de fatiar.", categoria: "preparar", tags: ["Preview", "Ilhas"] },
  velocidade: { title: "Velocidade de Impressão", file: "/guias/guia-velocidade-impressao.html", icon: SlidersHorizontal, desc: "Otimize o ciclo por camada sem trocar velocidade por falhas.", categoria: "calibrar", tags: ["Tempo", "Movimento Z"] },
  resistencia: { title: "Resistência de Peças em Resina", file: "/guias/guia-resistencia-pecas.html", icon: Wrench, desc: "Material, geometria, orientação e pós-cura conforme o esforço real.", categoria: "preparar", tags: ["Estrutura", "Carga"] },
  blender: { title: "Correções de Modelo no Blender", file: "/guias/guia-correcoes-blender.html", icon: MonitorCog, desc: "Corrija malha, normais, furos e volume antes de exportar o STL.", categoria: "preparar", tags: ["Blender", "STL"] },
  pecasocas: { title: "Peças Ocas: Riscos e Prevenção", file: "/guias/guia-pecas-ocas.html", icon: Wind, desc: "Evite resina presa, vazamentos, trincas e falhas tardias.", categoria: "corrigir", tags: ["Drenagem", "Trincas"] },
  alturacamada: { title: "Altura de Camada", file: "/guias/guia-altura-camada.html", icon: Ruler, desc: "Escolha a resolução Z equilibrando detalhe, tempo e estabilidade.", categoria: "calibrar", tags: ["Camada", "Resolução Z"] },
  tensaotermica: { title: "Tensão Térmica e Deformação", file: "/guias/guia-tensao-termica.html", icon: CornerRightUp, desc: "Controle empenamento e tensão residual causados por temperatura e cura.", categoria: "corrigir", tags: ["Temperatura", "Empenamento"] },
  tensaodeformacao: { title: "Tensão e Deformação de Resinas", file: "/guias/guia-tensao-deformacao.html", icon: BarChart3, desc: "Leia curvas, propriedades e modos de falha de peças funcionais.", categoria: "corrigir", tags: ["Mecânica", "Materiais"] },
};

// Referência transversal — não é um "guia" passo a passo, é consulta pontual.
export const REFERENCIA_PARAMETROS = {
  title: "Parâmetros Detalhados — Chitubox e Lychee",
  file: "/guias/secao-parametros-detalhados.html",
  icon: BarChart3,
  desc: "Glossário completo de cada parâmetro dos dois fatiadores.",
  tags: ["Chitubox", "Lychee"],
};
