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
        <div>
          <h2 className="title text-center text-lg font-bold uppercase my-6 tracking-wide underline">RECIBO DE PAGO</h2>
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
            <div className="font-sans text-sm">
              <p><strong>Recibo No:</strong> {transaction?.id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
              <p><strong>Fecha:</strong> {transaction?.date ? new Date(transaction.date).toLocaleDateString('es-DO') : todayStr}</p>
            </div>
            <div className="font-sans text-xl font-bold bg-slate-100 px-4 py-2 rounded-lg border border-slate-300">
              Monto: RD$ {transaction?.amount?.toLocaleString('es-DO', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>
          
          <div className="content space-y-4 text-justify">
            <p>
              HEMOS RECIBIDO DE: <strong>{client.name} {client.lastName || ''}</strong> (Cédula: {client.cedula}), la suma de <strong>RD$ {transaction?.amount?.toLocaleString('es-DO', { minimumFractionDigits: 2 }) || '0.00'}</strong> pesos dominicanos.
            </p>
            <p>
              <strong>Por Concepto De:</strong> {transaction?.description || 'Abono a Préstamo'}
            </p>
            {loan && (
              <p>
                <strong>Préstamo Asociado:</strong> {loan.loanType} - Monto Original: RD$ {loan.amount.toLocaleString('es-DO')}
              </p>
            )}
            {loan && (
              <div className="mt-6 border border-slate-200 rounded p-4 bg-slate-50 font-sans text-sm">
                <p><strong>Saldo Anterior:</strong> RD$ {(loan.remainingBalance + (transaction?.amount || 0)).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                <p className="font-bold text-lg mt-2 text-indigo-700"><strong>Saldo Actual:</strong> RD$ {loan.remainingBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
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
