export default function ParamItem({ label, value }) {
  return (
    <div className="param-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}
