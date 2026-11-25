# Monatekeda — tienda en línea

SPA en **Vite + React + TypeScript** que consume la API pública `/api/store`.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # ajustar valores
npm run dev            # http://localhost:5173
npm run build          # genera dist/ (sitio estático)
```

## Configuración

La configuración de la tienda vive en **`public/config.js`** (se copia a `dist/config.js`). Se puede editar directamente en el servidor, sin volver a compilar:

| Clave | Descripción |
|---|---|
| `apiBaseUrl` | `https://monatekeda.app.noinventes.com/api/store` |
| `storeName`, `storeTagline` | Nombre y frase de la tienda |
| `whatsappNumber` | Número para pedidos, formato `51987654321`. Vacío = los botones de WhatsApp se ocultan o llevan a Contacto |
| `instagramUrl`, `facebookUrl`, `tiktokUrl` | Redes sociales. Vacío = el ícono se muestra sin enlace |

Las variables `VITE_*` de `.env` sirven de respaldo al compilar. Estos datos son temporales hasta que exista `GET /api/store/info`.

## Rutas

| Ruta | Página |
|---|---|
| `/` | Inicio: hero, categorías, top productos (carrusel 3D), materiales, restauración de platería, piezas disponibles |
| `/productos?q=&categoria=&tag=&min=&max=&orden=&page=` | Catálogo con filtros en la URL |
| `/producto/:slug?v=<variation_id>` | Detalle + variaciones (carga diferida) |
| `/qr/:code` | Resuelve QR impreso y redirige (códigos con `#` deben ir como `%23`) |
| `/carrito` | Carrito local + pedido por WhatsApp |
| `/nosotros`, `/contacto` | Páginas informativas |

## Estructura

```
src/
  api/              cliente HTTP, tipos y hooks de TanStack Query
  assets/editorial/ fotos generadas (cada una con su .json de procedencia)
  components/       Layout (cabecera, búsqueda, pie), ProductCard, TopProducts,
                    HeroExtras (cifras, redes), Ornaments (íconos), WhatsAppFab…
  lib/              formato de precios, variaciones, useReveal (animaciones)
  pages/            una por ruta
  store/            carrito (Zustand + localStorage)
DESIGN.md           sistema de diseño (colores, tipografía, componentes)
PRODUCT.md          contexto del negocio y del público
```

## Decisiones

- Se llama al subdominio del tenant **sin** header `X-Tenant` → sin preflight CORS (la API tiene `Max-Age: 0`).
- Las URLs usan el `slug`, nunca el `code` (muchos códigos llevan `#`).
- Categorías siempre con `include_descendants=1`; tags por `tag_id` (slug solo en la URL).
- Reintentos solo en red/429/5xx; 404 sin body = tienda deshabilitada.
- "Top productos" es una selección temporal (precio más alto y con foto) hasta que la API tenga un endpoint de ranking: solo hay que cambiar el `queryFn` de `useTopProducts`.
- El hero usa la foto de estudio + un recorte de sus productos (`hero-centro-cut.webp`) para que la palabra "monatekeda" quede detrás de las piezas. Si se cambia la foto, hay que regenerar el recorte.
- La portada hace 10 pedidos a la API al cargar (límite: 120/min por IP).

## GitHub Pages

Cada `git push` a `main` publica la tienda en **https://ekarones.github.io/monatekeda-tienda/** mediante `.github/workflows/pages.yml` (compila con `VITE_BASE=/<repositorio>/` y copia `index.html` como `404.html` para que funcionen rutas como `/productos`). El `config.js` publicado es el de `public/config.js` del repositorio.

## Deploy (cPanel)

1. Compilar y empaquetar: `npm run build` y luego `C:\Windows\System32\tar.exe -a -c -f deploy/monatekeda-tienda.zip -C dist .htaccess assets config.js index.html logo-blanco.png logo.png` (el tar de Windows; el de Git Bash no crea .zip)
2. cPanel → Administrador de archivos → `public_html` (o la carpeta del subdominio) → Cargar el zip → Extraer.
3. Activar "Mostrar archivos ocultos" y comprobar que está `.htaccess` (hace funcionar rutas como `/productos`).
4. Editar `config.js` en el servidor para poner el número de WhatsApp y las redes sociales (sin recompilar).

La tienda debe ir en la raíz de un dominio o subdominio (`RewriteBase /`).
