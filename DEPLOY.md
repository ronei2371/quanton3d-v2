# Deploy Quanton3D

Este repositorio contem frontend e backend separados. O fluxo recomendado para o projeto atual e:

- Backend no Render.
- Frontend/site estatico na HostGator.
- Banco de dados no MongoDB Atlas.

## Backend no Render

O repositorio ja contem `render.yaml` na raiz. Ele prepara um Web Service para o backend usando:

```text
quanton3dbackend
```

Configuracao esperada no Render:

- Runtime: Node.
- Root Directory: `quanton3dbackend`.
- Build Command: `npm install`.
- Start Command: `npm start`.
- Health check manual: abrir `/health` na URL do backend.

Depois de publicar o backend, teste:

```text
https://URL-DO-BACKEND/health
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

## Frontend na HostGator

Antes de gerar o build, configure em `quanton3dfrontend/.env`:

```text
VITE_API_URL=https://URL-DO-BACKEND/api
```

Gerar arquivos do site:

```bash
cd quanton3dfrontend
npm install
npm run build
```

Envie o conteudo da pasta abaixo para o `public_html` ou subpasta correta da HostGator:

```text
quanton3dfrontend/dist
```

O arquivo `public/.htaccess` e copiado para `dist` no build. Ele ajuda o React/Vite a abrir corretamente quando o usuario recarrega uma rota interna do site.

## MongoDB Atlas

Use a string de conexao do Atlas em:

```text
MONGODB_URI
```

O IP do Render precisa ter acesso liberado no Atlas. Para teste rapido, pode-se liberar temporariamente `0.0.0.0/0`, mas para producao o ideal e restringir o acesso quando possivel.

## Ligacao entre Frontend e Backend

Quando o frontend estiver publicado na HostGator, coloque a URL dele em `ALLOWED_ORIGINS` no Render.

Exemplo:

```text
ALLOWED_ORIGINS=https://seudominio.com.br,http://localhost:5173
```
