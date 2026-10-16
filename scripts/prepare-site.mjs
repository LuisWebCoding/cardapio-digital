// Apenas copia os arquivos estáticos. Não compila código nem instala pacotes.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(root, 'dist');
if (path.dirname(destination) !== path.resolve(root) || path.basename(destination) !== 'dist') {
  throw new Error('Diretório de publicação inválido.');
}
const settingsText = await fs.readFile(path.join(root, 'cloud-config.js'), 'utf8');
const settings = vm.runInNewContext(settingsText + '; JSON.stringify(NUVEM)', {}, { timeout: 1000 });
const parsed = JSON.parse(settings);
let legacyRole = '';
try { legacyRole = JSON.parse(Buffer.from(parsed.chavePublica.split('.')[1], 'base64url').toString()).role; } catch {}
if (parsed.chavePublica && !parsed.chavePublica.startsWith('sb_publishable_') && legacyRole !== 'anon') {
  throw new Error('A configuração contém uma chave não publicável. Publicação interrompida.');
}

await fs.mkdir(destination, { recursive: true });
for (const name of ['index.html', 'admin.html', 'config.js', 'cloud-config.js', 'src', 'imagens']) {
  await fs.cp(path.join(root, name), path.join(destination, name), { recursive: true });
}
await fs.copyFile(path.join(root, 'public-headers'), path.join(destination, '_headers'));
await fs.writeFile(path.join(destination, '_redirects'), '/admin /admin.html 302\n');
console.log('Site estático preparado em dist/. Configuração verificada; nenhuma chave secreta publicada.');
