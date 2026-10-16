-- Troque o UUID abaixo pelo UUID do gestor criado em Authentication.
-- Execute apenas ap?s schema.sql.
insert into public.restaurant_menus (id, owner_id, data) values (
  'brasa-e-pao',
  '00000000-0000-0000-0000-000000000000'::uuid,
  '{"nome":"Brasa & Pão","subtitulo":"Feito na brasa, servido com carinho.","logo":"imagens/logo.png","banner":"imagens/banner.jpg","corPrincipal":"#B83D24","categorias":[{"id":"hamburgueres","nome":"Hambúrgueres","itens":[{"id":"classico","nome":"Clássico da Casa","descricao":"Pão brioche, hambúrguer de 160 g, queijo cheddar, alface, tomate e molho da casa.","preco":"R$ 25,00","imagem":"imagens/hamburguer-classico.jpg","destaque":"Mais Pedido"},{"id":"bacon","nome":"Bacon na Brasa","descricao":"Pão brioche, hambúrguer de 160 g, queijo, bacon crocante e cebola caramelizada.","preco":"R$ 32,00","imagem":"imagens/hamburguer-bacon.jpg"}]},{"id":"bebidas","nome":"Bebidas","itens":[{"id":"limonada","nome":"Limonada da Casa","descricao":"Limão espremido na hora, água e gelo. Copo de 400 ml.","preco":"R$ 10,00","imagem":"imagens/limonada.jpg","destaque":"Refrescante"},{"id":"refrigerante","nome":"Refrigerante","descricao":"Lata de 350 ml. Consulte os sabores disponíveis com nossa equipe.","preco":"R$ 6,00","imagem":"imagens/refrigerante.jpg"}]}]}'::jsonb
) on conflict (id) do nothing;
