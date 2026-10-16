# Sessão de QA — 16/10/2026

Aplicação: https://brasa-e-pao-cardapio-luis.netlify.app/

## Resultado e alcance

15 testes automatizados passaram. As seis verificações de leitura do ambiente
publicado passaram, cobrindo 28 arquivos estáticos. O CRUD foi exercitado em uma
cópia local isolada, com os mesmos componentes da aplicação e publicação desativada.
Nenhum produto, categoria ou preço do Supabase foi alterado nesta sessão.

Isso não equivale à aprovação completa do fluxo autenticado: no navegador acessível
à automação, o painel continuou mostrando o formulário de login, mesmo após as
confirmações de entrada. Não foram utilizados e-mail, senha ou tokens do gestor.

## Problemas corrigidos

| Problema | Correção | Regressão manual |
| --- | --- | --- |
| Categoria com nome contendo somente espaços não salva e não explica o motivo | Mensagem de erro dentro do formulário | Nome com três espaços mostra “Informe o nome da categoria” |
| Erro de persistência pode aparecer atrás do diálogo, fora da área acessível | Mensagem fixa na área visível do diálogo, sem fechar nem perder os campos | Persistência retornando falha simulada: diálogo continua aberto, dados preenchidos e alerta visível mesmo com o formulário rolado até o fim |

As entradas administrativas receberam uma nova versão de URL dos módulos alterados
para evitar que o navegador reutilize a implementação anterior.

## Verificações realizadas

| Área | Evidência | Resultado |
| --- | --- | --- |
| Cliente publicado | 320, 390, 768 e 1440 px, quatro produtos, imagens carregadas | Passou, sem transbordamento horizontal |
| Separação cliente/gestor | Nenhum link para administração no cardápio; entrada administrativa exige login | Passou |
| Navegação | Links de categorias, prévia e retorno à edição | Passou |
| CRUD local | Criar categoria e produto, buscar, editar nome/preço, mover produto de categoria | Passou |
| Persistência local | Produto de teste permanece após recarregar | Passou |
| Exclusões locais | Cancelar preserva produto; confirmar remove produto/categoria de teste | Passou |
| Preços e dados | Zero, centavos, milhares; rejeição de preço negativo, campo vazio e IDs duplicados | Passou |
| Texto não confiável | Nome contendo `<script>` aparece como texto, sem execução | Passou |
| Fotos | Preparação real de JPEG em WebP (1600 × 533, 91.332 bytes) | Passou no Chrome |
| Foto corrompida | Assinatura PNG sem imagem decodificável | Recusada com mensagem |
| Validação de arquivos | MIME incompatível, formato inválido, vazio, acima de 10 MB | Passou nos testes automatizados |
| Publicação simulada | Revisão, conflito, falta de permissão e erro de serviço | Passou nos testes automatizados |
| Serviço real | Leitura pública e validação dos dados do Supabase | Passou |
| Privacidade | Consulta pública de `owner_id` bloqueada | Passou |
| Hospedagem | Cabeçalhos de segurança, noindex do admin, MIME de módulos e páginas | Passou |
| Arquivos internos | SQL, seed, testes, `.git/config`, `.env` e fixture QA retornam 404 no site | Passou |

## Como repetir

Node.js é opcional para estas verificações de desenvolvimento. Não é necessário
instalá-lo para o restaurante usar o site.

```powershell
node --test tests/*.test.mjs
node scripts/prepare-site.mjs
node scripts/qa-live.mjs https://brasa-e-pao-cardapio-luis.netlify.app/
```

O teste `qa-live.mjs` só faz leituras. Não autentica gestores, publica versões nem
envia ou exclui fotos. Não imprime a chave pública ou conteúdo do cardápio.

## Pendências antes de uma entrega comercial

- Entrar como gestor no ambiente de produção, editar um rascunho e comprovar que o cliente ainda vê a versão anterior.
- Publicar uma alteração controlada, verificar a atualização no cliente e restaurar o conteúdo pelo próprio painel.
- Enviar uma foto real autenticada ao bucket e conferir sua leitura sem login.
- Testar sessão expirada, conta sem permissão e dois gestores/abas publicando a mesma revisão no banco real.
- Testar falha de rede e recuperação no aparelho do restaurante.
- Validar Safari/iPhone e Chrome/Android reais. O teste por largura no Chrome não reproduz o motor de um iPhone.

Os testes automatizados de autorização e upload usam clientes simulados. A revisão
do SQL é complementar e não substitui as verificações de RLS no banco real.
Fotos de testes reais devem ser identificadas e removidas pelo responsável do
Supabase apenas quando não estiverem mais referenciadas no cardápio.

## Evidências locais

- `.deploy/qa-publico-mobile.jpg`: cardápio publicado em largura mobile.
- `.deploy/qa-erro-salvamento.jpg`: mensagem de falha simulada dentro do diálogo.

As páginas `qa-*.html` são fixtures locais ignoradas pelo Git. A preparação de
publicação usa uma lista explícita de arquivos e não as inclui no site.
