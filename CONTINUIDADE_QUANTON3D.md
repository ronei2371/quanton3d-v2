# Continuidade Quanton3D

Este projeto esta em transicao: parte veio do site antigo, parte foi refeita e parte ainda precisa ser separada com cuidado. A prioridade e preservar o que funciona e evoluir sem regressao.

## Objetivo

- Transformar o Quanton3D em uma plataforma tecnica de suporte e conversao, nao apenas um catalogo.
- Integrar produtos, servicos, calculadoras, leads, pedidos de parceria, contato direto e bot tecnico.
- Usar MongoDB Atlas como base operacional e fonte tecnica para bot e painel admin.

## Arquitetura Atual

- Frontend: React + Vite em `quanton3dfrontend`.
- Backend: Node.js + Express + MongoDB Atlas em `quanton3dbackend`.
- Uploads: parceiros e bot tecnico ja usam upload de imagens.
- Colecoes importantes: `parametros`, `documents`, `bottickets`, `partnerrequests`, `contactmessages`, `clientes`.

## Modulos Sensíveis

- `quanton3dfrontend/src/App.jsx`: concentra gatilhos de modais e abas.
- `quanton3dfrontend/src/components/BotTicketModal.jsx`: formulario do bot, deve mudar com cuidado.
- `quanton3dbackend/services/diagnosticEngine.js`: coracao do raciocinio tecnico do bot.
- `quanton3dfrontend/src/components/AdminUnifiedPanel.jsx`: painel admin em amadurecimento.

## Ordem de Trabalho

1. Auditar e estabilizar `diagnosticEngine.js`.
2. Auditar e estabilizar `BotTicketModal.jsx`.
3. Validar um caso de hardware, um de adesao/suporte e um de cura.
4. Fazer o bot usar explicitamente os valores preenchidos.
5. Adicionar modo de pergunta livre ao lado do modo por abas.
6. Auditar `App.jsx` e corrigir abas quebradas.
7. Completar painel admin com acoes reais.

## Regras de Seguranca

- Nao substituir modulos estaveis por versoes experimentais sem auditoria.
- Nao misturar backend e frontend em uma etapa pequena, exceto quando a integracao exigir.
- Nao confiar em resposta generica do bot sem validar categoria e campos usados.
- Nao tocar no GitHub antigo; este projeto deve virar um repositorio novo e separado.
- Preferir passos pequenos, testaveis e documentados.
