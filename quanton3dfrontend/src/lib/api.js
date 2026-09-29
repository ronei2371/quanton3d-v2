import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
});

// Chave secreta do cliente (vem no cadastro). Chat, historico e contador do bot exigem.
export function cabecalhoCliente(cliente) {
  return cliente?.chave ? { "X-Cliente-Chave": cliente.chave } : {};
}

export default api;
