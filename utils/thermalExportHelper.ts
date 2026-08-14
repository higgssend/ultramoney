import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ThermalExportOptions {
  scale?: number;
  widthPx?: number;
  paperWidth?: '58mm' | '80mm';
}

/**
 * Espera a que todas las imágenes dentro de un elemento DOM estén completamente cargadas y renderizadas.
 */
const waitForImagesToLoad = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'));
  const promises = images.map((img) => {
    if (img.complete && img.naturalHeight !== 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      // Timeout de seguridad en caso de fallo de red
      setTimeout(resolve, 800);
    });
  });
  await Promise.all(promises);
};

/**
 * Clona un elemento de recibo térmico a un contenedor aislado fuera de pantalla (Off-screen)
 * para garantizar que ninguna regla de overflow, flex o scroll del modal/página corte la imagen.
 */
const createIsolatedOffscreenClone = async (
  sourceElement: HTMLElement,
  paperWidth: '58mm' | '80mm'
): Promise<{ cloneContainer: HTMLDivElement; cleanup: () => void }> => {
  const targetWidthPx = paperWidth === '58mm' ? 384 : 576;

  const cloneContainer = document.createElement('div');
  cloneContainer.style.position = 'fixed';
  cloneContainer.style.left = '-99999px';
  cloneContainer.style.top = '0';
  cloneContainer.style.width = `${targetWidthPx}px`;
  cloneContainer.style.minWidth = `${targetWidthPx}px`;
  cloneContainer.style.maxWidth = `${targetWidthPx}px`;
  cloneContainer.style.height = 'auto';
  cloneContainer.style.minHeight = 'auto';
  cloneContainer.style.maxHeight = 'none';
  cloneContainer.style.overflow = 'visible';
  cloneContainer.style.background = '#ffffff';
  cloneContainer.style.color = '#000000';
  cloneContainer.style.zIndex = '-99999';
  cloneContainer.style.boxSizing = 'border-box';
  cloneContainer.style.margin = '0';
  cloneContainer.style.padding = paperWidth === '58mm' ? '12px 10px' : '18px 14px';
  cloneContainer.style.fontFamily = "'Courier New', Courier, monospace, sans-serif";

  // Clonar contenido profundo
  const clonedNode = sourceElement.cloneNode(true) as HTMLElement;
  clonedNode.style.width = '100%';
  clonedNode.style.maxWidth = '100%';
  clonedNode.style.height = 'auto';
  clonedNode.style.maxHeight = 'none';
  clonedNode.style.overflow = 'visible';
  clonedNode.style.margin = '0';
  clonedNode.style.padding = '0';
  clonedNode.style.transform = 'none';
  clonedNode.style.boxShadow = 'none';
  clonedNode.style.border = 'none';

  // Forzar todos los contenedores internos a no tener overflow escondido
  const allChildren = clonedNode.querySelectorAll('*');
  allChildren.forEach((child) => {
    const el = child as HTMLElement;
    if (el.style) {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }
  });

  cloneContainer.appendChild(clonedNode);
  document.body.appendChild(cloneContainer);

  // Asegurar fuentes e imágenes
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch (e) {
    console.warn('Document fonts ready error:', e);
  }

  await waitForImagesToLoad(cloneContainer);
  // Pequeña pausa para estabilizar layout de canvas
  await new Promise((resolve) => setTimeout(resolve, 80));

  const cleanup = () => {
    if (cloneContainer.parentNode) {
      cloneContainer.parentNode.removeChild(cloneContainer);
    }
  };

  return { cloneContainer, cleanup };
};

/**
 * Exporta un recibo térmico a PNG con fidelidad total 100% de arriba a abajo sin recortes.
 */
export async function exportThermalReceiptToPNG(
  sourceElement: HTMLElement,
  filename: string,
  paperWidth: '58mm' | '80mm' = '58mm'
): Promise<void> {
  const { cloneContainer, cleanup } = await createIsolatedOffscreenClone(sourceElement, paperWidth);

  try {
    const actualWidth = cloneContainer.offsetWidth || (paperWidth === '58mm' ? 384 : 576);
    const actualHeight = cloneContainer.scrollHeight || cloneContainer.offsetHeight;

    const canvas = await html2canvas(cloneContainer, {
      scale: 3, // Alta definición 3x
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: actualWidth,
      height: actualHeight,
      windowWidth: actualWidth,
      windowHeight: actualHeight
    });

    const safeFilename = filename.endsWith('.png') ? filename : `${filename}.png`;

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = safeFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            resolve();
          } catch (err) {
            reject(err);
          }
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = safeFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          URL.revokeObjectURL(url);
          resolve();
        }, 1000);
      }, 'image/png');
    });
  } finally {
    cleanup();
  }
}

/**
 * Exporta un recibo térmico a PDF en rollo continuo exacto con dimensiones precisas en milímetros.
 */
export async function exportThermalReceiptToPDF(
  sourceElement: HTMLElement,
  filename: string,
  paperWidth: '58mm' | '80mm' = '58mm'
): Promise<void> {
  const { cloneContainer, cleanup } = await createIsolatedOffscreenClone(sourceElement, paperWidth);

  try {
    const actualWidth = cloneContainer.offsetWidth || (paperWidth === '58mm' ? 384 : 576);
    const actualHeight = cloneContainer.scrollHeight || cloneContainer.offsetHeight;

    const canvas = await html2canvas(cloneContainer, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: actualWidth,
      height: actualHeight,
      windowWidth: actualWidth,
      windowHeight: actualHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const widthMm = paperWidth === '58mm' ? 58 : 80;
    const heightMm = Math.max(30, (canvas.height * widthMm) / canvas.width);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);
  } finally {
    cleanup();
  }
}

/**
 * Dispara la impresión térmica directa ESC/POS en ventana limpia optimizada para impresoras de tickets.
 */
export function printThermalReceiptDirect(
  printableInnerHtml: string,
  paperWidth: '58mm' | '80mm' = '58mm',
  title: string = 'Ticket de Pago'
): void {
  const widthCss = paperWidth === '58mm' ? '58mm' : '80mm';
  const printWindow = window.open('', '_blank', 'width=450,height=750');
  if (!printWindow) {
    throw new Error('Por favor permite las ventanas emergentes en tu navegador para imprimir.');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: ${widthCss} auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: ${widthCss};
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: ${paperWidth === '58mm' ? '11px' : '13px'};
            line-height: 1.25;
          }
          body {
            padding: ${paperWidth === '58mm' ? '8px 4px' : '14px 8px'};
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000000; margin: 6px 0; }
          .double-divider { border-top: 2px double #000000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .qr-container { display: flex; justify-content: center; margin: 8px 0; }
          .qr-container img { width: ${paperWidth === '58mm' ? '110px' : '130px'}; height: auto; display: block; margin: 0 auto; }
          @media print {
            html, body {
              width: ${widthCss};
              margin: 0;
              padding: ${paperWidth === '58mm' ? '4px 2px' : '8px 4px'};
            }
          }
        </style>
      </head>
      <body>
        ${printableInnerHtml}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
