import QRCode from 'qrcode';

/**
 * Generador de Códigos QR Oficial ISO/IEC 18004 para UltraMoney
 * Produce QR codes 100% válidos y escaneables en cualquier smartphone e impresora térmica.
 */

export async function generateQRCodeDataURLAsync(text: string, size = 200): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('Error generando QR Code:', err);
    return '';
  }
}

export async function generateQRCodeSVGAsync(text: string, size = 160): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('Error generando QR SVG:', err);
    return '';
  }
}

/**
 * Fallback síncrono para renderizado inmediato en componentes
 */
export function generateQRCodeDataURL(text: string, size = 160): string {
  // Para llamadas síncronas generamos URL con parámetros óptimos de alto contraste
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&margin=1&format=png`;
}
