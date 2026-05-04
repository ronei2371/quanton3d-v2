# Deploy Quanton3D

Este repositorio contem frontend e backend separados. Em hospedagem, configure cada parte como um servico/app separado.

## Backend

Diretorio raiz do servico:

```text
quanton3dbackend
```

Comandos:

```bash
npm install
npm start
```

Variaveis obrigatorias:

```text
PORT
MONGODB_URI
ALLOWED_ORIGINS
ADMIN_USER
ADMIN_PASSWORD
ADMIN_JWT_SECRET
ADMIN_SECRET
```

Variaveis para recursos de IA:

```text
OPENAI_API_KEY
OPENAI_CHAT_MODEL
OPENAI_MODEL
RAG_MIN_RELEVANCE
```

Depois de publicar o backend, teste:

```text
https://URL-DO-BACKEND/health
```

## Frontend

Diretorio raiz do app:

```text
quanton3dfrontend
```

Comandos:

```bash
npm install
npm run build
```

Diretorio de saida:

```text
dist
```

Variavel obrigatoria:

```text
VITE_API_URL=https://URL-DO-BACKEND/api
```

## CORS

Quando o frontend estiver publicado, coloque a URL dele em `ALLOWED_ORIGINS` no backend.

Exemplo:

```text
ALLOWED_ORIGINS=https://quanton3d-v2.vercel.app,http://localhost:5173
```
