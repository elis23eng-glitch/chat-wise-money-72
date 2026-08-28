# Atualização automática e confirmação da versão v4

## Objetivo
Deixar a versão **v4** visível no chat e na tela de atualização, atualizar automaticamente instalações antigas e permitir uma recarga forçada pelo painel.

## Implementação
- Expor no service worker uma resposta de versão (`v4`) e usar URLs sem cache ao procurar uma publicação nova.
- Comparar no frontend a versão incorporada ao app, a versão do worker que controla a página e a versão publicada na rede.
- Ao detectar uma versão publicada mais nova, atualizar o registro, ativar o worker em espera, limpar caches antigos e recarregar automaticamente uma única vez, evitando ciclos de recarga.
- Mostrar um alerta global quando o worker controlador estiver desatualizado, com ação para atualizar imediatamente.
- Adicionar “Wise Money v4” de forma clara no cabeçalho do chat e destacar “Versão instalada: v4” na tela de atualização.
- Adicionar ao botão do painel a ação “Recarregar agora”, que limpa caches do app, atualiza o service worker e recarrega a página sem exigir fechar o aplicativo.
- Manter o comportamento offline: se não houver rede, preservar o cache atual e informar a falha sem apagar a experiência disponível.

## Validação
- Atualizar o E2E de PWA para verificar a versão do worker, remoção de cache antigo e atualização sem reinstalação.
- Rodar lint, tipos, testes e os E2E relacionados à atualização.
- Validar no navegador a versão visível no chat e na tela de atualização, além do botão de recarga.
