// Regras de dados independentes dos componentes e da persistência.
export const clone = value => JSON.parse(JSON.stringify(value));
export const newId = () => crypto.randomUUID();
export const formatPrice = value => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL'
}).format(value);
export function priceToNumber(value) {
  return Number(String(value).replace(/[R$\s.]/g, '').replace(',', '.'));
}

export function safeImage(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const path = value.trim();
  if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(path)) return path;
  // Apenas caminhos relativos ou HTTP(S); nunca javascript: ou SVG embutido.
  try {
    const url = new URL(path, 'https://menu.invalid/');
    return ['https:', 'http:'].includes(url.protocol) ? path : '';
  } catch { return ''; }
}

function text(value, name, max = 300, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw new Error('Revise o campo ' + name + '.');
  }
  return value.trim();
}

export function validateMenu(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.categorias)) {
    throw new Error('Arquivo inválido: informe um cardápio com categorias.');
  }
  if (!/^#[a-f0-9]{6}$/i.test(input.corPrincipal)) throw new Error('A cor deve usar o formato #B83D24.');
  const image = value => {
    const path = text(value ?? '', 'imagem', 1000000);
    if (path && !safeImage(path)) throw new Error('Use um caminho de imagem ou endereço HTTP(S) válido.');
    return path;
  };
  const seen = new Set();
  const id = value => {
    const result = text(value, 'identificador', 100, true);
    if (seen.has(result)) throw new Error('Há identificadores repetidos no cardápio.');
    seen.add(result);
    return result;
  };
  return {
    nome: text(input.nome, 'nome do restaurante', 100, true),
    subtitulo: text(input.subtitulo ?? '', 'subtítulo'),
    logo: image(input.logo), banner: image(input.banner), corPrincipal: input.corPrincipal,
    categorias: input.categorias.map(category => ({
      id: id(category.id), nome: text(category.nome, 'nome da categoria', 80, true),
      itens: (Array.isArray(category.itens) ? category.itens : (() => { throw new Error('Lista de produtos inválida.'); })()).map(item => {
        if (!/^R\$\s\d{1,3}(\.\d{3})*,\d{2}$/.test(item.preco) || !Number.isFinite(priceToNumber(item.preco))) {
          throw new Error('Preço inválido. Use, por exemplo, R$ 25,00.');
        }
        return {
          id: id(item.id), nome: text(item.nome, 'nome do produto', 100, true),
          descricao: text(item.descricao ?? '', 'descrição', 500),
          preco: item.preco, imagem: image(item.imagem),
          ...(item.destaque ? { destaque: text(item.destaque, 'destaque', 40) } : {})
        };
      })
    }))
  };
}

export function saveItem(menu, item, categoryId) {
  const next = clone(menu);
  const originalIndex = next.categorias.find(c => c.id === categoryId)?.itens.findIndex(i => i.id === item.id) ?? -1;
  // Remove o item da categoria anterior ao mover ou atualizar.
  next.categorias.forEach(c => { c.itens = c.itens.filter(i => i.id !== item.id); });
  const target = next.categorias.find(c => c.id === categoryId);
  if (!target) throw new Error('Escolha uma categoria existente.');
  if (originalIndex >= 0) target.itens.splice(originalIndex, 0, item);
  else target.itens.push(item);
  return validateMenu(next);
}

export function download(name, contents, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function brandText(color) {
  const [r, g, b] = color.slice(1).match(/../g).map(hex => {
    const n = parseInt(hex, 16) / 255;
    return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
  });
  return r * .2126 + g * .7152 + b * .0722 > .179 ? '#000' : '#fff';
}
