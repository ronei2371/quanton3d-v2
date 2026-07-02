export default function Guide({ id, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Guia Técnico</h2>
          <button type="button" className="close-button" onClick={onClose}>&times;</button>
        </header>
        <section className="modal-body">
          <p>Conteúdo do guia {id} em desenvolvimento.</p>
        </section>
      </div>
    </div>
  );
}
