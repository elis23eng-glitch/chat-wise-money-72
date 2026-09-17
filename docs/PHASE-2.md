# Fase 2 — Modularização e desempenho

## Objetivo

Reduzir o acoplamento dos componentes mais extensos, ampliar a cobertura de testes e diminuir o custo de carregamento sem alterar a experiência visual ou as funções existentes.

## Primeira entrega

- regras de revisão de comprovantes extraídas de `FotoNota.tsx` para `src/lib/receipt-review.ts`;
- seis testes unitários para auditoria de alterações do OCR, limiares de confiança e campos incertos;
- remoção de estado global mutável nos limiares de confiança, evitando interferência entre renderizações e usuários;
- remoção de `vite-plugin-pwa`, que não era mais utilizado desde a adoção do service worker estático;
- validação de formatação, lint, tipos, testes, build de produção e integridade do service worker.

## Segunda entrega

- regras de geração, filtragem e estatísticas de alertas extraídas do painel para funções puras;
- cobertura unitária dos cenários de saldo negativo, saldo apertado, sobra, projeção mensal e aumento semanal;
- renderizadores de código, fórmulas e diagramas carregados somente quando o conteúdo exige esses recursos;
- bundle inicial da conversa reduzido de aproximadamente 713 kB para 222 kB, uma redução de 69%;
- bundle compactado da conversa reduzido de aproximadamente 224 kB para 72 kB, uma redução de 68%;
- orçamento automatizado de bundle incluído no CI para impedir regressões de desempenho nas rotas de conversa e painel.

## Próximas entregas

1. separar os painéis visuais e estados do fluxo de comprovantes;
2. extrair as seções visuais maiores do painel financeiro;
3. ampliar testes das rotas e fluxos autenticados;
4. revisar dependências desatualizadas em entregas isoladas e acompanhadas de regressão visual.

## Critério de segurança

Cada etapa será entregue em mudanças pequenas, com CI obrigatório e sem alteração visual não planejada. A versão pública só recebe a refatoração após a revisão da pull request.
