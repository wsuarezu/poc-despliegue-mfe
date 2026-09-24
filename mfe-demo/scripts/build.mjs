import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';

const paquete = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const carpetaSalida = new URL('../dist/', import.meta.url);

await rm(carpetaSalida, { recursive: true, force: true });
await mkdir(carpetaSalida, { recursive: true });

const codigoFuente = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
await writeFile(new URL('app.js', carpetaSalida), codigoFuente.replaceAll('__VERSION__', paquete.version));

const descriptor = {
  nombre: paquete.name,
  version: paquete.version,
  entrada: 'app.js',
  contrato: 'v1',
  compilado: new Date().toISOString(),
};
await writeFile(new URL('descriptor.json', carpetaSalida), JSON.stringify(descriptor, null, 2));

console.log(`Compilado ${paquete.name}@${paquete.version}`);
