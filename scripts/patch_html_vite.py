import os

index_path = r"c:\Users\Dell\Downloads\ultramoney\index.html"
vite_path = r"c:\Users\Dell\Downloads\ultramoney\vite.config.ts"

# 1. Update index.html
with open(index_path, "r", encoding="utf-8") as f:
    index_content = f.read()

index_content = index_content.replace(
    '<meta property="og:image" content="https://ultramoney.app/og-image.png">',
    '<meta property="og:image" content="https://ultramoney.app/og-image.svg">'
)
index_content = index_content.replace(
    '<meta name="twitter:image" content="https://ultramoney.app/og-image.png">',
    '<meta name="twitter:image" content="https://ultramoney.app/og-image.svg">'
)

with open(index_path, "w", encoding="utf-8") as f:
    f.write(index_content)

# 2. Update vite.config.ts
with open(vite_path, "r", encoding="utf-8") as f:
    vite_content = f.read()

vite_content = vite_content.replace(
    "includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'logoultramoney_logooriginaldegradadomorado.svg'],",
    "includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'logoultramoney_logooriginaldegradadomorado.svg', 'og-image.svg', 'pwa-icon.svg'],"
)
vite_content = vite_content.replace(
    """              {
                src: '/pwa-192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/pwa-512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: '/maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }""",
    """              {
                src: '/pwa-icon.svg',
                sizes: '192x192 512x512',
                type: 'image/svg+xml'
              },
              {
                src: '/pwa-icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'maskable'
              }"""
)

with open(vite_path, "w", encoding="utf-8") as f:
    f.write(vite_content)

print("index.html and vite.config.ts updated!")
