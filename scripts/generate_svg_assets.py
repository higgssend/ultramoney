import re
import os

logo_path = r"c:\Users\Dell\Downloads\ultramoney\public\logoultramoney.svg"
og_path = r"c:\Users\Dell\Downloads\ultramoney\public\og-image.svg"
pwa_path = r"c:\Users\Dell\Downloads\ultramoney\public\pwa-icon.svg"

with open(logo_path, "r", encoding="utf-8") as f:
    logo_content = f.read()

# Extract defs
defs_match = re.search(r'<defs>.*?</defs>', logo_content, re.DOTALL)
defs = defs_match.group(0) if defs_match else ""

# Extract paths
paths = "\n".join(re.findall(r'<path.*?/>|<path.*?</path>', logo_content, re.DOTALL))

# Generate OG Image (1200x630)
og_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  {defs}
  <rect width="1200" height="630" fill="#0f172a" />
  
  <g transform="translate(150, 194)">
    <g transform="scale(1) translate(0, 0)">
       {paths}
    </g>

    <g transform="translate(320, 100)">
       <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="80" font-weight="bold" fill="#ffffff">UltraMoney</text>
       <text x="0" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="32" font-weight="normal" fill="#94a3b8">Sistema Moderno de Préstamos</text>
       
       <rect x="0" y="110" width="130" height="40" rx="20" fill="#312e81" />
       <text x="65" y="137" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="600" fill="#e0e7ff" text-anchor="middle">Finanzas</text>
       
       <rect x="145" y="110" width="150" height="40" rx="20" fill="#164e63" />
       <text x="220" y="137" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="600" fill="#cffafe" text-anchor="middle">Automatización</text>
       
       <rect x="310" y="110" width="150" height="40" rx="20" fill="#701a75" />
       <text x="385" y="137" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="600" fill="#fae8ff" text-anchor="middle">Analíticas</text>
    </g>
  </g>
</svg>"""

# Generate PWA Icon (512x512)
pwa_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  {defs}
  <rect width="512" height="512" rx="112" fill="#ffffff" />
  <g transform="translate(40, 135)">
    <g transform="scale(1) translate(0, 0)">
       {paths}
    </g>
    <g transform="translate(245, 130)">
       <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="bold" fill="#0f172a">UltraMoney</text>
       <text x="0" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="normal" fill="#64748b">Préstamos</text>
    </g>
  </g>
</svg>"""

with open(og_path, "w", encoding="utf-8") as f:
    f.write(og_svg)

with open(pwa_path, "w", encoding="utf-8") as f:
    f.write(pwa_svg)

print("SVG files generated successfully!")
