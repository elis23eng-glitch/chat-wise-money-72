# Como contribuir

Obrigado pelo interesse em melhorar o Wise Money. Este projeto usa mudanças pequenas e verificáveis
para proteger os fluxos financeiros, a acessibilidade e a experiência do aplicativo instalado.

## Preparação local

1. Instale Node.js e Bun.
2. Copie `.env.example` para `.env` e use apenas credenciais do seu ambiente.
3. Execute `bun install`.
4. Inicie o projeto com `bun run dev`.

Nunca versione arquivos `.env`, chaves privadas, tokens ou dados financeiros reais.

## Fluxo de trabalho

1. Crie uma branch curta a partir de `main`.
2. Faça uma alteração coesa por pull request.
3. Inclua ou atualize testes quando houver mudança de regra.
4. Execute `bun run check` antes de publicar a branch.
5. Descreva impacto visual, risco, validação e eventual plano de reversão na pull request.

Commits devem explicar a intenção da mudança. Prefixos como `feat:`, `fix:`, `refactor:`, `test:` e
`docs:` ajudam a leitura do histórico.

## Critérios de aceite

- formatação e lint aprovados;
- TypeScript sem erros;
- testes aprovados;
- build de produção concluído;
- service worker íntegro;
- bundles dentro dos limites definidos;
- nenhuma credencial ou dado pessoal no diff;
- textos em português e inglês mantidos quando a interface for bilíngue;
- regressão visual aprovada para mudanças de interface.

## Segurança

Vulnerabilidades não devem ser publicadas em issues. Siga o processo descrito em
[SECURITY.md](SECURITY.md).
