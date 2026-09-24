const VERSION = '__VERSION__';
const NOVEDAD = 'Primera versión publicada.';

let nodoActual = null;
let temporizadorReloj = null;

function crearElemento(etiqueta, texto) {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  return elemento;
}

export function mount(nodo, contexto) {
  nodoActual = nodo;

  const estilos = document.createElement('style');
  estilos.textContent = `
    .mfe-demo { border: 2px solid #2e7d32; border-radius: 8px; padding: 16px; font-family: sans-serif; }
    .mfe-demo h2 { margin: 0 0 8px; color: #2e7d32; }
    .mfe-demo .mfe-demo-version { font-size: 2rem; font-weight: bold; }
  `;

  const tarjeta = document.createElement('section');
  tarjeta.className = 'mfe-demo';
  tarjeta.append(
    crearElemento('h2', 'MFE demo'),
    crearElemento('p', `v${VERSION}`),
    crearElemento('p', NOVEDAD),
    crearElemento('p', `Contexto recibido del shell: ${contexto.usuario.nombre} · rol ${contexto.rolActivo} · idioma ${contexto.idioma}`),
  );
  tarjeta.children[1].className = 'mfe-demo-version';

  const reloj = crearElemento('p', '');
  tarjeta.append(reloj);
  const momentoMontaje = Date.now();
  temporizadorReloj = setInterval(() => {
    const segundosMontado = Math.round((Date.now() - momentoMontaje) / 1000);
    reloj.textContent = `Montado hace ${segundosMontado} s`;
  }, 1000);

  nodo.replaceChildren(estilos, tarjeta);
}

export function unmount() {
  clearInterval(temporizadorReloj);
  temporizadorReloj = null;
  if (nodoActual) {
    nodoActual.replaceChildren();
    nodoActual = null;
  }
}
