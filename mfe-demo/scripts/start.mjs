// Ver la POC en local: compila el MFE y sirve el shell con un manifiesto que apunta a la versión actual.
import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { extname } from 'node:path';

execSync('node scripts/build.mjs', { cwd: new URL('../', import.meta.url), stdio: 'inherit' });

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const manifiesto = { mfes: { demo: { version, url: `mfe/demo/${version}/app.js` } } };
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const puerto = Number(process.env.PUERTO ?? 4173);

createServer(async (peticion, respuesta) => {
  const ruta = new URL(peticion.url, 'http://x').pathname;
  let archivo;
  if (ruta === '/manifiesto.json') {
    respuesta.writeHead(200, { 'Content-Type': 'application/json' });
    return respuesta.end(JSON.stringify(manifiesto));
  }
  if (ruta.startsWith('/shell/')) archivo = new URL(`../../shell-demo/${ruta.slice(7) || 'index.html'}`, import.meta.url);
  if (ruta.startsWith(`/mfe/demo/${version}/`)) archivo = new URL(`../dist/${ruta.split('/').pop()}`, import.meta.url);
  try {
    const contenido = await readFile(archivo);
    respuesta.writeHead(200, { 'Content-Type': tipos[extname(archivo.pathname)] ?? 'text/plain' });
    respuesta.end(contenido);
  } catch {
    respuesta.writeHead(404).end('No encontrado');
  }
}).listen(puerto, () => console.log(`Abre http://localhost:${puerto}/shell/ y pulsa "Montar MFE"`));
