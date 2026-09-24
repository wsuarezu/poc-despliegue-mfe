# POC · Despliegue independiente de un MFE con manifiesto

Prueba de concepto de juguete: **no contiene código, datos ni secretos del ERP**. Sirve para ver en vivo cómo se publica, se libera y se revierte un microfrontend sin tocar el shell.

## Qué hay en el repo

```
poc-despliegue-mfe/
├─ mfe-demo/                     ← el MFE (tu "proyecto de desarrollo")
│  ├─ package.json               ← la VERSIÓN vive aquí
│  ├─ src/app.js                 ← exporta mount() y unmount()
│  └─ scripts/build.mjs          ← build: genera dist/app.js + dist/descriptor.json
├─ shell-demo/                   ← el shell: lee el manifiesto y monta el MFE
│  ├─ index.html
│  └─ shell.js
└─ .github/workflows/
   ├─ publicar-shell.yml         ← publica el shell (solo si cambia shell-demo/)
   ├─ publicar-mfe.yml           ← DESPLEGAR: al crear una etiqueta vX.Y.Z
   └─ liberar.yml                ← LIBERAR o REVERTIR: botón manual con la versión
```

## Equivalencias con el ERP

| En la POC | En un servidor como el del ERP |
|---|---|
| Rama `gh-pages` + GitHub Pages | Carpeta `/srv/mfe/` servida por nginx |
| `peaceiris/actions-gh-pages` | `rsync`/`scp` desde el pipeline al servidor |
| GitHub Actions | Bitbucket Pipelines |
| `manifiesto.json` | Igual, pero con otra extensión o una excepción en nginx, porque hoy nginx deniega `.json` |
| ~1 minuto hasta que Pages refleja un cambio | Instantáneo al cambiar el archivo |

---

## Paso 0 · Preparar el repo (una sola vez)

1. En GitHub, crea un repo **público** llamado `poc-despliegue-mfe`. Tiene que ser público porque GitHub Pages gratis solo funciona en repos públicos.
2. Copia **todo el contenido** de esta carpeta al repo y súbelo:
   ```bash
   git init
   git add .
   git commit -m "POC despliegue MFE"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/poc-despliegue-mfe.git
   git push -u origin main
   ```
3. En la pestaña **Actions**, el workflow **Publicar shell** se ejecuta solo y crea la rama `gh-pages`. Espera a que termine en verde.
4. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `gh-pages`, carpeta `/ (root)`. Guarda.
5. Abre `https://TU-USUARIO.github.io/poc-despliegue-mfe/shell/`. Pages puede tardar 1 o 2 minutos la primera vez.
   Al pulsar **Montar MFE** debe decir *"No se encontró el manifiesto"*. **Es correcto**: todavía no se liberó nada, y el shell no se cae por eso.

> Si algún workflow falla con un error de permisos al hacer push: **Settings → Actions → General → Workflow permissions → Read and write permissions**.

---

## ① Publicar la v1.0.0

```bash
git tag v1.0.0
git push origin v1.0.0
```

- En **Actions** corre **Publicar MFE (desplegar)**. Al terminar, el resumen dice *"Desplegada, pero nadie la usa todavía"*.
- Ahora **Actions → Liberar versión → Run workflow**, con versión `1.0.0`.
- Espera ~1 minuto y en el shell pulsa **Montar MFE**.

✅ **Debes ver:** "MFE demo · v1.0.0", el contexto que le pasó el shell y el manifiesto en pantalla.

## ② Publicar la v1.1.0 sin tocar el shell

1. En `mfe-demo/src/app.js`, cambia `NOVEDAD` por otro texto, por ejemplo `'Segunda versión: cambié el texto.'`.
2. En `mfe-demo/package.json`, cambia `"version"` a `"1.1.0"`.
3. Sube el cambio y la etiqueta:
   ```bash
   git commit -am "mfe-demo 1.1.0"
   git push
   git tag v1.1.0
   git push origin v1.1.0
   ```
4. **Liberar versión** con `1.1.0`. Espera ~1 minuto y en el shell pulsa **Montar MFE**.

✅ **Debes ver:** v1.1.0 con el texto nuevo.
✅ **Comprueba en Actions:** **Publicar shell** NO se ejecutó. El shell no se tocó.

## ③ Desplegar la v1.2.0 SIN liberarla

1. Cambia `NOVEDAD` otra vez y la versión a `1.2.0`, haz commit y push, y luego la etiqueta `v1.2.0`.
2. **No ejecutes Liberar.**
3. Abre directamente `https://TU-USUARIO.github.io/poc-despliegue-mfe/mfe/demo/1.2.0/descriptor.json`.

✅ **Debes ver:** el descriptor de la 1.2.0. **Los archivos están en el servidor.**
✅ **En el shell:** sigue mostrando la v1.1.0. **Desplegar ≠ liberar.**

## ④ Liberar la v1.2.0

**Liberar versión** con `1.2.0`. Espera ~1 minuto y pulsa Montar.

✅ **Debes ver:** v1.2.0. En Actions, ese workflow **no compiló nada**: solo cambió el manifiesto.

## ⑤ Revertir a la v1.1.0

"Algo salió mal en la 1.2.0". Ejecuta **Liberar versión** con `1.1.0`.

✅ **Debes ver:** el shell vuelve a v1.1.0. **Anota cuánto tardó el workflow**: sin compilar, suelen ser segundos. A eso se suma el minuto de Pages, que en un nginx propio no existe.
✅ **Comprueba:** la carpeta `mfe/demo/1.2.0/` **sigue existiendo**. Revertir no borra nada; si se corrige el problema, se puede volver a liberar.

---

## Pruebas extra (las protecciones)

| Prueba | Cómo | Resultado esperado |
|---|---|---|
| **⑥ Etiqueta que no coincide con package.json** | `git tag v1.3.0` sin cambiar `package.json` (que sigue en 1.2.0) | ❌ El pipeline falla: *"La etiqueta no coincide"*. El descriptor y la versión nunca se desalinean |
| **⑦ Liberar una versión que no existe** | **Liberar versión** con `9.9.9` | ❌ Falla y lista las versiones disponibles. No se puede apuntar el manifiesto a algo que no está desplegado |
| **⑧ Contrato: montar y desmontar** | En el shell, **Montar** y luego **Desmontar**, varias veces | El reloj "Montado hace X s" se reinicia en cada montaje. `unmount()` limpia su temporizador (regla 2 del contrato) |

## Qué observar y anotar

| Pregunta | Tu respuesta |
|---|---|
| ¿Cuánto tardó *Publicar MFE* (compila y sube)? | |
| ¿Cuánto tardó *Liberar versión* (solo el manifiesto)? | |
| ¿En algún momento hubo que tocar `shell-demo/`? | |
| ¿Qué versiones quedan en `mfe/demo/` al final? | |
| ¿Qué pasó con el shell cuando no había manifiesto? | |
