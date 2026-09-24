# Continuidade Quanton3D

Manual de quem for mexer neste projeto. Leia antes de alterar qualquer coisa.
Ultima atualizacao: 24/09/2026.

## O que e o projeto

Site de suporte tecnico da Quanton3D (fabricante de resinas UV para impressoras 3D de resina SLA/DLP/LCD, Belo Horizonte, MG).
O site tem o bot IAQ3D, parametros de impressao, calculadoras, guias, catalogo, galeria e o painel ADM.

- Site no ar: https://quanton3d-v2.onrender.com
- Hospedagem: Render (servico `novo-quanton3d-site-bot`). Cada commit na `main` gera deploy automatico.
- Loja (WooCommerce): quanton3d.com.br. **Este projeto NAO mexe na loja.** Ela e so fonte de consulta das fichas das resinas.

## Estrutura

- `quanton3dfrontend/` - React + Vite.
  - `src/App.jsx` - abas, modais e botao flutuante do bot.
  - `src/components/sections/` - paginas (Parametros, Catalogo, Guias, Calculadoras, Atendimento...).
  - `src/components/modals/BotModal.jsx` e `BotChat.jsx` - janela do bot.
  - `src/components/IAQ3DAvatar.jsx` / `.css` - mascote animado (atomo com rosto).
  - `src/components/admin/AdminInternals.jsx` - painel ADM inteiro.
- `quanton3dbackend/` - Node.js + Express + MongoDB Atlas. Entrada: `server.js`.
  - `routes/chat.js` - rota do bot (`POST /api/chat`) e o prompt de sistema com as regras.
  - `services/rag.js` - busca do bot: detecta resina/impressora, puxa parametros oficiais, fichas e conhecimento aprovado.
  - `services/knowledge.js` - fichas das resinas, problemas comuns, exemplos de uso por aplicacao.
  - `services/aiRules.js` - respostas rapidas para perguntas frequentes (sem chamar a IA).
  - `services/responseSafety.js` - trava que impede o bot de inventar numeros sem fonte oficial.
  - `services/auditLog.js` - grava no Historico de Acoes (aba Logs do ADM) tudo que o admin/atendente altera.
  - `services/founderIdentity.js` - reconhece o fundador pelo telefone do cadastro.
  - `tests/` - testes automaticos (`cd quanton3dbackend && npm test`).
- Colecoes principais no MongoDB: `parametros`, `impressoracatalogos`, `conversas`, `sugestaoconhecimentos`, `clientes`, `logacaos`, `visitas`, `bottickets`, `partnerrequests`, `contactmessages`.

## Como o bot responde

IA: DeepSeek (modelo na variavel `DEEPSEEK_CHAT_MODEL`). Ordem de confianca das fontes (a de numero menor sempre ganha):

1. Parametros oficiais cadastrados no MongoDB (perfis com exposicao 0s sao ignorados).
1B. Ficha oficial da resina (`knowledge.js`): aplicacao, cor, lavagem, pos-cura, validade, propriedades.
2. Conversas corrigidas e aprovadas no ADM.
3. Sugestoes de conhecimento aprovadas no ADM.
4. Fontes externas curadas.
5. Base tecnica antiga, so como apoio.

Sem fonte oficial, o bot nao da valor numerico: orienta a Calculadora de Exposicao e o WhatsApp (31) 3271-6935.

## Regras de negocio (passadas pelo fundador)

- O bot e **suporte tecnico e conhecimento**, nao vendedor.
- Validade de todas as resinas: **12 meses a partir da data de fabricacao**.
- A Quanton3D **ainda nao tem resina biocompativel**. Guia cirurgico, provisorio, placa ou qualquer peca que va na boca do paciente: o bot diz que nao temos e nao oferece ATHOM como alternativa. As ATHOM sao de uso externo/laboratorio.
- ATHOM GENGIVA / GENGIVA: trabalho odontologico, imita a gengiva real, complemento para instalacao de dente fixo ou provisorio. Cor rosa.
- SPIN+ e o nome da SPIN no cadastro de parametros.
- RPG 4K: **ainda nao disponivel** para venda. O bot nao indica.
- Miniaturas: SPIN+ e 70/30 sao as ideais. Mais resistencia: SPIN+ com 30% de IRON. Cuidado com IRON e 70/30 em pecas com asas grandes ou partes inclinadas (podem entortar).
- Pode falar de **pintura e acabamento** (lixa, primer, tinta, verniz), sem indicar marca de tinta.
- **Nunca falar de FDM/filamento** e nunca de resina de outra marca.
- Nomes das resinas nunca sao traduzidos (IRON, SPIN, ALCHEMIST, FLEXFORM, PYROBLAST, POSEIDON...).
- Informacao de produto: conferir no site oficial quanton3d.com.br antes de colocar na ficha. Nunca inventar propriedade de resina.

## Regras de seguranca do projeto

- Nao mexer em quanton3d.com.br (loja).
- Nao alterar menu, catalogo ou calculadoras sem autorizacao do fundador.
- Nao renomear arquivos nem mudar URLs.
- Nao criar guias duplicados nem cards novos na tela de Guias.
- Nao apagar dados permanentemente: o fundador faz pela aba Limpeza do ADM.
- Nao colocar senha, chave ou telefone no codigo. Tudo fica nas variaveis do Render.
- Comentarios em arquivos CSS: somente ASCII (sem acento), senao o build do Vite quebra.
- Nao mexer em backend, CORS ou variaveis de ambiente sem necessidade e sem autorizacao.

## Variaveis do Render (so os nomes)

`MONGODB_URI`, `ALLOWED_ORIGINS`, `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`, `ADMIN_SECRET`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_CHAT_MODEL`, `RAG_MIN_RELEVANCE`, `RAG_MAX_RESULTS`, `FOUNDER_PHONES` (telefone do fundador para o bot reconhece-lo como criador), `SENTRY_DSN`, `VITE_GA4_ID`.

## Como publicar uma mudanca

1. Alterar o arquivo na branch `main` (pelo editor do GitHub).
2. O Render faz o deploy sozinho em 2 a 3 minutos.
3. Testar no site ao vivo (para o bot: fazer as perguntas afetadas pela mudanca).
4. Se mexer no backend, rodar os testes antes: `cd quanton3dbackend && npm test`.

## Fotos das impressoras

As fotos vem do repositorio publico Photocura (`raw.githubusercontent.com/Photocura-hub/Photocura/main/...`).
Os nomes dos arquivos diferenciam MAIUSCULAS de minusculas (ex.: o certo e `Elegoo_ELEGOO_MARS_4.png`). URL com a caixa errada nao carrega.

## Pendencias atuais

- 110 perfis de parametro zerados (0s): corrigir ou excluir em ADM > Parametros > "Mostrar so os perfis zerados". Ja nao aparecem no site.
- Limpar dados de teste pela aba Limpeza do ADM (Conversas, Clientes, Parceiros).
- 10 impressoras sem foto (nao existem no Photocura): CL-60, CL-89, HALOT-MAX, HALOT-SKY, Jupiter 2, LD-001, LD-003, Photon P1, Saturn 4 DLP, Sonic XL 4K Plus. Colocar URL da foto em ADM > Parametros > editar.
- 97 fotos quebradas no catalogo de impressoras que nao tem parametro (nao aparecem na pagina).
- Confirmar se a resina GENGIVA vai ou nao na boca do paciente (hoje o bot trata como uso externo/laboratorio).
