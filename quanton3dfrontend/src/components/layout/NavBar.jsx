import { useEffect, useState } from "react";
import { ChevronDown, Menu, X, User } from "lucide-react";
import { NAV_ITEMS } from "../../data/navigation";
import AnimatedAtomLogo from "./AnimatedAtomLogo";

const PRIMARY_IDS = new Set(["inicio", "parametros", "calculadoras", "guias", "academy", "atendimento", "comunidade", "catalogo", "sobre"]);

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className={`qnav-link${active ? " qnav-link--active" : ""}`}
      onClick={onClick}
    >
      <Icon size={16} className="qnav-link-icon" aria-hidden="true" />
      {item.label}
    </button>
  );
}

function NavBar({
  paginaAtiva,
  onNavegar,
  cliente,
  onAbrirCadastro,
  atendenteLogado,
  onAbrirAdm,
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const primaryItems = NAV_ITEMS.filter((item) => PRIMARY_IDS.has(item.id));

  useEffect(() => {
    function fecharComEscape(event) {
      if (event.key === "Escape") {
        setMenuAberto(false);
      }
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, []);

  function navegar(id) {
    onNavegar(id);
    setMenuAberto(false);
  }

  return (
    <header className="qnav-header">
      <div className="q-shell qnav-inner">
        <button type="button" className="qnav-brand" onClick={() => navegar("inicio")} aria-label="Ir para o inicio">
          <AnimatedAtomLogo />
          <div>
            <span translate="no" className="qnav-title">Quanton3D<sup>®</sup></span>
          </div>
        </button>

        <button
          type="button"
          className="qnav-burger"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((valor) => !valor)}
        >
          {menuAberto ? <X size={19} /> : <Menu size={19} />}
        </button>

        <nav className={`qnav-links${menuAberto ? " qnav-links--open" : ""}`} aria-label="Navegacao principal">
          <div className="qnav-primary-links">
            {primaryItems.map((item) => (
              <NavItem key={item.id} item={item} active={paginaAtiva === item.id} onClick={() => navegar(item.id)} />
            ))}
          </div>

          <button type="button" className="q-btn q-btn--sm q-btn--primary qnav-client-button" onClick={atendenteLogado ? onAbrirAdm : onAbrirCadastro}>
            <User size={14} /> {atendenteLogado ? (atendenteLogado?.permissoes?.acessoAdmCompleto ? "Administracao" : atendenteLogado.codigo) : (cliente ? cliente.nome.split(" ")[0] : "Area do cliente")}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
