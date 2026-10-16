import { useEffect } from 'react';
import { brandText } from '../lib/menu.js?v=20261016-photos';

export function useBrand(restaurant, suffix = 'Cardápio') {
  useEffect(() => {
    document.title = restaurant.nome + ' | ' + suffix;
    document.querySelector('meta[name="theme-color"]').content = restaurant.corPrincipal;
  }, [restaurant.nome, restaurant.corPrincipal, suffix]);
  return { '--brand': restaurant.corPrincipal, '--brand-text': brandText(restaurant.corPrincipal) };
}
