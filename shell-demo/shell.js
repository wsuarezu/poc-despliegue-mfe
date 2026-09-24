const raizSitio = new URL('../', window.location.href);
const nodoMfe = document.getElementById('zona-mfe');
const estado = document.getElementById('estado');
const vistaManifiesto = document.getElementById('vista-manifiesto');

const contextoShell = {
  usuario: { id: 1, nombre: 'Usuaria de prueba' },
  rolActivo: '0011',
  idioma: 'es',
};

let mfeMontado = null;

async function leerManifiesto() {
  const direccion = new URL('manifiesto.json', raizSitio);
  direccion.searchParams.set('sinCache', Date.now());
  const respuesta = await fetch(direccion, { cache: 'no-store' });
  if (!respuesta.ok) {
    throw new Error(`No se encontró el manifiesto (HTTP ${respuesta.status}). ¿Ya se ejecutó "Liberar versión"?`);
  }
  return respuesta.json();
}

function desmontarMfe() {
  if (mfeMontado) {
    mfeMontado.unmount();
    mfeMontado = null;
  }
  estado.textContent = 'Sin módulo montado';
}

async function montarMfe() {
  desmontarMfe();
  estado.textContent = 'Leyendo manifiesto…';
  try {
    const manifiesto = await leerManifiesto();
    vistaManifiesto.textContent = JSON.stringify(manifiesto, null, 2);

    const entrada = manifiesto.mfes?.demo;
    if (!entrada) {
      throw new Error('El manifiesto no declara el MFE "demo".');
    }

    const modulo = await import(new URL(entrada.url, raizSitio).href);
    modulo.mount(nodoMfe, contextoShell);
    mfeMontado = modulo;
    estado.textContent = `Montado: demo v${entrada.version}`;
  } catch (error) {
    nodoMfe.textContent = 'El módulo no está disponible. El shell sigue funcionando.';
    estado.textContent = `Error: ${error.message}`;
  }
}

document.getElementById('boton-montar').addEventListener('click', montarMfe);
document.getElementById('boton-desmontar').addEventListener('click', desmontarMfe);
