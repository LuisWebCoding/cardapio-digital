import { createElement as h, useState, useId } from 'react';
import { Field, ImageField } from './Fields.js?v=20261016-photos';
import { newId, formatPrice, priceToNumber, safeImage } from '../lib/menu.js?v=20261016-photos';

export function ProductForm({ item, categories, categoryId, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    id: item?.id || newId(), nome: item?.nome || '', descricao: item?.descricao || '',
    preco: item ? priceToNumber(item.preco).toFixed(2) : '', imagem: item?.imagem || '',
    destaque: item?.destaque || '', categoryId: categoryId || categories[0]?.id || ''
  }));
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const selectId = useId();
  const change = key => event => setForm({ ...form, [key]: event.target.value });
  function submit(event) {
    event.preventDefault();
    if (uploading) return;
    if (!form.nome.trim() || !form.categoryId || !Number.isFinite(Number(form.preco)) || Number(form.preco) < 0 || form.preco === '') {
      setError('Informe nome, categoria e preço válido.'); return;
    }
    if (form.imagem && !safeImage(form.imagem)) { setError('Confira o caminho da imagem.'); return; }
    onSave({
      id: form.id, nome: form.nome.trim(), descricao: form.descricao.trim(),
      preco: formatPrice(Number(form.preco)), imagem: form.imagem.trim(),
      ...(form.destaque.trim() ? { destaque: form.destaque.trim() } : {})
    }, form.categoryId);
  }
  return h('form', { onSubmit: submit, className: 'form-stack' },
    h(Field, { label: 'Nome do produto', required: true, maxLength: 100, value: form.nome, onChange: change('nome') }),
    h('div', { className: 'field' }, h('label', { htmlFor: selectId }, 'Categoria'),
      h('select', { id: selectId, required: true, value: form.categoryId, onChange: change('categoryId') },
        categories.map(c => h('option', { key: c.id, value: c.id }, c.nome)))),
    h(Field, { label: 'Descrição', multiline: true, rows: 3, maxLength: 500, value: form.descricao, onChange: change('descricao') }),
    h('div', { className: 'form-grid' },
      h(Field, { label: 'Preço (R$)', type: 'number', min: 0, max: 999999.99, step: '.01', required: true, value: form.preco, onChange: change('preco') }),
      h(Field, { label: 'Destaque (opcional)', placeholder: 'Mais Pedido', maxLength: 40, value: form.destaque, onChange: change('destaque') })),
    h(ImageField, { label: 'Imagem do produto', value: form.imagem, onBusyChange: setUploading,
      onChange: imagem => setForm(previous => ({ ...previous, imagem })) }),
    error && h('p', { role: 'alert', className: 'error' }, error),
    h('div', { className: 'form-actions' },
      h('button', { type: 'button', className: 'button secondary', onClick: onCancel }, 'Cancelar'),
      h('button', { type: 'submit', className: 'button primary', disabled: uploading }, uploading ? 'Aguarde o envio da foto…' : 'Salvar produto')));
}
