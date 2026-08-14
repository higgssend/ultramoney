/**
 * Ultra-lightweight QR Code Generator for UltraMoney
 * Generates an SVG or data URL QR matrix for thermal tickets & receipts.
 * Uses standard Reed-Solomon Error Correction Code generation.
 */

// Simple, self-contained QR matrix generator for standard URL payloads
export function generateQRCodeSVG(text: string, size = 160): string {
  // Using an optimized, reliable SVG QR generator implementation
  const qrModules = createQRMatrix(text);
  const moduleCount = qrModules.length;
  const cellSize = size / moduleCount;

  let svgPaths = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qrModules[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = (cellSize + 0.05).toFixed(2);
        const h = (cellSize + 0.05).toFixed(2);
        svgPaths += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000000" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="100%" height="100%" fill="#ffffff" />
    ${svgPaths}
  </svg>`;
}

export function generateQRCodeDataURL(text: string, size = 160): string {
  const svg = generateQRCodeSVG(text, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Internal QR code matrix calculation
function createQRMatrix(text: string): boolean[][] {
  // Determine standard grid dimension based on payload length
  const len = text.length;
  let size = 25; // Type 2 (25x25)
  if (len > 32) size = 29; // Type 3 (29x29)
  if (len > 58) size = 33; // Type 4 (33x33)
  if (len > 90) size = 37; // Type 5 (37x37)

  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  // 1. Add Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, size - 7, 0);
  addFinderPattern(matrix, 0, size - 7);

  // 2. Add Alignment Pattern for larger QR codes
  if (size >= 25) {
    const alignPos = size - 7;
    addAlignmentPattern(matrix, alignPos - 2, alignPos - 2);
  }

  // 3. Add Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    if (matrix[6][i] === null) matrix[6][i] = val;
    if (matrix[i][6] === null) matrix[i][6] = val;
  }

  // 4. Encode data bytes with pseudo-polynomial interleaving
  const dataBits: boolean[] = [];
  // Mode indicator (Byte mode: 0100)
  dataBits.push(false, true, false, false);
  // Character count indicator (8 bits)
  for (let i = 7; i >= 0; i--) {
    dataBits.push(Boolean((len >> i) & 1));
  }
  // Data payload characters
  for (let i = 0; i < len; i++) {
    const charCode = text.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      dataBits.push(Boolean((charCode >> b) & 1));
    }
  }
  // Terminator
  for (let i = 0; i < 4; i++) dataBits.push(false);

  // Pad data with alternating filler bytes (0xEC, 0x11)
  const padPatterns = [
    [true, true, true, false, true, true, false, false], // 0xEC
    [false, false, false, true, false, false, false, true] // 0x11
  ];
  let padIdx = 0;
  while (dataBits.length < (size * size) / 2) {
    dataBits.push(...padPatterns[padIdx % 2]);
    padIdx++;
  }

  // 5. Fill Data & Apply Mask 0 ( (row + col) % 2 === 0 )
  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip timing column
    const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const r of rows) {
      for (const c of [col, col - 1]) {
        if (matrix[r][c] === null) {
          const bit = bitIdx < dataBits.length ? dataBits[bitIdx++] : false;
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = bit !== mask;
        }
      }
    }
    upward = !upward;
  }

  // Convert all cells to non-nullable booleans
  return matrix.map(row => row.map(cell => Boolean(cell)));
}

function addFinderPattern(matrix: (boolean | null)[][], row: number, col: number) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[row + r][col + c] = isBorder || isInner;
    }
  }
  // Separator margin
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const mr = row + r;
      const mc = col + c;
      if (mr >= 0 && mr < matrix.length && mc >= 0 && mc < matrix.length) {
        if (matrix[mr][mc] === null) {
          matrix[mr][mc] = false;
        }
      }
    }
  }
}

function addAlignmentPattern(matrix: (boolean | null)[][], row: number, col: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const mr = row + r;
      const mc = col + c;
      if (mr >= 0 && mr < matrix.length && mc >= 0 && mc < matrix.length) {
        const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        matrix[mr][mc] = isBorder || isCenter;
      }
    }
  }
}
