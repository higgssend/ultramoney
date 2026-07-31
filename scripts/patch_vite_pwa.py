import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\vite.config.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace PWA config
old_manifest = """          manifest: {
            name: 'UltraMoney',
            short_name: 'UltraMoney',
            description: 'Sistema para administración de préstamos.',
            theme_color: '#4F46E5',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/pwa-icon.svg',
                sizes: '192x192 512x512',
                type: 'image/svg+xml'
              },
              {
                src: '/pwa-icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'maskable'
              }
            ]
          },"""

new_manifest = """          manifestFilename: 'manifest.json',
          manifest: {
            name: 'UltraMoney',
            short_name: 'UltraMoney',
            description: 'UltraMoney es una plataforma moderna para administrar préstamos, clientes, pagos, caja y cartera. Diseñada para prestamistas y financieras.',
            theme_color: '#4F46E5',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/pwa-icon.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: '/pwa-icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'maskable'
              }
            ]
          },"""

if "manifestFilename: 'manifest.json'" not in content:
    content = content.replace(old_manifest, new_manifest)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("vite.config.ts patched!")
else:
    print("Already patched vite.config.ts!")
