import { useState, useEffect } from 'react';
import { cloudEnabled, readPublished } from '../services/cloud.js?v=20261016-photos';

export function usePublishedMenu(fallback) {
  const [state, setState] = useState({
    menu: cloudEnabled ? null : fallback, loading: cloudEnabled, error: ''
  });
  useEffect(() => {
    if (!cloudEnabled) return;
    let active = true;
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const record = await readPublished();
        if (active) setState({ menu: record.menu, loading: false, error: '' });
      } catch {
        if (active) setState(previous => ({ ...previous, loading: false,
          error: previous.menu
            ? 'Não foi possível atualizar agora. Confirme preços e disponibilidade com nossa equipe.'
            : 'Cardápio online temporariamente indisponível. Consulte nossa equipe.' }));
      } finally { pending = false; }
    }
    refresh();
    const interval = setInterval(() => { if (!document.hidden) refresh(); }, 30000);
    const focus = () => refresh();
    addEventListener('focus', focus);
    return () => { active = false; clearInterval(interval); removeEventListener('focus', focus); };
  }, []);
  return state;
}
