# Quanton3D

Projeto novo da plataforma Quanton3D, separado do site antigo.

## Estrutura

- `quanton3dfrontend`: frontend React + Vite.
- `quanton3dbackend`: backend Node.js + Express + MongoDB Atlas.
- `CONTINUIDADE_QUANTON3D.md`: memoria tecnica e ordem segura de continuidade.

## Observacoes

- Este repositorio nao deve receber arquivos `.env`, `node_modules`, `dist` ou uploads privados.
- O GitHub antigo deve permanecer preservado.
- A evolucao deve acontecer em etapas pequenas, primeiro estabilizando o bot tecnico e depois o restante do site.

## Comandos locais

Frontend:

```bash
cd quanton3dfrontend
npm install
npm run dev
```

Backend:

```bash
cd quanton3dbackend
npm install
npm run dev
```
