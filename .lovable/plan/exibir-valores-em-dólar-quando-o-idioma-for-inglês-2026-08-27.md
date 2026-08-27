# Exibir valores em dólar quando o idioma for inglês

Quando o usuário troca o idioma para English, os valores passam a ser exibidos em dólar ($), convertidos automaticamente pela cotação do dia. Em português tudo continua em reais (R$), exatamente como hoje.

## Como vai funcionar

- O app já busca a cotação USD/BRL para a tela de Mercado. Essa mesma cotação passa a alimentar a formatação de moeda.
- Ao entrar no app (ou trocar de idioma), a cotação é carregada uma vez e guardada em memória/cache; se a busca falhar, o app mantém os valores em R$ e não mostra número errado.
- Em inglês, um valor de R$ 1.234,56 aparece como `$228.65` (exemplo), com um aviso discreto: "Converted from BRL at today's rate (1 USD = R$ X.XX)".
- Registros continuam sendo salvos em reais no banco. Nada muda no que é gravado — a conversão é só de exibição.
- Se o usuário digitar um valor em inglês na conversa com a Nina, ele continua sendo interpretado em reais (mantemos o comportamento atual para não corromper dados). Podemos revisar isso depois se você quiser.

## Onde aparece

- Conversa, Resumo, Painel (gráficos e cartões), Metas, alertas de saldo.
- Prévia do relatório e PDF: quando o PDF for gerado em inglês, os valores saem em dólar com a mesma nota de conversão.

## Detalhes técnicos

- Nova função servidor `getUsdRate` (reaproveitando `fetchMarket` em `src/lib/market.server.ts`) exposta via um `*.functions.ts` público, com cache curto (ex.: 30 min).
- `src/lib/format.ts` ganha um estado de taxa (`definirCotacaoUsd`) além do idioma; `brl()`/`moeda()` passam a converter e usar `currency: "USD"` + `en-US` quando o idioma for `en` e houver taxa válida. Sem taxa → fallback BRL.
- `src/lib/i18n.tsx` carrega a cotação ao montar e ao trocar idioma, e mantém a remontagem já existente para reformatar valores.
- `src/lib/pdf-report.ts` e `PreviaRelatorio.tsx` recebem a taxa para formatar e imprimir a nota de conversão.
- Testes em `src/lib/format.test.ts` cobrindo: pt → R$, en com taxa → $, en sem taxa → R$.
