import { Home, Zap, Calculator, BookOpen, MessageCircle, Users, FlaskConical, Atom, GraduationCap } from "lucide-react";

// Arquitetura de navegação do cliente — reorganizada a partir do v1.
// "Parâmetros" foi promovido (era a última seção, enterrada em acordeão).
// "Comunidade" agora reúne Parceiros + Galeria de fotos (antes separados sem motivo claro).
export const NAV_ITEMS = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "parametros", label: "Parâmetros", icon: Zap },
  { id: "calculadoras", label: "Calculadoras", icon: Calculator },
  { id: "guias", label: "Guias Técnicos", icon: BookOpen },
  { id: "academy", label: "Quanton Academy", icon: GraduationCap },
  { id: "atendimento", label: "Atendimento", icon: MessageCircle },
  { id: "comunidade", label: "Comunidade", icon: Users },
  { id: "catalogo", label: "Catálogo", icon: FlaskConical },
  { id: "sobre", label: "Sobre", icon: Atom },
];

// Endereco publico de cada pagina. Fica aqui para existir UM mapa so:
// o App.jsx usa no history.pushState e o NavBar.jsx usa no href dos links.
export const PAGINA_TO_PATH = {
  inicio: '/', catalogo: '/catalogo', parametros: '/parametros',
  calculadoras: '/calculadoras', guias: '/guias', academy: '/academia',
  atendimento: '/atendimento', comunidade: '/comunidade', sobre: '/sobre',
};
