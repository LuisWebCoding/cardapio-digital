# Ativar login e publicação com Supabase

O código está preparado, mas NÃO está conectado a um projeto real. Até configurar cloud-config.js, o sistema mantém a demonstração local.

## Infraestrutura e entrega

- Front-end estático: GitHub Pages ou hospedagem estática equivalente.
- Supabase: autenticação por e-mail/senha e PostgreSQL com políticas RLS.
- Não há servidor Node.js/Python de produção para você manter. Python é usado só para abrir o projeto localmente.
- Cada restaurante pode receber uma cópia do site e um projeto Supabase na própria conta.
- O plano gratuito tem limites, inclusive de projetos, tráfego e inatividade; confirme as condições atuais antes de vender.
- A compra única do software não garante infraestrutura gratuita para sempre. Combine que a conta, eventuais planos e domínio são responsabilidade do restaurante.

## Passo a passo inicial

1. Crie uma conta Supabase e um projeto. Guarde a senha do banco fora deste código.
2. Execute schema.sql no SQL Editor. Ele cria a tabela, a revisão de publicação e as regras de acesso.
3. Em Authentication, desabilite cadastro público de novas contas. Cadastre o gestor pelo painel administrativo Supabase. Ele recebe/define a própria senha; não coloque a senha no código nem no chat.
4. Copie o UUID desse usuário para o owner_id no seed.sql. Confira o id do restaurante e os dados iniciais, depois execute seed.sql no SQL Editor. Esse arquivo não sobrescreve restaurantes já cadastrados.
5. Em cloud-config.js, informe a URL do projeto, a chave PUBLICÁVEL (sb_publishable_... ou anon legada) e o restauranteId igual ao id usado no seed.sql.
6. Defina ativo: true. Nunca use service_role, sb_secret, senha do banco ou token de conta no front-end.
7. Publique todos os arquivos do site, inclusive cloud-config.js, admin.html e src/.
8. Abra o cardápio em uma janela anônima. Depois abra admin.html, entre como gestor e publique uma alteração de teste.
9. Teste com outro usuário sem permissão: ele não deve acessar o editor nem conseguir atualizar o restaurante pela API.
10. Faça logout, valide que o editor some e confirme os dados no navegador do consumidor.

A criação de conta, a associação do gestor e a aplicação do SQL precisam de acesso ao projeto real. As políticas precisam ser testadas nesse projeto antes de entregar para produção.

## Funcionamento

O gestor continua editando rascunhos, e confirma com Publicar cardápio. A publicação faz uma atualização atômica do JSON completo no banco, protegida por sessão, propriedade do restaurante e revisão. Duas abas não sobrescrevem uma versão nova sem aviso: em conflito, reabra o painel e reconcilie as alterações antes de publicar.

Novos acessos do consumidor leem os dados publicados. Telas abertas consultam novamente a cada 30 segundos enquanto visíveis e ao receber foco. Não há WebSocket permanente. Em falha inicial de conexão, o site não apresenta silenciosamente o config.js antigo como se estivesse atualizado.

Rascunhos são locais, separados por projeto, restaurante, gestor e revisão. Não são sincronizados entre dispositivos. O conteúdo PUBLICADO é compartilhado entre todos.

As fotos atuais continuam na pasta imagens/. Novas fotos podem ser enviadas pelo botão Enviar foto no painel. O envio direto para Supabase Storage está implementado; execute storage.sql para ativar as permissões.

Não existe cadastro público no site nem recuperação de senha por e-mail implementada nesta interface. A recuperação fica sob responsabilidade do titular do projeto Supabase. Antes de uma entrega comercial, defina esse fluxo com o restaurante.

## Sem simulação de segurança

O login controla a interface, mas a autorização real está no banco, por RLS. Visitantes podem ler somente id, data, revision e updated_at. Apenas o owner_id autenticado pode atualizar data; o navegador não tem permissão de alterar o dono ou de inserir/excluir restaurantes. O id do restaurante e a chave pública não são segredos.

O script deve ser aplicado em projeto novo ou revisado se já houver políticas próprias. Políticas permissivas preexistentes podem ampliar o acesso e precisam ser auditadas.

## Verificações locais

Com Node.js disponível somente para desenvolvimento:

    node --test tests/cloud.test.mjs

Os testes usam um cliente simulado para verificar chamadas, conflitos e validação; não substituem a validação de login, RLS e publicação no projeto Supabase real.

Fontes:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/getting-started/api-keys


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
