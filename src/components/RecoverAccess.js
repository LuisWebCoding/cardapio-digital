import { createElement as h, useState } from 'react';
import { Field } from './Fields.js?v=20261028-gastro';
import { requestPasswordReset, updateRecoveredPassword } from '../services/access.js?v=20261028-gastro';

export function ForgotPassword({ client, onBack }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', error: false });
  return h('main', { className: 'auth-screen' },
    h('form', { className: 'panel form-stack auth-card', onSubmit: async event => {
      event.preventDefault();
      if (busy) return;
      setBusy(true); setFeedback({ text: '', error: false });
      try {
        await requestPasswordReset(client, email, location.href);
        setFeedback({ text: 'Se houver uma conta cadastrada com este e-mail, você receberá um link para criar uma nova senha. Confira também a caixa de spam.', error: false });
      } catch (error) { setFeedback({ text: error.message, error: true }); }
      finally { setBusy(false); }
    } },
      h('div', null, h('p', { className: 'eyebrow' }, 'Acesso do gestor'), h('h1', null, 'Recuperar acesso'),
        h('p', { className: 'muted' }, 'Informe o e-mail usado para entrar no painel.')),
      h(Field, { label: 'E-mail', type: 'email', required: true, autoComplete: 'username', maxLength: 254,
        disabled: busy, value: email, onChange: event => setEmail(event.target.value) }),
      feedback.text && h('p', { role: feedback.error ? 'alert' : 'status', className: feedback.error ? 'error' : 'muted' }, feedback.text),
      h('button', { className: 'button primary', disabled: busy }, busy ? 'Enviando link…' : 'Enviar link de recuperação'),
      h('button', { type: 'button', className: 'button secondary', disabled: busy, onClick: onBack }, 'Voltar ao login')));
}

export function ResetPassword({ client, onDone }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return h('main', { className: 'auth-screen' }, h('form', { className: 'panel form-stack auth-card', onSubmit: async event => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      await updateRecoveredPassword(client, password, confirmation);
      setPassword(''); setConfirmation(''); onDone();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  } },
    h('div', null, h('p', { className: 'eyebrow' }, 'Acesso do gestor'), h('h1', null, 'Crie sua nova senha'),
      h('p', { className: 'muted' }, 'Use pelo menos 8 caracteres e guarde sua senha em um local seguro.')),
    h(Field, { label: 'Nova senha', type: 'password', minLength: 8, required: true, autoComplete: 'new-password',
      value: password, disabled: busy, onChange: event => setPassword(event.target.value) }),
    h(Field, { label: 'Confirme a nova senha', type: 'password', minLength: 8, required: true, autoComplete: 'new-password',
      value: confirmation, disabled: busy, onChange: event => setConfirmation(event.target.value) }),
    error && h('p', { className: 'error', role: 'alert' }, error),
    h('button', { className: 'button primary', disabled: busy }, busy ? 'Salvando senha…' : 'Salvar nova senha'),
    h('button', { type: 'button', className: 'button secondary', disabled: busy, onClick: async () => {
      try { const result = await client.auth.signOut(); if (result.error) throw result.error; }
      catch { setError('Não foi possível sair. Confira a conexão e tente novamente.'); }
    } }, 'Voltar ao login')));
}
