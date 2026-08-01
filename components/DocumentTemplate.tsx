import React from 'react';
import { Loan, Client, CompanySettings, Transaction } from '../types';

interface DocumentTemplateProps {
  docType: 'pagare' | 'contrato' | 'estado_cuenta' | 'carta_saldo' | 'carta_cobro' | 'recibo';
  client: Client;
  company: CompanySettings;
  loan?: Loan;
  transaction?: Transaction;
  id?: string;
}

export const DocumentTemplate: React.FC<DocumentTemplateProps> = ({
  docType,
  client,
  company,
  loan,
  transaction,
  id = 'printable-legal-document'
}) => {
  const todayStr = new Date().toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div id={id} className="bg-white text-slate-900 p-10 rounded-xl shadow-md border border-slate-200 w-[800px] font-serif text-sm leading-relaxed" style={{ width: '800px' }}>
      {/* Header */}
      <div className="header text-center border-b border-slate-300 pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wider font-sans text-slate-800">{company.name}</h1>
        {company.rnc && <p className="text-xs text-slate-500 font-sans">RNC: {company.rnc}</p>}
        <p className="text-xs text-slate-500 font-sans">{company.address} • Tel: {company.phone}</p>
      </div>

      {/* Document Content Switcher */}
      {docType === 'recibo' && (
        <div className="font-sans text-sm">
          <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
             <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">RECIBO DE PAGO</h2>
                <p className="text-slate-500 font-medium">Comprobante Oficial</p>
             </div>
             <div className="text-right">
                <p className="font-bold text-slate-800 text-lg">N°: {transaction?.id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
                <p className="text-slate-500">Fecha: {transaction?.date ? new Date(transaction.date).toLocaleDateString('es-DO') : todayStr}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                  <h3 className="font-bold text-indigo-700 uppercase tracking-wider text-xs mb-2">Datos del Cliente</h3>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p><strong>Nombre:</strong> {client.name} {client.lastName || ''}</p>
                      <p><strong>Cédula:</strong> {client.cedula}</p>
                      <p><strong>Teléfono:</strong> {client.phone}</p>
                  </div>
              </div>
              <div>
                  <h3 className="font-bold text-indigo-700 uppercase tracking-wider text-xs mb-2">Datos del Préstamo</h3>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p><strong>Ref Préstamo:</strong> {loan?.id?.substring(0, 8).toUpperCase()}</p>
                      <p><strong>Tipo:</strong> {loan?.loanType}</p>
                      <p><strong>Vencimiento:</strong> {loan?.startDate}</p>
                  </div>
              </div>
          </div>

          <div className="mb-6">
              <h3 className="font-bold text-indigo-700 uppercase tracking-wider text-xs mb-2">Desglose del Pago</h3>
              <table className="w-full border-collapse border border-slate-200">
                  <tbody>
                      <tr className="bg-indigo-600 text-white font-bold">
                          <td className="p-3 border border-slate-200">Monto Recibido</td>
                          <td className="p-3 border border-slate-200 text-right">RD$ {transaction?.amount?.toLocaleString('es-DO', { minimumFractionDigits: 2 }) || '0.00'}</td>
                      </tr>
                      <tr>
                          <td className="p-3 border border-slate-200">Abono a Capital</td>
                          <td className="p-3 border border-slate-200 text-right">RD$ {((transaction?.amount || 0) * 0.7).toLocaleString('es-DO', {minimumFractionDigits: 2})}</td>
                      </tr>
                      <tr className="bg-slate-50">
                          <td className="p-3 border border-slate-200">Abono a Intereses</td>
                          <td className="p-3 border border-slate-200 text-right">RD$ {((transaction?.amount || 0) * 0.3).toLocaleString('es-DO', {minimumFractionDigits: 2})}</td>
                      </tr>
                      <tr>
                          <td className="p-3 border border-slate-200">Mora / Cargos</td>
                          <td className="p-3 border border-slate-200 text-right">RD$ 0.00</td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                  <h3 className="font-bold text-indigo-700 uppercase tracking-wider text-xs mb-2">Estado del Préstamo</h3>
                  <div className="p-4 border border-slate-200 rounded-lg">
                      <p className="flex justify-between mb-1"><span className="text-slate-500">Capital Original:</span> <strong>RD$ {loan?.amount.toLocaleString('es-DO')}</strong></p>
                      <p className="flex justify-between mb-1"><span className="text-slate-500">Saldo Anterior:</span> <strong>RD$ {((loan?.remainingBalance || 0) + (transaction?.amount || 0)).toLocaleString('es-DO')}</strong></p>
                      <p className="flex justify-between pt-2 mt-2 border-t border-slate-200 text-lg"><span className="text-slate-700 font-bold">Saldo Actual:</span> <strong className="text-indigo-700">RD$ {loan?.remainingBalance.toLocaleString('es-DO')}</strong></p>
                  </div>
              </div>
              <div>
                  <h3 className="font-bold text-indigo-700 uppercase tracking-wider text-xs mb-2">Información Adicional</h3>
                  <div className="p-4 border border-slate-200 rounded-lg h-full">
                      <p className="mb-1"><strong>Método de Pago:</strong> Efectivo / Transferencia</p>
                      <p className="mb-1"><strong>Cajero:</strong> Sistema Automatizado</p>
                      <p className="mb-1 text-xs text-slate-500 mt-4 italic">{transaction?.description}</p>
                  </div>
              </div>
          </div>

          <div className="flex justify-between mt-12 pt-8 border-t-2 border-dashed border-slate-300">
              <div className="text-center w-64">
                  <div className="border-b border-slate-800 pb-1 mb-2 h-8"></div>
                  <p className="font-bold text-slate-700">Firma del Cajero</p>
              </div>
              <div className="text-center w-64">
                  <div className="border-b border-slate-800 pb-1 mb-2 h-8"></div>
                  <p className="font-bold text-slate-700">Firma del Cliente</p>
              </div>
          </div>
        </div>
      )}

      {docType === 'pagare' && loan && (
        <div>
          <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">PAGARÉ NOTARIAL</h2>
          <div className="content space-y-4 text-justify">
            <p>
              POR ESTE PAGARÉ NOTARIAL, yo, <strong>{client.name} {client.lastName || ''}</strong>, dominicano/a, mayor de edad, portador/a de la cédula de identidad y electoral No. <strong>{client.cedula}</strong>, domiciliado/a y residente en {client.address || 'la República Dominicana'}, por medio del presente documento reconozco y declaro que DEBO y PAGARÉ de manera formal e irrevocable a la orden de <strong>{company.name}</strong> o a su legítimo representante, la suma de <strong>RD$ {loan.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> pesos dominicanos.
            </p>
            <p>
              El referido monto incluye el capital prestado. Me comprometo a pagar la totalidad de la suma adeudada mediante <strong>{loan.durationWeeks} cuotas</strong>, de frecuencia <strong>{loan.frequency}</strong>, por un monto de <strong>RD$ {(loan.amount / loan.durationWeeks).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> cada una, más los intereses generados a una tasa del <strong>{loan.interestRate}%</strong>.
            </p>
            <p>
              En caso de incumplimiento en el pago de una o más cuotas en la fecha acordada, {company.termsAndConditions || 'me someteré a los recargos por mora estipulados por la empresa, y reconozco que el saldo total de la deuda se hará exigible de inmediato, sin necesidad de requerimiento previo.'}
            </p>
            <p>
              Para todos los fines y consecuencias legales del presente pagaré notarial, elijo domicilio en la dirección de la empresa acreedora.
            </p>
          </div>
        </div>
      )}

      {docType === 'contrato' && loan && (
        <div>
          <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">CONTRATO DE PRÉSTAMO</h2>
          <div className="content space-y-4 text-justify">
            <p>
              ENTRE: De una parte, <strong>{company.name}</strong>, entidad comercial legalmente constituida, con RNC No. {company.rnc || 'N/A'}, con domicilio en {company.address}, debidamente representada para los fines del presente contrato, quien en lo adelante se denominará <strong>EL ACREEDOR</strong>.
            </p>
            <p>
              Y de la otra parte, el/la señor/a <strong>{client.name} {client.lastName || ''}</strong>, dominicano/a, mayor de edad, con la cédula No. <strong>{client.cedula}</strong>, quien en lo adelante se denominará <strong>EL DEUDOR</strong>.
            </p>
            <p>SE HA CONVENIDO Y PACTADO LO SIGUIENTE:</p>
            <p>
              <strong>PRIMERO:</strong> EL ACREEDOR otorga a EL DEUDOR, quien acepta, un préstamo por la suma de <strong>RD$ {loan.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>, bajo la modalidad de préstamo {loan.loanType}.
            </p>
            <p>
              <strong>SEGUNDO:</strong> EL DEUDOR se compromete a saldar dicho monto en un plazo de <strong>{loan.durationWeeks} semanas/meses</strong>, mediante pagos de frecuencia <strong>{loan.frequency}</strong>. La tasa de interés acordada es del <strong>{loan.interestRate}%</strong>.
            </p>
            <p>
              <strong>TERCERO:</strong> El incumplimiento de los pagos en las fechas establecidas generará cargos por mora. EL DEUDOR autoriza a EL ACREEDOR a realizar gestiones de cobro por las vías legales pertinentes en caso de atraso.
            </p>
          </div>
        </div>
      )}

      {/* Signatures */}
      {(docType === 'pagare' || docType === 'contrato' || docType === 'recibo') && (
        <div className="signatures flex justify-between mt-16 px-10">
          <div className="sig-block text-center w-5/12">
            <div className="border-t border-slate-800 pt-2 text-sm font-bold">{company.name}</div>
            <div className="text-xs text-slate-500 mt-1">Firma / Sello</div>
          </div>
          <div className="sig-block text-center w-5/12">
            <div className="border-t border-slate-800 pt-2 text-sm font-bold">{client.name}</div>
            <div className="text-xs text-slate-500 mt-1">Cliente (Cédula: {client.cedula})</div>
          </div>
        </div>
      )}

      <div className="mt-12 text-center text-xs text-slate-400 font-sans border-t border-slate-200 pt-4">
        Documento generado el {todayStr} a través del sistema UltraMoney.
      </div>
    </div>
  );
};
