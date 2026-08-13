import React from 'react';
import { Loan, CompanySettings, Client } from '../../types';
import { Printer, X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ContractViewerProps {
    loan: Loan;
    client: Client;
    company: CompanySettings;
    onClose: () => void;
}

export const ContractViewer: React.FC<ContractViewerProps> = ({ loan, client, company, onClose }) => {
    const handlePrint = () => {
        const printContent = document.getElementById('printable-contract-preview');
        if (printContent) {
            const windowUrl = 'about:blank';
            const uniqueName = new Date();
            const windowName = 'Print' + uniqueName.getTime();
            const printWindow = window.open(windowUrl, windowName, 'width=800,height=1000');
            
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Contrato de Préstamo - ${loan.id}</title>
                            <style>
                                body { font-family: 'Times New Roman', serif; padding: 40px; font-size: 14px; max-width: 800px; margin: 0 auto; color: #000; line-height: 1.6; }
                                .header { text-align: center; margin-bottom: 30px; }
                                .header h1 { margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase; text-decoration: underline; }
                                .header img { max-height: 80px; margin-bottom: 10px; }
                                .header p { margin: 2px 0; font-size: 12px; }
                                .content { text-align: justify; }
                                .signatures { display: flex; justify-content: space-between; margin-top: 80px; }
                                .signature-box { text-align: center; width: 45%; }
                                .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; font-weight: bold; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                ${company.logoUrl ? `<img src="${company.logoUrl}" />` : ''}
                                <p>${company.name}</p>
                                <p>RNC: ${company.rnc || 'N/A'}</p>
                                <br/>
                                <h1>CONTRATO DE PRÉSTAMO ${loan.loanType === 'Rédito' ? 'PAGARÉ ABIERTO' : 'AMORTIZADO'}</h1>
                            </div>
                            
                            <div class="content">
                                <p>
                                    Entre los suscritos, por una parte <strong>${company.name}</strong>, debidamente constituida de acuerdo con las leyes de la República Dominicana, con su domicilio principal en ${company.address}, en lo adelante denominado <strong>EL ACREEDOR</strong>;
                                </p>
                                <p>
                                    Y por la otra parte, el señor/a <strong>${client.name}</strong>, portador/a de la cédula de identidad y electoral No. <strong>${client.cedula}</strong>, domiciliado/a y residente en ${client.address}, en lo adelante denominado <strong>EL DEUDOR</strong>.
                                </p>
                                <p>
                                    <strong>SE HA CONVENIDO Y PACTADO LO SIGUIENTE:</strong>
                                </p>
                                <p>
                                    <strong>PRIMERO:</strong> EL DEUDOR reconoce deber y pagar a EL ACREEDOR la suma de <strong>RD$${loan.amount.toLocaleString()}</strong> por concepto de préstamo personal en efectivo.
                                </p>
                                <p>
                                    <strong>SEGUNDO:</strong> El préstamo devengará un interés de <strong>${loan.interestRate}%</strong> pagadero en forma <strong>${(loan.frequency || '').toLowerCase()}</strong>.
                                </p>
                                ${loan.loanType === 'Rédito' ? `
                                <p>
                                    <strong>TERCERO (MODO RÉDITO):</strong> Este préstamo operará bajo la modalidad de Pagaré Abierto. EL DEUDOR se compromete a pagar periódicamente solo los intereses generados. El saldo del capital inicial podrá realizarse en cualquier momento, siempre que los intereses estén al día, o mediante abonos a capital acordados previamente.
                                </p>
                                ` : `
                                <p>
                                    <strong>TERCERO (MODO AMORTIZADO):</strong> EL DEUDOR se compromete a pagar el capital y los intereses en <strong>${loan.durationWeeks}</strong> cuotas, por un monto total de la deuda ascendente a <strong>RD$${loan.totalToPay.toLocaleString()}</strong>.
                                </p>
                                `}
                                <p>
                                    <strong>CUARTO:</strong> Para garantizar el cumplimiento de la presente obligación, EL DEUDOR ha puesto como garantía lo siguiente: <strong>${loan.collateralType ? `${loan.collateralType} - ${loan.collateralDescription} (Ref: ${loan.collateralRef})` : 'Pagaré Notarial sin garantía específica declarada en este acto'}</strong>.
                                </p>
                                <p>
                                    <strong>QUINTO:</strong> En caso de falta de pago en la fecha acordada, EL DEUDOR acepta pagar los gastos de cobranza, recargos por mora y honorarios legales incurridos.
                                </p>
                                <p>
                                    Leído, aprobado y firmado en la ciudad de _______________, República Dominicana, a los <strong>${new Date(loan.startDate).getDate()}</strong> días del mes de <strong>${new Date(loan.startDate).toLocaleString('es-DO', {month: 'long'})}</strong> del año <strong>${new Date(loan.startDate).getFullYear()}</strong>.
                                </p>
                            </div>

                            <div class="signatures">
                                <div class="signature-box">
                                    <div class="signature-line">
                                        ${client.name}<br/>
                                        EL DEUDOR
                                    </div>
                                </div>
                                <div class="signature-box">
                                    <div class="signature-line">
                                        ${company.name}<br/>
                                        EL ACREEDOR
                                    </div>
                                </div>
                            </div>
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('contract-content');
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Contrato_${loan.id}_${client.name}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    const handleDownloadImage = async () => {
        const element = document.getElementById('contract-content');
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const link = document.createElement('a');
            link.download = `Contrato_${loan.id}_${client.name}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error generating Image:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                    <span className="font-bold text-lg">Contrato de Préstamo</span>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50" id="printable-contract-preview">
                    <div id="contract-content" className="bg-white p-12 max-w-3xl mx-auto shadow-sm border border-slate-200 font-serif text-slate-800 leading-relaxed text-sm relative">
                        <div className="text-center mb-8">
                            {company.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-16 mx-auto mb-2" />}
                            <h2 className="font-bold uppercase">{company.name}</h2>
                            <p className="text-xs">RNC: {company.rnc || 'N/A'}</p>
                            <h1 className="font-bold text-xl uppercase underline mt-6">CONTRATO DE PRÉSTAMO {loan.loanType === 'Rédito' ? 'PAGARÉ ABIERTO' : 'AMORTIZADO'}</h1>
                        </div>
                        
                        <div className="space-y-4 text-justify">
                            <p>Entre los suscritos, por una parte <strong>{company.name}</strong>, debidamente constituida de acuerdo con las leyes de la República Dominicana, con su domicilio principal en {company.address}, en lo adelante denominado <strong>EL ACREEDOR</strong>;</p>
                            <p>Y por la otra parte, el señor/a <strong>{client.name}</strong>, portador/a de la cédula de identidad y electoral No. <strong>{client.cedula}</strong>, domiciliado/a y residente en {client.address}, en lo adelante denominado <strong>EL DEUDOR</strong>.</p>
                            <p className="text-center font-bold my-6">SE HA CONVENIDO Y PACTADO LO SIGUIENTE:</p>
                            <p><strong>PRIMERO:</strong> EL DEUDOR reconoce deber y pagar a EL ACREEDOR la suma de <strong>RD${loan.amount.toLocaleString()}</strong> por concepto de préstamo personal en efectivo.</p>
                            <p><strong>SEGUNDO:</strong> El préstamo devengará un interés de <strong>{loan.interestRate}%</strong> pagadero en forma <strong>{(loan.frequency || '').toLowerCase()}</strong>.</p>
                            
                            {loan.loanType === 'Rédito' ? (
                                <p><strong>TERCERO (MODO RÉDITO):</strong> Este préstamo operará bajo la modalidad de Pagaré Abierto. EL DEUDOR se compromete a pagar periódicamente solo los intereses generados. El saldo del capital inicial podrá realizarse en cualquier momento, siempre que los intereses estén al día, o mediante abonos a capital acordados previamente.</p>
                            ) : (
                                <p><strong>TERCERO (MODO AMORTIZADO):</strong> EL DEUDOR se compromete a pagar el capital y los intereses en <strong>{loan.durationWeeks}</strong> cuotas, por un monto total de la deuda ascendente a <strong>RD${loan.totalToPay.toLocaleString()}</strong>.</p>
                            )}
                            
                            <p><strong>CUARTO:</strong> Para garantizar el cumplimiento de la presente obligación, EL DEUDOR ha puesto como garantía lo siguiente: <strong>{loan.collateralType ? `${loan.collateralType} - ${loan.collateralDescription} (Ref: ${loan.collateralRef})` : 'Pagaré Notarial sin garantía específica declarada en este acto'}</strong>.</p>
                            <p><strong>QUINTO:</strong> En caso de falta de pago en la fecha acordada, EL DEUDOR acepta pagar los gastos de cobranza, recargos por mora y honorarios legales incurridos.</p>
                            
                            <p className="mt-8">Leído, aprobado y firmado en la ciudad de _______________, República Dominicana, a los <strong>{new Date(loan.startDate).getDate()}</strong> días del mes de <strong>{new Date(loan.startDate).toLocaleString('es-DO', {month: 'long'})}</strong> del año <strong>{new Date(loan.startDate).getFullYear()}</strong>.</p>
                        </div>

                        <div className="flex justify-between mt-24 px-10">
                            <div className="text-center w-48 border-t border-black pt-2 font-bold">
                                {client.name}<br/>EL DEUDOR
                            </div>
                            <div className="text-center w-48 border-t border-black pt-2 font-bold">
                                {company.name}<br/>EL ACREEDOR
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap gap-4">
                    <button 
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                        <Printer className="w-5 h-5" /> Imprimir
                    </button>
                    <button 
                        onClick={handleDownloadPDF}
                        className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition-colors shadow-lg"
                    >
                        <FileText className="w-5 h-5" /> Descargar PDF
                    </button>
                    <button 
                        onClick={handleDownloadImage}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
                    >
                        <ImageIcon className="w-5 h-5" /> Descargar Imagen
                    </button>
                </div>
            </div>
        </div>
    );
};
