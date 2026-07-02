export default function CalculadoraCustos() {
  return (
    <div style={{ width: "100%", height: "80vh", overflow: "hidden", borderRadius: "8px" }}>
      <iframe
        title="Calculadora de Custos e Orçamentos"
        src="/calculadora-custos.html"
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="clipboard-write"
      />
    </div>
  );
}
