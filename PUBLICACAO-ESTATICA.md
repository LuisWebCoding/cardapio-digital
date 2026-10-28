# Publicação estática do cardápio

**Vercel:** a adaptação de 28/10/2026 usa o mesmo processo de geração estática.
Consulte [VERCEL.md](VERCEL.md) para a configuração nessa hospedagem. As instruções
de Build Hook e cotas do Netlify abaixo se aplicam apenas ao Netlify.

O consumidor agora lê `published/menu.json` e `published/images/` na própria
hospedagem. Não consulta o banco, o login ou o Storage do Supabase. Isso funciona
também no primeiro acesso, com internet, mesmo se o Supabase estiver pausado.
React ainda vem do CDN; isso não implementa modo offline.

O gestor continua dependendo do Supabase para entrar, editar, enviar fotos e
publicar. Uma pausa impede essas operações até o projeto ser retomado. O pagamento
único da aplicação não elimina limites nem eventuais custos das contas externas.

## Ativar no Netlify

Esta integração usa Netlify Functions e Build Hooks. Não funciona por simples
upload de `dist/` ou apenas com GitHub Pages. O site precisa estar ligado ao
repositório GitHub com os fontes desta versão e publicação automática habilitada.

1. No Netlify, conecte o repositório/branch de produção ao site existente, caso
   ainda esteja usando apenas publicação manual.
2. Confira o build: comando `node scripts/prepare-site.mjs`, pasta `dist`.
   O `netlify.toml` define Node 22 e a pasta `netlify/functions`.
3. Em **Project configuration → Build & deploy → Build hooks**, crie um hook
   para a branch de produção. Guarde a URL no Netlify; ela permite disparar builds.
4. Em **Environment variables**, configure as quatro variáveis abaixo para o
   contexto de produção e com acesso às **Functions**. Se houver seleção de
   escopo no seu plano, não deixe somente em Builds.

| Variável | Valor |
| --- | --- |
| `MENU_SUPABASE_URL` | O mesmo `url` de `cloud-config.js` |
| `MENU_PUBLIC_KEY` | A mesma `chavePublica` publishable/anon de `cloud-config.js` |
| `MENU_RESTAURANT_ID` | O mesmo `restauranteId` de `cloud-config.js` |
| `MENU_BUILD_HOOK` | A URL secreta do hook criado no passo 3 |

Nunca use `service_role`, chave `sb_secret`, senha do banco ou token pessoal do
Netlify. Nunca coloque a URL do hook em `cloud-config.js`, no GitHub ou no chat.
5. Faça um deploy dos novos fontes. Ele lê a versão atual no Supabase e copia
   todas as fotos antes de liberar a nova versão. Se a preparação falhar, corrija
   o erro indicado no log; não publique manualmente uma pasta incompleta.
6. Abra `/published/menu.json` no site e confira se todas as fotos do cardápio
   abriram. Entre no gestor, altere um item e publique uma vez para testar o fluxo
   real. O botão só anuncia sucesso após encontrar a revisão na hospedagem.

Documentação oficial: [Build Hooks](https://docs.netlify.com/build/configure-builds/build-hooks/)
e [variáveis em Functions](https://docs.netlify.com/build/functions/environment-variables/).

## Fluxo de publicação

1. O gestor salva o rascunho e clica em **Publicar cardápio**.
2. O painel confere a configuração da publicação e a permissão do gestor no
   servidor antes de alterar o banco.
3. A atualização no Supabase mantém a verificação de revisão para evitar
   sobrescritas entre abas.
4. A Function valida novamente a sessão, a propriedade do restaurante e a revisão,
   e chama o hook secreto. Somente o servidor tem acesso ao hook.
5. O Netlify prepara o JSON e as fotos e publica os arquivos juntos. A versão
   anterior atende os clientes durante a preparação.
6. O painel verifica a revisão pública durante alguns minutos antes
   de anunciar sucesso. Uma revisão posterior de outra publicação exige reabrir
   o painel. Se a hospedagem demorar ou falhar, a mensagem não anuncia sucesso;
   o botão **Concluir publicação** permite tentar novamente sem duplicar a revisão
   já salva no Supabase. Reabrir o painel também compara a revisão salva com a
   revisão que está realmente na hospedagem.

O histórico do Supabase registra as revisões salvas no banco, inclusive uma revisão
que ainda esteja aguardando entrega na hospedagem. A situação pública aparece no
resumo do painel. Não trate somente a entrada no histórico como prova de deploy.

Páginas do consumidor abertas conferem o JSON a cada 30 segundos quando visíveis.
O nome da foto inclui o hash do conteúdo: trocar uma imagem não reutiliza o
endereço antigo. JSON tem `no-store`; fotos têm cache longo e endereço imutável.

## Fotos

São aceitos JPEG, PNG e WebP, até 2 MB por arquivo e 40 MB no total por publicação.
O preparador copia imagens locais de `imagens/`, imagens embutidas desses formatos
e fotos do bucket `menu-images` do próprio restaurante no Supabase configurado.
Endereços externos arbitrários e redirecionamentos são recusados no servidor.
Para usar uma foto de outro site, salve-a e envie pelo botão de upload no painel.
Uma foto que não puder ser copiada interrompe o build para não liberar uma versão
que ainda dependa do Storage.

## Testar localmente

```powershell
node scripts/create-snapshot.mjs
python -m http.server 4174 --bind 127.0.0.1
```

Abra `http://127.0.0.1:4174/`. O primeiro comando usa somente leitura do Supabase
para criar uma cópia local dos dados publicados e das fotos. Execute-o novamente
se quiser atualizar a cópia local. Não altera produtos, imagens ou preços no banco.
`published/` e `dist/` são gerados, ignorados no Git.

O servidor Python serve a consulta pública e a interface do gestor; não executa
Netlify Functions. Nele, a pré-verificação bloqueia a publicação antes de alterar
o banco. Teste a publicação completa no Netlify após a ativação acima.

Para preparar o pacote como a hospedagem faz:

```powershell
node --test tests/*.test.mjs
node scripts/prepare-site.mjs
```

## Limites de custo

Uma publicação do cardápio inicia um deploy de produção. Nos planos Netlify por
créditos consultados em 27/10/2026, são **15 créditos por deploy de produção** e
**300 créditos mensais no Free**, compartilhados com os demais consumos. Isso
não significa 20 atualizações garantidas: tráfego, funções e outras atividades
também consomem créditos. A conta pode ter um plano legado com outras regras.
Agrupe alterações antes de publicar e acompanhe o painel de uso. Limites de
hospedagem continuam podendo interromper o site, mesmo sem depender do Supabase.

Fontes: [consumo de créditos](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)
e [planos por créditos](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/).

## Estado desta entrega

Código, testes, cópia local e build local preparados. Não foram criados hooks,
alteradas variáveis de ambiente nem feito deploy no site real nesta etapa.
O fluxo com sessão, Function e build reais precisa ser validado após a ativação.
As verificações automatizadas da Function usam respostas simuladas dos serviços.
