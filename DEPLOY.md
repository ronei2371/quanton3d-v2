# Deploy Quanton3D

Este repositorio contem frontend e backend no mesmo projeto. O fluxo recomendado agora e:

- Site + bot/API juntos no Render.
- HostGator pode ser usada apenas para dominio/redirecionamento, se necessario.
- Banco de dados no MongoDB Atlas.

## Site + Bot no Render

O repositorio ja contem `render.yaml` na raiz. Ele prepara um unico Web Service que:

- instala o backend;
- instala o frontend;
- gera o build do frontend;
- inicia o backend;
- faz o backend servir o site e as rotas `/api`.

Configuracao esperada no Render:

- Runtime: Node.
- Root Directory: deixe vazio.
- Build Command: `npm install --prefix quanton3dbackend && npm install --prefix quanton3dfrontend && npm run build --prefix quanton3dfrontend`.
- Start Command: `npm start --prefix quanton3dbackend`.
- Health check manual: abrir `/health` na URL do backend.

Depois de publicar, teste:

```text
https://URL-DO-RENDER/health
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

## Frontend

No Render, o frontend usa a mesma origem do backend e chama a API por `/api`. Nao precisa definir `VITE_API_URL` para o deploy junto.

Para desenvolvimento local, o fallback continua sendo:

```text
http://localhost:10000/api
```

Se algum dia o frontend voltar a ser hospedado separado, configure:

```text
VITE_API_URL=https://URL-DO-BACKEND/api
```

## HostGator

A HostGator nao precisa rodar o app se o Render estiver servindo site + bot juntos. Ela pode apontar o dominio para o Render conforme a configuracao de DNS/domino disponivel.

## MongoDB Atlas

Use a string de conexao do Atlas em:

```text
MONGODB_URI
```

O IP do Render precisa ter acesso liberado no Atlas. Para teste rapido, pode-se liberar temporariamente `0.0.0.0/0`, mas para producao o ideal e restringir o acesso quando possivel.

## Ligacao entre Frontend e Backend

Quando o site estiver no mesmo Render, `ALLOWED_ORIGINS` pode incluir a URL do Render e o dominio final.

Exemplo:

```text
ALLOWED_ORIGINS=https://quanton3d-v2.onrender.com,https://seudominio.com.br,http://localhost:5173
```
