import { ArrowLeft, ExternalLink } from "lucide-react";

// Exibe um guia técnico em tela cheia, logo abaixo do menu oficial do site.
// O guia mantém o próprio menu one-page interno para navegar entre as seções,
// enquanto a navegação do site continua acessível no topo.
function GuideViewer({ guide, onVoltar }) {
  return (
    <div className="guide-viewer">
      <div className="guide-viewer-bar">
        <button type="button" className="q-btn q-btn--ghost q-btn--sm" onClick={onVoltar}>
          <ArrowLeft size={15} /> {guide.returnLabel || "Voltar aos guias"}
        </button>
        <span className="guide-viewer-title">{guide.title}</span>
        <a className="guide-viewer-open" href={guide.file} target="_blank" rel="noreferrer">
          Abrir em nova aba <ExternalLink size={13} />
        </a>
      </div>
      <iframe className="guide-viewer-frame" title={guide.title} src={guide.file} />
    </div>
  );
}

export default GuideViewer;
