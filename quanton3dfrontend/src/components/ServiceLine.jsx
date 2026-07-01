export default function ServiceLine({ title, onClick }) {
  return (
    <button type="button" className="service-line" onClick={onClick}>
      <span>✓</span>
      <strong>{title}</strong>
    </button>
  );
}
