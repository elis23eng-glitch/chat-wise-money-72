# Fase 2 — Modularização e desempenho

## Objetivo

Reduzir o acoplamento dos componentes mais extensos, ampliar a cobertura de testes e diminuir o custo de carregamento sem alterar a experiência visual ou as funções existentes.

## Primeira entrega

- regras de revisão de comprovantes extraídas de `FotoNota.tsx` para `src/lib/receipt-review.ts`;
- seis testes unitários para auditoria de alterações do OCR, limiares de confiança e campos incertos;
- remoção de estado global mutável nos limiares de confiança, evitando interferência entre renderizações e usuários;
- remoção de `vite-plugin-pwa`, que não era mais utilizado desde a adoção do service worker estático;
- validação de formatação, lint, tipos, testes, build de produção e integridade do service worker.

## Próximas entregas

1. separar os painéis visuais e estados do fluxo de comprovantes;
2. modularizar regras e seções do painel financeiro;
3. carregar sob demanda os renderizadores técnicos da conversa, com foco nos pacotes de diagramas e realce de código;
4. estabelecer orçamento de bundle e ampliar testes de rotas críticas.

## Critério de segurança

Cada etapa será entregue em mudanças pequenas, com CI obrigatório e sem alteração visual não planejada. A versão pública só recebe a refatoração após a revisão da pull request.
