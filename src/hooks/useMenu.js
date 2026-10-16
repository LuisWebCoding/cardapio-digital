import { useState } from 'react';
import { clone, validateMenu } from '../lib/menu.js?v=20261016-photos';

// A pasta identifica cada instalação, preservando o rascunho da versão anterior.
const directory = new URL('./', location.href).pathname;
const baseStorageKey = 'cardapio:rascunho:v1:' + directory;

export function useMenu(published, namespace = '') {
  const storageKey = namespace ? baseStorageKey + ':' + namespace : baseStorageKey;
  const [initial] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
        ?? (namespace ? null : localStorage.getItem('cardapio:rascunho:v1:' + directory + 'index.html'));
      return { menu: saved ? validateMenu(JSON.parse(saved)) : clone(published), warning: '' };
    } catch {
      return { menu: clone(published), warning: 'Não foi possível recuperar suas alterações. A última versão publicada foi carregada.' };
    }
  });
  const [menu, setMenu] = useState(initial.menu);
  const [message, setMessage] = useState(initial.warning);
  function commit(next) {
    try {
      const valid = validateMenu(next);
      // Não altera o estado se a gravação falhar, evitando um falso "salvo".
      localStorage.setItem(storageKey, JSON.stringify(valid));
      setMenu(valid);
      setMessage('Alterações salvas. Clique em Publicar cardápio para atualizar o cardápio dos clientes.');
      return true;
    } catch (error) {
      setMessage(error.name === 'QuotaExceededError'
        ? 'Não foi possível guardar suas alterações neste navegador. Libere espaço e tente novamente.'
        : 'Não foi possível salvar: ' + error.message);
      return false;
    }
  }
  return { menu, commit, message, setMessage };
}
