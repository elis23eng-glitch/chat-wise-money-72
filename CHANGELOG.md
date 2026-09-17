# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

## [Não publicado]

### Segurança

- proteção da rota de voz com autenticação e limite de requisições;
- remoção do `.env` versionado e inclusão de um exemplo sem credenciais;
- tratamento seguro de erros e timeout no gateway de voz.

### Qualidade

- correção do lint e das APIs depreciadas do TanStack Start;
- ajuste do E2E de PWA para testar o build de produção;
- documentação de arquitetura, segurança e débitos técnicos.
- extração das regras de revisão de comprovantes para um módulo de domínio testável;
- cobertura automatizada para diferenças de OCR, confiança e campos incertos;
- remoção do gerador PWA obsoleto, preservando o service worker estático validado.
- extração e testes das regras de alertas do painel financeiro;
- carregamento sob demanda dos renderizadores avançados da conversa;
- redução de aproximadamente 69% no bundle inicial da rota de conversa;
- orçamento de bundle automatizado no CI.
