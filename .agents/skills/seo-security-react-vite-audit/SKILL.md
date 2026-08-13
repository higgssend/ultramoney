---
name: seo-security-react-vite-audit
description: Audita SEO, seguridad y buenas prácticas de una web en producción construida con React y Vite. Úsala cuando el usuario pida "auditar SEO", "revisar seguridad de mi web", "auditoría de mi sitio en producción", "checklist de buenas prácticas React/Vite", quiera un informe sobre meta tags, Core Web Vitals, cabeceras de seguridad, CSP, sourcemaps expuestos, vulnerabilidades de dependencias, bundle size, code splitting, o cualquier combinación de SEO + seguridad + performance sobre un dominio real ya desplegado. Dispara también ante URLs de producción acompañadas de peticiones de "revisar", "auditar", "analizar" o "dar feedback sobre" el sitio.
---

# Auditoría SEO + Seguridad + Buenas prácticas (React + Vite en producción)

Skill para auditar una web en producción (URL real, no localhost) construida con React y Vite, cubriendo tres pilares: **SEO**, **seguridad** y **buenas prácticas de build/arquitectura React/Vite**. Produce un informe accionable, priorizado por severidad/impacto.

## Cuándo usar esta skill

- El usuario da una URL de producción y pide auditoría, revisión o feedback técnico.
- Pide específicamente SEO, seguridad, cabeceras HTTP, CSP, Core Web Vitals, bundle size, o "buenas prácticas" de una app React/Vite ya desplegada.
- Si el usuario NO da URL, pídesela antes de avanzar (esta skill audita sitios en vivo vía HTTP, no código fuente local — si en cambio quiere auditar el repo/código fuente, puedes combinar ambos: pide también acceso al repo o a `vite.config.*`/`package.json`).

## Flujo de trabajo

1. **Recopilar contexto mínimo**: URL de producción, y si es posible, acceso al repositorio (para revisar `vite.config`, `package.json`, cabeceras configuradas en el hosting, `.env*`).
2. **Ejecutar los checks** de las tres secciones (SEO, Seguridad, React/Vite) usando `bash_tool`/`curl`/`web_fetch` — no asumas nada, verifica cada punto contra la web real.
3. **Clasificar hallazgos** por severidad: 🔴 Crítico / 🟠 Importante / 🟡 Recomendado / ✅ OK.
4. **Entregar un informe** (ver plantilla al final) — como artifact Markdown si es largo, o inline si es breve.

No ejecutes todos los comandos de memoria: usa `bash_tool` con `curl -sI`/`curl -s` y `web_fetch` para obtener datos reales del sitio antes de afirmar nada.

---

## 1. Auditoría SEO

### 1.1 Fundamentos on-page
Descarga el HTML servido (importante: el HTML *inicial*, antes de que React hidrate) y revisa:

```bash
curl -s -A "Mozilla/5.0 (compatible; SEOBot/1.0)" https://EJEMPLO.com | head -c 5000
```

Checklist:
- [ ] `<title>` único, descriptivo, 50–60 caracteres, presente en el HTML inicial (no solo inyectado por JS)
- [ ] `<meta name="description">` presente, 120–160 caracteres, en el HTML inicial
- [ ] `<link rel="canonical">` correcto y absoluto
- [ ] `<html lang="...">` correcto
- [ ] Un solo `<h1>` por página, jerarquía de encabezados coherente
- [ ] Imágenes con `alt` descriptivo
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">`

⚠️ **Punto crítico en apps React/Vite (SPA)**: si el sitio es un SPA client-side rendered (CSR) puro, Google indexa razonablemente bien JS, pero title/description dinámicos por ruta (React Router) DEBEN inyectarse antes del primer paint relevante o vía SSR/prerendering (Vite SSR, `vite-plugin-ssr`, Astro islands, prerender con `vite-plugin-prerender` o servicios como Prerender.io). Verifica si cada ruta importante devuelve un `<title>`/`<meta>` distinto al pedir el HTML crudo (sin ejecutar JS):

```bash
for ruta in "/" "/productos" "/blog/algun-post"; do
  echo "== $ruta =="
  curl -s https://EJEMPLO.com$ruta | grep -oP '(?<=<title>).*?(?=</title>)'
done
```
Si todas las rutas devuelven el mismo `<title>` genérico → 🔴 problema serio de SEO técnico en SPA.

### 1.2 Indexabilidad y rastreo
```bash
curl -s https://EJEMPLO.com/robots.txt
curl -s https://EJEMPLO.com/sitemap.xml | head -c 2000
curl -sI https://EJEMPLO.com | grep -i "x-robots-tag"
```
- [ ] `robots.txt` existe y no bloquea rutas que deberían indexarse (cuidado con `Disallow: /` heredado de staging)
- [ ] `sitemap.xml` existe, está referenciado en `robots.txt`, y las URLs devuelven 200
- [ ] No hay `<meta name="robots" content="noindex">` accidental en producción (típico error: copiar config de staging)
- [ ] Sin cabecera `X-Robots-Tag: noindex` accidental

### 1.3 URLs, redirecciones y estado HTTP
```bash
curl -sIL https://EJEMPLO.com   # sigue redirects, revisa la cadena
curl -sI http://EJEMPLO.com     # ¿redirige a https?
curl -sI https://www.EJEMPLO.com
```
- [ ] HTTP → HTTPS con redirect 301 (no 302)
- [ ] www vs non-www consolidado con 301 (no ambas versiones sirviendo 200 = contenido duplicado)
- [ ] Sin cadenas de redirects largas (>2 saltos)
- [ ] Página 404 real devuelve status 404 (no 200 "soft 404")

### 1.4 Datos estructurados y social
```bash
curl -s https://EJEMPLO.com | grep -A2 'application/ld+json'
curl -s https://EJEMPLO.com | grep -iE 'og:|twitter:'
```
- [ ] JSON-LD (schema.org) presente si aplica (Organization, Product, Article, BreadcrumbList…) — validar en https://validator.schema.org/
- [ ] Open Graph: `og:title`, `og:description`, `og:image` (absoluta), `og:url`
- [ ] Twitter Card: `twitter:card`, `twitter:title`, `twitter:image`
- [ ] `favicon` y `apple-touch-icon` presentes

### 1.5 Performance / Core Web Vitals
Usa PageSpeed Insights (API pública, no requiere key para uso puntual) o Lighthouse si hay entorno con navegador headless:
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://EJEMPLO.com&strategy=mobile" | python3 -c "
import json,sys
d=json.load(sys.stdin)
lh=d['lighthouseResult']
print('Performance:', lh['categories']['performance']['score']*100)
print('SEO:', lh['categories']['seo']['score']*100)
audits=lh['audits']
for k in ['largest-contentful-paint','cumulative-layout-shift','total-blocking-time','interactive']:
    print(k, audits[k]['displayValue'])
"
```
- [ ] LCP < 2.5s, CLS < 0.1, INP/TBT dentro de rango "Good"
- [ ] Puntaje Performance y SEO de Lighthouse ≥ 90 (mobile)
- [ ] Imágenes en formato moderno (WebP/AVIF) y con `width`/`height` explícitos (evita CLS)
- [ ] Fuentes con `font-display: swap` y precarga de la fuente crítica

### 1.6 Mobile / accesibilidad básica (impacta SEO)
- [ ] Responsive real (no solo viewport meta)
- [ ] Tamaño de tap targets y contraste de color razonable
- [ ] Sin contenido bloqueado por interstitials intrusivos

---

## 2. Auditoría de seguridad

### 2.1 Cabeceras de seguridad HTTP
```bash
curl -sI https://EJEMPLO.com
```
Verifica presencia y valores correctos:
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (HSTS)
- [ ] `Content-Security-Policy` — evalúa que no use `unsafe-inline`/`unsafe-eval` de forma laxa; en apps Vite en producción, el build no requiere `unsafe-eval` (eso es solo dev con HMR) — si lo ves en prod, 🔴 red flag
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` o `SAMEORIGIN` (o CSP `frame-ancestors` equivalente)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` (o más estricta)
- [ ] `Permissions-Policy` restringiendo APIs sensibles no usadas (camera, microphone, geolocation…)
- [ ] Cookies (si hay auth): `Secure`, `HttpOnly`, `SameSite=Strict|Lax`

### 2.2 Exposición de artefactos de build sensibles
Error muy común en Vite: dejar sourcemaps o archivos de config expuestos en producción.
```bash
curl -sI https://EJEMPLO.com/assets/index-XXXX.js.map   # sustituye por el hash real del bundle
curl -s https://EJEMPLO.com | grep -oP 'src="[^"]*\.js"'  # localizar bundles reales
curl -sI https://EJEMPLO.com/.env
curl -sI https://EJEMPLO.com/.git/config
curl -sI https://EJEMPLO.com/vite.config.ts
curl -sI https://EJEMPLO.com/package.json
```
- [ ] `.map` de los bundles NO accesible públicamente (o al menos no filtra rutas/lógica sensible) — en `vite.config.js`, `build.sourcemap` debería ser `false` o `'hidden'` en prod si no se sirven intencionalmente
- [ ] `.env`, `.git/`, `vite.config.*`, `package.json`, `node_modules/` no accesibles vía HTTP
- [ ] Sin endpoints de debug/admin expuestos accidentalmente

### 2.3 Secretos y variables de entorno en el bundle
Vite expone al cliente **cualquier** variable prefijada con `VITE_`. Es el error de seguridad más frecuente: meter secretos ahí pensando que quedan "server-side".
```bash
curl -s https://EJEMPLO.com/assets/index-XXXX.js | grep -oE '"(sk_live|sk_test|AIza|AKIA|api[_-]?key|secret|password)[^"]*"' -i
```
- [ ] Ningún API key privado, secreto de backend, o credencial hardcodeada en el JS del bundle (buscar patrones típicos: `sk_live_`, `AKIA` de AWS, `AIza` de Google, JWT secrets, connection strings de DB)
- [ ] Solo claves *públicas por diseño* (ej. clave pública de Stripe, de Firebase client config) están en `VITE_*` — y aun así, revisar reglas de seguridad del lado del servicio (Firestore rules, restricciones de dominio en la API key de Google Maps, etc.)
- [ ] Si hay llamadas a APIs propias, la autenticación/autorización real ocurre en el backend, nunca confiando en lógica del cliente

### 2.4 Dependencias vulnerables
Si tienes acceso al repo:
```bash
npm audit --production
npm outdated
```
- [ ] Sin vulnerabilidades `high`/`critical` en `npm audit --production`
- [ ] React, Vite y plugins en versiones soportadas (no EOL)
- [ ] Sin dependencias abandonadas con vulnerabilidades conocidas (revisar en https://osv.dev o GitHub Advisories)

### 2.5 Vectores XSS / inyección típicos de React
Revisar en el código (si hay acceso al repo):
- [ ] Uso de `dangerouslySetInnerHTML` — si existe, ¿el contenido se sanitiza (ej. DOMPurify) antes de insertarse?
- [ ] Enlaces dinámicos (`href`) que puedan contener `javascript:` sin sanitizar
- [ ] Si se usa SSR, validar que no haya XSS por serialización de estado inicial (`window.__STATE__ = ${JSON.stringify(...)}` sin escapar `<`)
- [ ] Formularios que envían a APIs propias: validación también server-side (nunca confiar solo en validación de React)
- [ ] CORS del backend: `Access-Control-Allow-Origin` no debería ser `*` si hay credenciales/cookies involucradas

### 2.6 Otros
- [ ] Certificado TLS válido, sin expirar pronto, con cadena completa (`curl -vI https://EJEMPLO.com 2>&1 | grep -i expire`)
- [ ] Sin mixed content (recursos `http://` en página `https://`)
- [ ] Subresource Integrity (`integrity="sha384-..."`) en scripts de terceros cargados desde CDN externo, si aplica

---

## 3. Buenas prácticas React + Vite (build y arquitectura)

Estos puntos requieren idealmente acceso al repo (`vite.config.*`, `package.json`, estructura de carpetas). Si solo hay acceso a la web en producción, infiere lo posible desde el bundle servido (tamaño, chunks, nombres con hash).

### 3.1 Configuración de build (`vite.config.*`)
- [ ] `build.sourcemap` explícito y consciente (`false`/`'hidden'` en prod salvo necesidad real, p. ej. integración con Sentry)
- [ ] `build.target` acorde al soporte de navegadores real del proyecto (no innecesariamente permisivo ni restrictivo)
- [ ] Minificación activa (`esbuild` por defecto, o `terser` si se necesita `drop_console`/`drop_debugger` — revisar que en prod NO queden `console.log` con datos sensibles)
- [ ] Variables de entorno correctamente separadas: `.env.production` vs `.env.development`, y `.env*.local` en `.gitignore`

### 3.2 Code splitting y carga
```bash
curl -s https://EJEMPLO.com | grep -oP 'src="[^"]*\.js"'
```
- [ ] Rutas/páginas grandes cargadas con `React.lazy()` + `Suspense` en vez de un único bundle monolítico
- [ ] `manualChunks` (o splitting automático de Vite/Rollup) separando vendor de código propio para mejor cacheo
- [ ] Nombres de archivo con hash de contenido (`index-[hash].js`) para cache-busting correcto — verifica que las cabeceras de caché sean coherentes:
```bash
curl -sI https://EJEMPLO.com/assets/index-XXXX.js | grep -i cache-control
```
  - Bundles con hash → `Cache-Control: max-age=31536000, immutable`
  - `index.html` → `Cache-Control: no-cache` (para que siempre se revalide y apunte a los bundles correctos)

### 3.3 Tamaño de bundle
Si hay repo:
```bash
npx vite-bundle-visualizer   # o npm run build -- --mode analyze si está configurado
```
- [ ] Bundle inicial (JS parseado antes de interactividad) razonable (referencia orientativa: <200KB gzip para el chunk crítico)
- [ ] Sin librerías completas importadas cuando solo se usa una función (ej. `import _ from 'lodash'` en vez de `import debounce from 'lodash/debounce'`)
- [ ] Imágenes optimizadas/servidas en formatos modernos y con lazy loading (`loading="lazy"`) fuera del viewport inicial
- [ ] Fuentes autohospedadas o con `preconnect`/`preload` si vienen de CDN externo

### 3.4 React — prácticas generales
- [ ] `React.StrictMode` en desarrollo (no afecta prod pero indica higiene del proyecto)
- [ ] Manejo de errores con Error Boundaries en secciones críticas
- [ ] `key` estables (no índices de array) en listas dinámicas
- [ ] Sin fetches duplicados/waterfalls evidentes (revisar Network tab / Lighthouse "Avoid chaining critical requests")
- [ ] Gestión de estado y efectos sin loops de reconsultas innecesarias (afecta performance real)

### 3.5 Calidad y mantenibilidad
- [ ] ESLint configurado y sin errores en `main`/rama de producción
- [ ] TypeScript (si se usa) sin `any` extendido innecesariamente, `strict: true` recomendado
- [ ] CI ejecuta build + lint (idealmente tests) antes de desplegar a producción

---

## 4. Entregar el informe

Compila los hallazgos en un informe Markdown (usar `create_file` si es extenso → artifact; inline si es breve). Estructura sugerida:

```markdown
# Auditoría SEO / Seguridad / React+Vite — [dominio] — [fecha]

## Resumen ejecutivo
(3-5 líneas: estado general, top 3 problemas críticos)

## 🔴 Críticos (arreglar ya)
- [Hallazgo] — [Por qué importa] — [Cómo arreglarlo]

## 🟠 Importantes
...

## 🟡 Recomendados
...

## ✅ Ya está bien
...

## Detalle por área
### SEO
### Seguridad
### React / Vite (build y arquitectura)
```

Prioriza SIEMPRE por impacto real (ej. secretos expuestos en el bundle > falta de `og:image`), no solo por número de items marcados. No inventes hallazgos: si no pudiste verificar un punto (p. ej. por falta de acceso al repo), indícalo explícitamente como "no verificable con el acceso disponible" en vez de omitirlo o asumirlo.
