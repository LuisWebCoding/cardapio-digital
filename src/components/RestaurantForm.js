import { createElement as h, useState } from 'react';
import { Field, ImageField } from './Fields.js?v=20261028-gastro';

export function RestaurantForm({ menu, onSave }) {
  const [form, setForm] = useState(() => ({ ...menu }));
  const [uploads, setUploads] = useState({ logo: false, banner: false });
  const uploading = uploads.logo || uploads.banner;
  const change = key => event => setForm({ ...form, [key]: event.target.value });
  return h('form', { className: 'panel form-stack', onSubmit: e => {
    e.preventDefault();
    if (uploading) return;
    onSave({ ...menu, nome: form.nome.trim(), subtitulo: form.subtitulo.trim(), logo: form.logo, banner: form.banner, corPrincipal: form.corPrincipal });
  }},
    h('div', null, h('h2', null, 'Identidade do restaurante'), h('p', { className: 'muted' }, 'Personalize a marca aplicada ao cardápio.')),
    h(Field, { label: 'Nome do restaurante', required: true, maxLength: 100, value: form.nome, onChange: change('nome') }),
    h(Field, { label: 'Subtítulo', maxLength: 300, value: form.subtitulo, onChange: change('subtitulo') }),
    h(Field, { label: 'Cor principal', type: 'color', value: form.corPrincipal, onChange: change('corPrincipal') }),
    h(ImageField, { label: 'Logo', value: form.logo,
      onBusyChange: busy => setUploads(previous => ({ ...previous, logo: busy })),
      onChange: logo => setForm(previous => ({ ...previous, logo })) }),
    h(ImageField, { label: 'Banner', value: form.banner,
      onBusyChange: busy => setUploads(previous => ({ ...previous, banner: busy })),
      onChange: banner => setForm(previous => ({ ...previous, banner })) }),
    h('div', { className: 'form-actions' }, h('button', { className: 'button primary', disabled: uploading }, uploading ? 'Aguarde o envio das fotos…' : 'Salvar identidade'))
  );
}
