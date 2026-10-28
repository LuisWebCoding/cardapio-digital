import { createElement as h, useState } from 'react';
import { Field } from './Fields.js?v=20261028-gastro';
import { ForgotPassword } from './RecoverAccess.js?v=20261028-gastro';

export function Login({ client }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      setPassword('');
    } catch {
      setError('Não foi possível entrar. Confira seu e-mail, sua senha e a conexão.');
    } finally { setBusy(false); }
  }
  if (forgot) return h(ForgotPassword, { client, onBack: () => setForgot(false) });
  return h('main', { className: 'auth-screen' },
    h('form', { className: 'panel form-stack auth-card', onSubmit: submit },
      h('div', null, h('p', { className: 'eyebrow' }, 'Acesso do gestor'),
        h('h1', null, 'Entre no seu restaurante'),
        h('p', { className: 'muted' }, 'Gerencie o cardápio e publique as novidades para seus clientes.')),
      h(Field, { label: 'E-mail', type: 'email', autoComplete: 'username', required: true,
        value: email, disabled: busy, onChange: e => setEmail(e.target.value) }),
      h(Field, { label: 'Senha', type: 'password', autoComplete: 'current-password', required: true,
        value: password, disabled: busy, onChange: e => setPassword(e.target.value) }),
      error && h('p', { role: 'alert', className: 'error' }, error),
      h('button', { className: 'button primary', disabled: busy }, busy ? 'Entrando…' : 'Entrar'),
      h('button', { type: 'button', className: 'button text-button', disabled: busy,
        onClick: () => { setPassword(''); setForgot(true); } }, 'Esqueci minha senha'),
      h('p', { className: 'muted' }, 'Use a conta de gestor cadastrada na entrega.'),
      h('a', { href: './', className: 'text-link' }, 'Abrir cardápio do cliente')));
}
