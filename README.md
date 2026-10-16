# Cardápio digital em React

Template white-label com cardápio público e painel do gestor em entradas independentes. Sem Node.js ou compilação para usar/hospedar; React é carregado por CDN.

## Duas formas de usar

- **Demonstração local:** cloud-config.js com ativo: false. CRUD e prévia com rascunhos locais, sem publicação. O único botão de publicação fica desativado até conectar o serviço online. Não há login neste modo, identificado como demonstração.
- **Gestão online com Supabase:** ativo: true após configurar o projeto. Login por e-mail/senha, autorização do gestor no banco e botão Publicar cardápio. O consumidor lê os dados online sem precisar de novo deploy.

A integração está preparada, mas o projeto Supabase real ainda precisa ser criado e configurado. Consulte [supabase/README.md](supabase/README.md) para o passo a passo e as verificações de entrega.

## Endereços

| Público | Página |
| --- | --- |
| Consumidor | index.html ou endereço principal |
| Gestor | admin.html |
| Prévia do gestor | admin.html#preview |

O QR Code aponta apenas para o endereço principal. Não há link administrativo no cardápio. O antigo /#admin também exibe só o cardápio.

## Abrir no computador

No Windows, execute iniciar.bat. Ele abre o painel e inicia o servidor Python. Mantenha a janela aberta; encerre com Ctrl+C.

Ou execute na pasta do projeto:

    python -m http.server 4173 --bind 127.0.0.1

Consumidor: http://127.0.0.1:4173/
Gestor: http://127.0.0.1:4173/admin.html

É necessário usar HTTP em vez de abrir o HTML por duplo clique. Python serve apenas os arquivos durante desenvolvimento; não é necessário um servidor Python na hospedagem.

## Ativação do Supabase

1. Crie o projeto na conta responsável pelo restaurante.
2. Execute supabase/schema.sql e cadastre o usuário gestor em Authentication.
3. Preencha o UUID do gestor em supabase/seed.sql e execute o arquivo.
4. Configure URL, chave PUBLICÁVEL e restauranteId em cloud-config.js. Nunca use senha, service_role ou chave secreta.
5. Ative o modo online e faça as verificações de autorização e publicação descritas no guia.
6. Publique o front-end estático.

Não há projeto remoto criado nem credenciais configuradas automaticamente. Os testes locais não validam RLS em um banco real.

## Rotina do gestor

- Cadastre/edite/exclua produtos e categorias.
- Personalize marca, preços, fotos e descrições.
- Confira Ver prévia.
- Em modo online, clique Publicar cardápio: o banco recebe uma versão completa do cardápio, e novos acessos do consumidor já leem essa versão. Páginas abertas consultam atualizações a cada 30 segundos enquanto visíveis e ao receber foco.
- O painel possui apenas o botão Publicar cardápio para disponibilizar alterações. Rascunhos são locais; o conteúdo publicado é compartilhado.

A publicação detecta conflito com outra aba para evitar sobrescrever uma edição recente. Em conflito, reabra o painel e reconcilie os dados antes de publicar. O login usa Supabase Auth; a autorização real depende das políticas SQL.

As fotos demonstrativas continuam em imagens/. Novas fotos podem usar caminho relativo ou URL HTTPS. O envio direto de fotos pelo painel está implementado e exige executar supabase/storage.sql no projeto.

## Infraestrutura e compra única

A aplicação pode ser vendida em compra única. Isso é separado da infraestrutura: Supabase mantém autenticação e banco, e o front-end pode ficar no GitHub Pages. Não é necessário manter servidor próprio ligado.

O plano gratuito pode atender um MVP, mas tem cotas e pode pausar projetos por inatividade. Não prometa custo zero permanente. Contas, dados e eventuais planos pagos devem ficar sob responsabilidade combinada com o restaurante.

Condições atuais: https://supabase.com/pricing

## Hospedagem estática

Publique index.html, admin.html, config.js, cloud-config.js, src/ e imagens/. Os caminhos são relativos e funcionam em subpastas do GitHub Pages. Em modo online, atualizações do conteúdo são publicadas pelo painel sem substituir config.js. Esse arquivo continua como base da demonstração local.

## Código

- src/App.js e src/main.js: entrada do consumidor e consulta dos dados publicados.
- src/AdminApp.js e src/admin-main.js: entrada do gestor.
- src/components/CloudManager.js e Login.js: sessão, autorização e publicação.
- src/services/cloud.js: cliente Supabase, leitura pública e atualização com revisão.
- src/hooks/usePublishedMenu.js: atualização periódica do cardápio.
- src/hooks/useMenu.js: rascunho local isolado por projeto, restaurante, gestor e revisão.
- src/components/Menu.js, Admin.js e formulários: componentes da interface.
- src/lib/menu.js: validação, preços e operações de dados.
- supabase/: SQL e guia de ativação.

## Testes de desenvolvimento

Node.js é opcional para executar os testes; não é dependência da aplicação:

    node --test tests/cloud.test.mjs

Cobrem configuração, publicação, conflito, validação e autorização com cliente simulado. Antes de entregar em produção, teste também login, RLS, contas sem permissão e publicação no Supabase real.


## Interface do gestor

O painel não oferece exportar configuração, baixar/importar backup ou restaurar arquivos. O fluxo é editar, salvar, conferir a prévia e clicar em Publicar cardápio. Esse botão só publica quando o modo online está conectado. Em demonstração ele fica desativado.

Ver cardápio publicado abre index.html na mesma aba, respeitando a pasta da instalação. Volte pelo botão Voltar do navegador para retornar ao painel.

Para fotos, cole o endereço público direto da imagem no campo Imagem do produto. A prévia indica carregamento ou erro. A imagem precisa estar acessível sem login; um endereço de página ou caminho de arquivo do computador não serve como URL pública. O gestor também pode enviar fotos diretamente pelo painel após ativar o Storage.


## Enviar fotos pelo painel

1. Execute supabase/storage.sql (ou storage.sql nesta pasta) no SQL Editor do projeto, após schema.sql. Isso cria o bucket público menu-images, com limite de 2 MB por arquivo armazenado e envio permitido apenas ao gestor dono do restaurante.
2. Atualize o painel, entre como gestor e abra um produto, logo ou banner.
3. Clique Enviar foto ou Trocar foto e selecione um arquivo JPEG, PNG ou WebP de até 10 MB.
4. O navegador reduz a foto para até 1600 pixels, preserva a proporção e envia uma versão otimizada para o Supabase. A URL é preenchida automaticamente.
5. Aguarde a confirmação, confira a prévia, salve o formulário e clique Publicar cardápio.

As fotos do cardápio são públicas para que os consumidores possam vê-las, inclusive antes de a URL ser incluída na versão publicada. Não envie documentos ou fotos privadas. Somente o gestor autenticado pode enviar para a pasta do seu restaurante. Cada envio usa um nome novo; trocar uma foto não sobrescreve a imagem da versão publicada.

Fotos antigas e envios de formulários cancelados permanecem no Storage. Não há exclusão automática para evitar quebrar o cardápio publicado; o titular do projeto pode limpar arquivos não utilizados pelo painel Supabase. Armazenamento e tráfego contam nas cotas do serviço. HEIC, SVG e GIF não são aceitos neste fluxo.

Os testes locais verificam validação e upload com cliente simulado. Após executar storage.sql, valide um envio real autenticado e a leitura da imagem sem login antes da entrega.
