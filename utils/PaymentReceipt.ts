import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loan, Client, CompanySettings } from '../types';

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

export interface PaymentData {
    receiptNumber: string;
    date: string;
    cashierName: string;
    branch: string;
    method: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Depósito' | 'Mixto';
    type: 'Cuota' | 'Abono Extraordinario' | 'Cancelación';
    
    // Desglose
    amountReceived: number;
    capital: number;
    interest: number;
    mora: number;
    insurance: number;
    commission: number;
    discount: number;
    change: number;

    // Estado después del pago
    originalCapital: number;
    pendingCapital: number;
    pendingInterest: number;
    pendingMora: number;
    totalPending: number;
    nextInstallmentNumber?: number;
    nextPaymentDate?: string;
    
    // Si es abono extra
    extraAction?: 'Reduce Plazo' | 'Reduce Cuota';
}

export const generatePaymentReceipt = (payment: PaymentData, loan: Loan, client: Client, companySettings: Partial<CompanySettings>) => {
    const doc = new jsPDF({ format: 'letter' });
    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo-600
    
    // Encabezado
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companySettings?.name || 'UltraMoney', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`RNC: ${companySettings?.rnc || 'N/A'}`, 14, 26);
    doc.text(`Tel: ${companySettings?.phone || 'N/A'}`, 14, 31);
    doc.text(`Email: ${companySettings?.email || 'N/A'}`, 14, 36);
    
    // Recibo Info Derecha
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('RECIBO DE PAGO', 140, 20);
    
    doc.setFontSize(10);
    doc.text(`N°: ${payment.receiptNumber}`, 140, 26);
    doc.text(`Fecha: ${payment.date}`, 140, 31);
    doc.text(`Cajero: ${payment.cashierName}`, 140, 36);
    doc.text(`Sucursal: ${payment.branch}`, 140, 41);

    // Separador
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 45, 196, 45);

    // Info del Cliente y Préstamo
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Datos del Cliente', 14, 55);
    doc.text('Datos del Préstamo', 110, 55);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nombre: ${client.name} ${client.lastName || ''}`, 14, 62);
    doc.text(`Cédula: ${client.clientCode || 'N/A'}`, 14, 67);
    doc.text(`Teléfono: ${client.phone}`, 14, 72);

    doc.text(`Préstamo N°: ${loan.id.substring(0, 8).toUpperCase()}`, 110, 62);
    doc.text(`Tipo: ${loan.loanType}`, 110, 67);
    doc.text(`Desembolso: ${loan.startDate}`, 110, 72);
    
    if (payment.type === 'Cancelación') {
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text('PRÉSTAMO CANCELADO', 110, 79);
        doc.setTextColor(0,0,0);
    } else if (payment.type === 'Abono Extraordinario') {
        doc.setFontSize(12);
        doc.setTextColor(245, 158, 11); // Amber
        doc.text(`ABONO EXTRA (${payment.extraAction})`, 110, 79);
        doc.setTextColor(0,0,0);
    }

    doc.line(14, 85, 196, 85);

    // Desglose del Pago (Tabla)
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Desglose del Pago', 14, 95);
    doc.text(`Método: ${payment.method}`, 140, 95);

    autoTable(doc, {
        startY: 100,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        body: [
            ['Monto Recibido', `RD$ ${payment.amountReceived.toLocaleString()}`],
            ['Capital', `RD$ ${payment.capital.toLocaleString()}`],
            ['Intereses', `RD$ ${payment.interest.toLocaleString()}`],
            ['Mora / Atrasos', `RD$ ${payment.mora.toLocaleString()}`],
            ['Seguro / Comisiones', `RD$ ${(payment.insurance + payment.commission).toLocaleString()}`],
            ['Descuento', `RD$ ${payment.discount.toLocaleString()}`],
            ['Cambio', `RD$ ${payment.change.toLocaleString()}`]
        ],
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
    });

    const docWithAutoTable = doc as JsPDFWithAutoTable;
    const finalY1 = docWithAutoTable.lastAutoTable.finalY + 10;

    // Estado del Préstamo después del pago
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Estado del Préstamo', 14, finalY1);

    autoTable(doc, {
        startY: finalY1 + 5,
        theme: 'plain',
        body: [
            ['Capital Original', `RD$ ${payment.originalCapital.toLocaleString()}`],
            ['Capital Pendiente', `RD$ ${payment.pendingCapital.toLocaleString()}`],
            ['Intereses Pendientes', `RD$ ${payment.pendingInterest.toLocaleString()}`],
            ['Total Pendiente', `RD$ ${payment.totalPending.toLocaleString()}`]
        ],
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        margin: { right: 110 } // Mitad izquierda
    });

    autoTable(doc, {
        startY: finalY1 + 5,
        theme: 'plain',
        body: [
            ['Próxima Cuota N°', payment.nextInstallmentNumber ? payment.nextInstallmentNumber.toString() : 'N/A'],
            ['Fecha Próximo Pago', payment.nextPaymentDate || 'N/A']
        ],
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        margin: { left: 110 } // Mitad derecha
    });

    const finalY2 = Math.max(docWithAutoTable.lastAutoTable.finalY, finalY1 + 40);

    // Garantías
    if (loan.collateral?.type && loan.collateral?.type !== 'Sin Garantía') {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Garantía: ${loan.collateral?.type} (Ref: ${loan.collateral?.refNumber || 'N/A'}) - En Custodia`, 14, finalY2 + 10);
    }

    // Firmas
    doc.setDrawColor(0, 0, 0);
    doc.line(30, 240, 90, 240);
    doc.text('Firma del Cajero', 45, 245);

    doc.line(120, 240, 180, 240);
    doc.text('Firma del Cliente', 135, 245);

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Este recibo es el comprobante oficial del pago realizado. Conserve este documento.', 105, 270, { align: 'center' });
    doc.text('Gracias por su confianza.', 105, 275, { align: 'center' });

    doc.save(`Recibo_${payment.receiptNumber}.pdf`);
};