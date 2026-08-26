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
