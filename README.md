# Cardápio digital em React

## Apresentação Gastrô Pub

Apresentação pública: [Gastrô Pub](https://gastro-pub-apresentacao-luis.netlify.app/),
publicada em projeto separado no Netlify, sem marca d'água.

Abra [gastro-pub.html](gastro-pub.html) no servidor local para ver a versão preto e
laranja com a logo, Hambúrgueres, Bebidas e Espetinhos. Os seis produtos têm preços
ilustrativos e ficam em `clientes/gastro-pub/config.js`. Essa apresentação não
altera o cardápio no Supabase. Detalhes em [clientes/gastro-pub/README.md](clientes/gastro-pub/README.md).

## Vercel — 28/10/2026

**Decisão atual:** manter o Netlify gratuito. O selo Powered by Netlify foi
desativado nas configurações reais do projeto em 28/10/2026, com confirmação
"The badge is not shown on this project". Não foi necessário migrar ou fazer
um novo deploy para remover o selo. A compatibilidade Vercel abaixo é opcional.

Compatibilidade preparada com `vercel.json`, Function em `/api/publish-menu` e
Deploy Hook protegido no servidor. Veja [VERCEL.md](VERCEL.md) para ativar. O
Hobby é restrito a uso pessoal não comercial; confira o plano antes de hospedar
o produto vendido a restaurantes. O site real ainda não foi migrado.

## Publicação independente do Supabase

O consumidor lê uma versão estática do cardápio e das fotos na hospedagem. O
Supabase é necessário para o gestor editar e publicar. O fluxo automático usa
uma Function e Deploy Hook na Vercel ou no Netlify e exige ativação no site antes de vender.
Leia [PUBLICACAO-ESTATICA.md](PUBLICACAO-ESTATICA.md) para configurar, testar e
entender os limites do plano gratuito. Esta adaptação ainda não foi implantada
no site real. A prévia local já tem uma cópia da versão atual.

## Melhorias de gestão e consulta — 27/10/2026

- O cliente pode buscar por nome, descrição, categoria, porção e informações alimentares, sem precisar digitar acentos.
- Toque no nome ou na foto para abrir os detalhes e visualizar a imagem ampliada.
- No painel, **Pausar** marca um produto como indisponível sem excluir seu cadastro; **Disponibilizar** reverte a ação. A mudança só aparece para o cliente depois de publicar.
- **Organizar ordem** mostra setas para reordenar categorias e produtos. Produtos são ordenados dentro de sua categoria; para mudar de categoria, use Editar.
- O painel indica **Alterações não publicadas** ou **Tudo atualizado**, com a data da versão publicada quando disponível. O botão de publicação fica desativado quando não há alterações.
- O formulário do produto aceita **Porção** e **Informações alimentares**. Esses dados são preenchidos pelo restaurante; o sistema não deduz composição ou alergênicos.
- **Histórico** permite carregar uma publicação anterior como rascunho, com confirmação. Isso não publica automaticamente a versão escolhida.
- **QR Code e guia** gera o código no próprio navegador, permite baixar para impressão e explica a rotina de configuração e publicação.
- **Esqueci minha senha** solicita um link por e-mail e permite criar uma nova senha ao retornar pelo link de recuperação.

Para ativar o histórico, execute [supabase/history.sql](supabase/history.sql) no SQL Editor após `schema.sql`, no mesmo projeto configurado no site. Ele registra a versão atual e as próximas publicações, mantendo as últimas 20 versões de cada restaurante. O histórico é privado do gestor e não recupera publicações anteriores à ativação. Sem essa atualização, os demais recursos continuam funcionando; a aba Histórico informa que o serviço não está disponível.

Para a recuperação de acesso, cadastre o endereço HTTPS de `admin.html` em **Supabase → Authentication → URL Configuration → Redirect URLs**, por exemplo `https://brasa-e-pao-cardapio-luis.netlify.app/admin.html`. O envio usa o serviço de e-mail configurado no projeto e deve ser testado com a caixa de entrada real do gestor. Não é necessário compartilhar senhas com o responsável pela aplicação.

O QR Code deve apontar para a página do cliente, sem fragmentos ou parâmetros de acesso. No computador de desenvolvimento, preencha o endereço público HTTPS antes de gerar. Confira a leitura no celular antes de imprimir.

Não foi implementado modo offline. React continua carregado pelo CDN. As cópias `vendor/react.mjs`, `vendor/react-dom-client.mjs` e `vendor/LICENSE-React.txt`, se presentes de uma preparação anterior, não são utilizadas nem copiadas para a hospedagem. Somente a biblioteca local de QR Code e sua licença são incluídas de `vendor/`.

Validação desta etapa: [QA-20261027.md](QA-20261027.md).

Template white-label com cardápio público e painel do gestor em entradas independentes. O navegador não exige Node.js ou compilação; React é carregado por CDN. A publicação automática executa Node.js no build do Netlify e uma Function sob demanda, sem servidor permanente para manter.

## Duas formas de usar

- **Demonstração local:** cloud-config.js com ativo: false. CRUD e prévia com rascunhos locais, sem publicação. O único botão de publicação fica desativado até conectar o serviço online. Não há login neste modo, identificado como demonstração.
- **Gestão online com Supabase:** ativo: true após configurar o projeto. Login por e-mail/senha, autorização do gestor no banco e botão Publicar cardápio. A publicação inicia um deploy no Netlify com JSON e imagens próprios; o consumidor não consulta o Supabase.

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
- Em modo online, clique Publicar cardápio: depois da pré-verificação, o banco salva a versão e a hospedagem prepara os arquivos. Aguarde a confirmação de publicação no painel. Novos acessos do consumidor leem a versão entregue; páginas abertas conferem o JSON a cada 30 segundos enquanto visíveis e ao receber foco.
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
