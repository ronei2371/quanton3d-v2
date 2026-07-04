export default function CalculadoraCustos() {
  return (
    <div style={{ width: "100%", height: "calc(100vh - 120px)", minHeight: "600px", overflow: "hidden", borderRadius: "8px" }}>
      <iframe
        title="Calculadora de Custos e Orçamentos"
        src="/calculadora-custos.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="clipboard-write"
      />
    </div>
  );
}
