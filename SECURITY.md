# Política de segurança

## Escopo

O Wise Money é um projeto educacional de portfólio. Ele processa dados financeiros pessoais e,
por isso, alterações relacionadas a autenticação, autorização, armazenamento e integrações de IA
devem receber revisão adicional.

## Como relatar uma vulnerabilidade

Não publique chaves, tokens, dados pessoais ou detalhes exploráveis em uma issue pública. Envie o
relato de forma privada pelo fluxo **Security advisories** do GitHub, quando disponível, informando:

- componente ou rota afetada;
- passos mínimos para reprodução;
- impacto observado;
- sugestão de correção, se houver.

## Princípios adotados

- nenhuma senha ou chave secreta deve ser versionada;
- rotas que consomem serviços pagos exigem autenticação;
- o banco usa Row Level Security para isolar os dados por usuário;
- respostas de provedores externos não são repassadas integralmente ao cliente;
- mudanças de segurança devem manter lint, tipos, testes e build aprovados.

Consulte também a [arquitetura e os limites de confiança](docs/ARCHITECTURE.md).
