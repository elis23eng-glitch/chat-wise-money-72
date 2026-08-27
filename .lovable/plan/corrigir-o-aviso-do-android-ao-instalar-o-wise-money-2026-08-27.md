# Corrigir o aviso do Android ao instalar o Wise Money

## O que está acontecendo

O app foi instalado pelo Chrome ("Adicionar à tela inicial"). Nesse caminho o Chrome gera um mini-aplicativo automático a partir do arquivo de manifesto do site. Quando o Chrome não consegue gerar esse mini-aplicativo corretamente, ele cai em um modo antigo de atalho — e é aí que o Android mostra "criado para versão mais antiga do Android" e o Play Protect trata como risco.

O que já está confirmado no projeto: existe o manifesto em `public/manifest.json` com nome, escopo, cores e três entradas de ícone — porém o ícone de 512 px é usado duas vezes, uma como `any` e outra como `maskable`, apontando para o mesmo arquivo. Ícone maskable sem margem de segurança e reaproveitado é uma das causas conhecidas de falha na geração do app pelo Chrome.

O que ainda não foi verificado e será o primeiro passo: como o arquivo de manifesto e os ícones são realmente entregues no endereço publicado (tipo de conteúdo, status HTTP, tamanho real das imagens). Só depois dessa verificação dá para afirmar a causa exata.

## Passos

1. **Diagnóstico no endereço publicado**: conferir se `/manifest.json`, `/icons/icon-192.png` e `/icons/icon-512.png` respondem com sucesso, com o tipo de conteúdo certo, e se as imagens têm mesmo as dimensões declaradas.
2. **Ajustar o manifesto e os ícones** conforme o diagnóstico:
   - criar um ícone maskable próprio, com o porquinho centralizado e margem de segurança em volta (para não ser cortado no Android);
   - separar as entradas `any` e `maskable` em arquivos diferentes;
   - garantir os tamanhos 192 e 512 corretos e adicionar também ícone de 384 px, que ajuda na geração do app.
3. **Revisar as tags de instalação** no cabeçalho do app (manifesto, cor do tema, ícone da Apple), mantendo o que já funciona.
4. **Adicionar uma tela curta de "Como instalar no celular"** dentro do app, com passos em letras grandes para Android e iPhone, em português e inglês.
5. **Publicar** e enviar o link atualizado para teste.

## Passo a passo para o celular que já mostrou o aviso

Depois da publicação, no aparelho:

1. Remover o ícone atual da tela inicial (segurar e desinstalar).
2. Abrir o Chrome, Configurações do site do Wise Money, e limpar dados desse site.
3. Abrir novamente o link, esperar carregar por completo e usar o menu do Chrome → "Instalar app".

Isso é necessário porque o Android guarda os dados do app no momento da instalação; sem reinstalar, o aparelho continua com a versão antiga registrada.

## Observação importante

Esse caminho é o app instalado pelo navegador. Ele não passa pela Play Store, então não há como enviar "atualização de versão do Android" — a correção é fazer o Chrome conseguir gerar o app corretamente. Se depois dos ajustes o aviso persistir nesse aparelho específico, o app continua funcionando normalmente pelo link no navegador, e o próximo passo seria empacotar um aplicativo Android de verdade (caminho separado, com conta de desenvolvedor).

## Detalhes técnicos

- Verificação via requisições ao domínio publicado: status, `Content-Type` do manifesto e dimensões reais dos PNGs.
- `public/manifest.json`: separar `purpose: "any"` e `purpose: "maskable"` em arquivos distintos; incluir 192/384/512.
- Novos ícones em `public/icons/` gerados com área de segurança (conteúdo dentro de ~80% do quadro) para o maskable.
- Nenhum service worker será adicionado; a instalação continua sendo somente por manifesto, conforme a orientação de PWA do projeto.
- Nova rota de ajuda de instalação usando o padrão de rotas já existente e o sistema de idiomas `useIdioma`.
