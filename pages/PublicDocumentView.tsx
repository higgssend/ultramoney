import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, Share2, Copy, Check, FileText, Download, ShieldCheck, 
  ArrowLeft, Building2, User, Calendar, DollarSign, CheckCircle2, Award
} from 'lucide-react';
import { insforge } from '../lib/insforge';
import { Loan, Client, CompanySettings, formatLoanId } from '../types';
import { LoanEngine } from '../utils/LoanEngine';
import { toast } from 'sonner';

export const PublicDocumentView: React.FC = () => {
  const { docType, loanId } = useParams<{ docType: string; loanId: string }>();
  const navigate = useNavigate();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!loanId) return;
      try {
        const { data: loanData } = await insforge.database.from('loans').select('*').eq('id', loanId).maybeSingle();
        const { data: settingsData } = await insforge.database.from('company_settings').select('*').limit(1).maybeSingle();

        if (loanData) {
          const mappedLoan: Loan = {
            id: loanData.id,
            clientId: loanData.clientid || loanData.client_id,
            clientName: loanData.clientname || loanData.client_name || 'Cliente',
            amount: Number(loanData.amount) || 0,
            interestRate: Number(loanData.interestrate || loanData.interest_rate) || 0,
            durationWeeks: Number(loanData.durationweeks || loanData.installments) || 12,
            installments: Number(loanData.installments) || 12,
            frequency: loanData.frequency || 'Semanal',
            startDate: loanData.startdate || loanData.start_date || new Date().toISOString().split('T')[0],
            nextPaymentDate: loanData.next_payment_date || loanData.startDate,
            status: loanData.status || 'Activo',
            loanType: loanData.loantype || loanData.loanType || 'Amortizado (Cuota Fija)',
            totalToPay: Number(loanData.totaltopay || loanData.amount) || 0,
            remainingBalance: Number(loanData.remainingbalance ?? loanData.amount) || 0,
            installmentAmount: Number(loanData.installmentamount) || 0,
            itemPrice: loanData.item_price ? Number(loanData.item_price) : undefined,
            downPayment: loanData.down_payment ? Number(loanData.down_payment) : undefined,
            financedAmount: loanData.financed_amount ? Number(loanData.financed_amount) : undefined,
            collateral: loanData.collateral,
          };
          setLoan(mappedLoan);

          if (mappedLoan.clientId) {
            const { data: clientData } = await insforge.database.from('clients').select('*').eq('id', mappedLoan.clientId).maybeSingle();
            if (clientData) {
              setClient({
                id: clientData.id,
                name: clientData.name,
                lastName: clientData.lastname || clientData.lastName || '',
                cedula: clientData.cedula || 'N/A',
                phone: clientData.phone || '',
                address: clientData.address || '',
                occupation: clientData.occupation || '',
                income: Number(clientData.income) || 0,
                creditScore: 100,
                sex: 'Masculino',
                status: 'Activo',
                joinedDate: new Date().toISOString()
              });
            }
          }
        }

        if (settingsData) {
          setSettings({
            name: settingsData.company_name || settingsData.name || 'UltraMoney Financial',
            companyName: settingsData.company_name || settingsData.name || 'UltraMoney Financial',
            rnc: settingsData.rnc || '1-32-45678-9',
            phone: settingsData.phone || '(809) 555-0199',
            address: settingsData.address || 'Santo Domingo, República Dominicana',
            email: settingsData.email || 'info@ultramoney.do',
            currency: 'DOP',
            termsAndConditions: settingsData.terms_and_conditions || '',
            slogan: settingsData.slogan || 'Tu socio financiero de confianza'
          });
        }
      } catch (err) {
        console.error("Error fetching public document:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [loanId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Enlace del documento copiado al portapapeles');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    if (!loan) return;
    const docName = docType === 'contrato' ? 'Contrato de Préstamo' : docType === 'pagare' ? 'Pagaré Notarial' : docType === 'saldo' ? 'Carta de Saldo' : 'Estado de Cuenta';
    const text = `Hola *${client ? `${client.name} ${client.lastName}` : loan.clientName}*,\n\nAquí puedes ver y descargar tu *${docName}* del Préstamo #${formatLoanId(loan.id)}:\n\n*Monto:* RD$ ${loan.amount.toLocaleString()}\n*Tasa:* ${loan.interestRate}%\n*Frecuencia:* ${loan.frequency}\n*Estado:* ${loan.status}\n\nAccede al documento legal aquí:\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-sm text-indigo-200">Cargando Documento Oficial...</p>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center shadow-xl max-w-md">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Documento No Encontrado</h2>
          <p className="text-xs text-slate-500 mt-2">El enlace proporcionado es inválido o el préstamo ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  const isRedito = (loan.loanType || '').includes('Rédito') || (loan.loanType || '').includes('Pagaré');
  const count = isRedito ? 1 : (loan.durationWeeks || 12);
  const schedule = LoanEngine.generateAmortizationSchedule(
    loan.amount, loan.interestRate, count, loan.frequency, loan.startDate,
    { amortizationMethod: 'Amortizado' }, loan.loanType
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-8 font-sans print:p-0 print:bg-white text-slate-900">
      
      {/* Top Floating Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-sm text-slate-900 dark:text-white">
              {docType === 'contrato' ? 'Contrato de Préstamo' : docType === 'pagare' ? 'Pagaré Notarial' : docType === 'saldo' ? 'Carta de Saldo Cero' : 'Estado de Cuenta'}
            </h1>
            <p className="text-[11px] text-slate-500">Préstamo #{formatLoanId(loan.id)} · {loan.clientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar Link'}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
          >
            <Share2 className="w-4 h-4" /> Compartir por WhatsApp
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-12 rounded-3xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-full space-y-8">
        
        {/* Header Branding */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                U
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{settings?.companyName || 'UltraMoney SRL'}</h2>
            </div>
            <p className="text-xs text-slate-600 font-bold">{settings?.address}</p>
            <p className="text-xs text-slate-500">RNC: {settings?.rnc} | Tel: {settings?.phone}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-lg border border-indigo-200 uppercase mb-1">
              DOCUMENTO OFICIAL
            </span>
            <p className="text-xs text-slate-500 font-mono font-bold">No. Ref: #{formatLoanId(loan.id)}</p>
            <p className="text-xs text-slate-400">Fecha Emisión: {loan.startDate}</p>
          </div>
        </div>

        {/* Client & Loan Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Datos del Cliente</p>
            <p className="text-sm font-black text-slate-900">{client ? `${client.name} ${client.lastName}` : loan.clientName}</p>
            <p className="text-slate-600">Cédula / Documento: <strong>{client?.cedula || 'N/A'}</strong></p>
            <p className="text-slate-600">Teléfono: <strong>{client?.phone || 'N/A'}</strong></p>
            <p className="text-slate-600">Dirección: <strong>{client?.address || 'N/A'}</strong></p>
          </div>

          <div className="space-y-1.5 text-xs border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Resumen Financiero del Préstamo</p>
            <p className="text-slate-600">Capital Prestado: <strong className="text-slate-900 text-sm font-black">RD$ {loan.amount.toLocaleString()}</strong></p>
            <p className="text-slate-600">Modalidad: <strong>{loan.loanType}</strong></p>
            <p className="text-slate-600">Tasa de Interés: <strong>{loan.interestRate}%</strong> | Frecuencia: <strong>{loan.frequency}</strong></p>
            <p className="text-slate-600">Plazo Pactado: <strong>{isRedito ? 'Indefinido (Pagaré Abierto)' : `${count} cuotas`}</strong></p>
            <p className="text-slate-600">Balance Pendiente: <strong className="text-rose-600 font-bold">RD$ {loan.remainingBalance.toLocaleString()}</strong></p>
          </div>
        </div>

        {/* Dynamic Legal Content according to docType */}
        {docType === 'saldo' ? (
          /* CARTA DE SALDO CERO */
          <div className="space-y-6 py-4">
            <div className="text-center bg-emerald-50 border border-emerald-200 p-8 rounded-3xl space-y-3">
              <Award className="w-16 h-16 text-emerald-600 mx-auto" />
              <h3 className="text-2xl font-black text-emerald-900 uppercase">Certificación de Saldo Cero</h3>
              <p className="text-xs text-emerald-700 max-w-lg mx-auto font-medium">
                Se hace constar que el cliente <strong>{loan.clientName}</strong> ha liquidado en su totalidad la deuda correspondiente al Préstamo <strong>#{formatLoanId(loan.id)}</strong>, no existiendo ningún saldo ni obligación pendiente a la fecha.
              </p>
            </div>
          </div>
        ) : docType === 'pagare' ? (
          /* PAGARÉ NOTARIAL */
          <div className="space-y-4 text-xs leading-relaxed text-justify border-t border-b border-slate-200 py-6">
            <h3 className="text-center text-sm font-black uppercase text-slate-900 underline mb-4">PAGARÉ NOTARIAL A LA ORDEN</h3>
            <p>
              Por medio del presente documento, yo <strong>{loan.clientName}</strong>, con cédula de identidad No. <strong>{client?.cedula || 'N/A'}</strong>, declaro de manera libre e incondicional que me obligo a pagar a la orden de <strong>{settings?.companyName || 'UltraMoney SRL'}</strong> la suma de <strong>RD$ {loan.amount.toLocaleString()}</strong> por concepto de capital prestado.
            </p>
            <p>
              Dicha suma devengará una tasa de interés acordada del <strong>{loan.interestRate}%</strong> bajo la modalidad de pagos <strong>{loan.frequency}</strong>. En caso de mora o incumplimiento, me comprometo a pagar los recargos estipulados y acepto el embargo u oclusión de garantías registradas.
            </p>
          </div>
        ) : docType === 'estado' ? (
          /* ESTADO DE CUENTA Y TABLA DE AMORTIZACIÓN */
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Tabla de Amortización y Plan de Pagos</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Capital</th>
                    <th className="px-4 py-3 text-right">Interés</th>
                    <th className="px-4 py-3 text-right">Cuota Total</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedule.map(row => (
                    <tr key={row.installmentNumber}>
                      <td className="px-4 py-2.5 font-bold font-mono">#{row.installmentNumber}</td>
                      <td className="px-4 py-2.5">{row.date}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-emerald-700">RD$ {row.principal.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-rose-600">RD$ {row.interest.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-black">RD$ {row.total.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono">RD$ {row.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CONTRATO COMPLETO DE PRÉSTAMO */
          <div className="space-y-4 text-xs leading-relaxed text-justify border-t border-b border-slate-200 py-6">
            <h3 className="text-center text-sm font-black uppercase text-slate-900 underline mb-4">CONTRATO DE PRÉSTAMO CON GARANTÍA</h3>
            <p>
              ENTRE DE UNA PARTE: <strong>{settings?.companyName || 'UltraMoney SRL'}</strong>, RNC No. {settings?.rnc}, con domicilio social en {settings?.address}, denominada "LA PRESTADORA".
            </p>
            <p>
              Y DE LA OTRA PARTE: <strong>{loan.clientName}</strong>, Cédula No. {client?.cedula || 'N/A'}, denominada "EL DEUDOR".
            </p>
            <p>
              <strong>PRIMERO:</strong> LA PRESTADORA otorga un crédito a favor de EL DEUDOR por la suma capital de <strong>RD$ {loan.amount.toLocaleString()}</strong>.
            </p>
            <p>
              <strong>SEGUNDO:</strong> EL DEUDOR acepta pagar dicho capital más un interés del <strong>{loan.interestRate}%</strong> bajo pagos periódicos <strong>{loan.frequency}s</strong>.
            </p>
          </div>
        )}

        {/* Signatures Section */}
        <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <div className="border-t border-slate-900 pt-2 font-bold">{loan.clientName}</div>
            <p className="text-slate-500 text-[10px]">Firma del Cliente / Deudor</p>
          </div>
          <div>
            <div className="border-t border-slate-900 pt-2 font-bold">{settings?.companyName || 'UltraMoney SRL'}</div>
            <p className="text-slate-500 text-[10px]">Firma Autorizada / Prestador</p>
          </div>
        </div>

        {/* Footer Security Watermark */}
        <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Documento Firmado Digitalmente y Validador Oficial</span>
          <span>UltraMoney SaaS Engine</span>
        </div>

      </div>
    </div>
  );
};
