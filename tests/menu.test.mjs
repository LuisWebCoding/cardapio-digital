import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { clone, validateMenu, saveItem, formatPrice, priceToNumber, safeImage, brandText } from '../src/lib/menu.js';

const example = JSON.parse(vm.runInNewContext(
  fs.readFileSync(new URL('../config.js', import.meta.url), 'utf8') + '; JSON.stringify(RESTAURANTE)'
));

test('editar produto preserva posição, demais itens e dados originais', () => {
  const before = clone(example);
  const category = before.categorias[0];
  const item = { ...category.itens[0], nome: 'Nome atualizado', preco: 'R$ 29,90' };
  const updated = saveItem(example, item, category.id);
  assert.deepEqual(example, before);
  assert.deepEqual(updated.categorias[0].itens[0], item);
  assert.deepEqual(updated.categorias[0].itens.slice(1), category.itens.slice(1));
});

test('mover produto entre categorias não duplica nem perde registros', () => {
  const item = example.categorias[0].itens[0];
  const result = saveItem(example, item, example.categorias[1].id);
  assert.equal(result.categorias.flatMap(c => c.itens).filter(i => i.id === item.id).length, 1);
  assert.equal(result.categorias[0].itens.some(i => i.id === item.id), false);
  assert.equal(result.categorias[1].itens.at(-1).id, item.id);
  assert.equal(result.categorias.flatMap(c => c.itens).length, example.categorias.flatMap(c => c.itens).length);
});

test('novo produto exige categoria existente e não modifica o original em falha', () => {
  const before = clone(example);
  const item = { ...example.categorias[0].itens[0], id: 'qa-novo' };
  assert.throws(() => saveItem(example, item, 'inexistente'), /categoria existente/);
  assert.deepEqual(example, before);
  const result = saveItem(example, item, example.categorias[0].id);
  assert.equal(result.categorias[0].itens.at(-1).id, 'qa-novo');
});

test('rejeita identificadores duplicados, campos inválidos e preços negativos', () => {
  const bad = clone(example);
  bad.categorias[1].itens[0].id = bad.categorias[0].itens[0].id;
  assert.throws(() => validateMenu(bad), /identificadores repetidos/);
  for (const preco of ['R$ -1,00', '25', 'R$ NaN', 'R$ 25,001', 'R$ 1.00']) {
    const menu = clone(example);
    menu.categorias[0].itens[0].preco = preco;
    assert.throws(() => validateMenu(menu), /Preço inválido/);
  }
  assert.throws(() => validateMenu({ ...example, nome: '   ' }), /nome do restaurante/);
  assert.throws(() => validateMenu({ ...example, corPrincipal: 'red' }), /cor/);
});

test('aceita cardápio vazio, campos opcionais vazios e preços em BRL', () => {
  assert.equal(validateMenu({ ...example, categorias: [] }).categorias.length, 0);
  const menu = clone(example);
  menu.categorias[0].itens[0].imagem = '';
  delete menu.categorias[0].itens[0].destaque;
  assert.equal(validateMenu(menu).categorias[0].itens[0].imagem, '');
  for (const number of [0, 0.01, 25.90, 999.99, 1000, 999999.99]) {
    const formatted = formatPrice(number);
    assert.equal(priceToNumber(formatted), number);
    menu.categorias[0].itens[0].preco = formatted;
    assert.doesNotThrow(() => validateMenu(menu));
  }
});

test('bloqueia protocolos executáveis e escolhe contraste para cores claras e escuras', () => {
  for (const path of ['javascript:alert(1)', 'file:///C:/foto.jpg', 'data:image/svg+xml,<svg/>', 'vbscript:test']) {
    assert.equal(safeImage(path), '');
  }
  assert.equal(safeImage('imagens/foto.jpg'), 'imagens/foto.jpg');
  assert.equal(safeImage('https://example.com/foto.jpg'), 'https://example.com/foto.jpg');
  assert.equal(brandText('#ffffff'), '#000');
  assert.equal(brandText('#000000'), '#fff');
});
