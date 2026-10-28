# Publicar na Vercel

Compatibilidade preparada em 28/10/2026. O consumidor continua lendo JSON e fotos
da hospedagem. O gestor usa Supabase Auth e o mesmo botão Publicar cardápio.

## Conta e plano

O **Hobby permite somente uso pessoal não comercial**. Para vender este cardápio
a restaurantes, use plano que permita uso comercial, como Pro. Não foi contratada
nenhuma assinatura. [Regra oficial](https://vercel.com/docs/plans/hobby).

## Ativação

1. Envie os fontes atualizados ao GitHub e importe o repositório na Vercel,
   mantendo o site antigo no ar enquanto testa o novo endereço.
2. Use Framework Preset **Other** e Node.js **22**. O `vercel.json` define o build
   `node scripts/prepare-site.mjs` e Output Directory `dist`. Não precisa Next.js.
3. Configure estas variáveis para **Production**:

| Variável | Valor |
| --- | --- |
| `MENU_SUPABASE_URL` | Mesmo `url` de `cloud-config.js` |
| `MENU_PUBLIC_KEY` | Mesma `chavePublica` publishable/anon |
| `MENU_RESTAURANT_ID` | Mesmo `restauranteId` |
| `MENU_BUILD_HOOK` | Deploy Hook da Vercel, criado no passo 5 |

4. Faça o primeiro deploy. Ele copia a versão atual e as fotos do Supabase.
   Até configurar o hook, o público abre, mas o painel bloqueia a publicação
   antes de alterar o banco.
5. Em **Settings → Git → Deploy Hooks**, crie um hook para a branch de produção.
   Salve a URL em `MENU_BUILD_HOOK`, no formato
   `https://api.vercel.com/v1/integrations/deploy/<projeto>/<segredo>`.
   Apesar do nome histórico da variável, use o hook **da Vercel**.
6. Faça um **Redeploy**, para a Function receber a variável. Nunca use service_role,
   `sb_secret`, senha do banco ou token pessoal da Vercel. O hook é secreto: não
   coloque sua URL no frontend, no GitHub nem no chat.
7. No Supabase, adicione `https://SEU-PROJETO.vercel.app/admin.html` em
   **Authentication → URL Configuration → Redirect URLs**. Se usar domínio próprio,
   adicione também o endereço administrativo dele. Isso permite recuperar a senha
   pelo novo endereço.
8. Confira `/`, `/admin.html`, `/published/menu.json`, fotos, login e recuperação.
   Publique uma alteração e aguarde a confirmação da revisão pública no painel.
9. Gere o QR Code com o novo endereço. Códigos antigos com `netlify.app` não mudam
   sozinhos: planeje sua troca ou um redirecionamento antes de encerrar o site antigo.

## Arquivos e segurança

- `vercel.json`: build, cache, cabeçalhos e redirecionamento `/admin`.
- `api/publish-menu.mjs`: Function Node.js com Web Request/Response.
- `server/publish-menu.mjs`: sessão, propriedade do restaurante, revisão e hook.
- O navegador usa `/api/publish-menu`; o hook nunca é devolvido ao frontend.
- O adaptador Vercel só aceita o host e formato do hook da Vercel. O token do gestor
  é enviado ao Supabase, nunca ao serviço de deploy.
- SQL, testes, servidor, variáveis privadas e fixtures não entram em `dist/`.
- O HTML não inclui selo ou toolbar. A Vercel tem uma Toolbar de desenvolvimento
  habilitada por padrão em previews. Apresente o endereço de produção e confira as
  configurações da conta antes da entrega.

## Limites e validação

Continuam valendo as cotas de build, funções, tráfego e cobrança da Vercel. Cada
publicação inicia um deploy; agrupe alterações. O Supabase precisa estar disponível
para editar, enviar fotos e gerar a próxima versão. A última versão estática
continua consultável mesmo se o Supabase pausar.

`node --test tests/*.test.mjs`: 39 aprovados nesta adaptação. Build no modo Vercel
verificado localmente. Os testes do Deploy Hook usam respostas simuladas; o fluxo
real precisa de login, projeto, hook e variáveis na conta Vercel. Nenhum site foi
migrado, domínio alterado ou plano contratado nesta etapa.

Fontes: [Deploy Hooks](https://vercel.com/docs/deploy-hooks),
[Functions Node.js](https://vercel.com/docs/functions/runtimes/node-js),
[Toolbar](https://vercel.com/docs/vercel-toolbar), [limites](https://vercel.com/docs/limits).
