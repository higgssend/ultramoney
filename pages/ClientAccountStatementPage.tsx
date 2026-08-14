import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, Download, Share2, Copy, Check, ArrowLeft, Building2, User, 
  Calendar, DollarSign, CheckCircle2, ShieldCheck, Clock, Receipt, 
  CreditCard, AlertTriangle, FileText, Phone, MapPin, Mail, Sparkles, TrendingUp
} from 'lucide-react';
import { useClients, useLoans, useSettings, useAccounting } from '../context/StoreContext';
import { Loan, Client, CompanySettings, Transaction, formatLoanId, formatReceiptId, LoanStatus, Installment } from '../types';
import { insforge } from '../lib/insforge';
import { LoanEngine } from '../utils/LoanEngine';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ClientAccountStatementPage: React.FC = () => {
  const { clientId, id } = useParams<{ clientId?: string; id?: string }>();
  const effectiveClientId = clientId || id || '';
  const navigate = useNavigate();

  const { clients } = useClients();
  const { loans } = useLoans();
  const { companySettings } = useSettings();
  const { transactions } = useAccounting();

  const [client, setClient] = useState<Client | null>(null);
  const [clientLoans, setClientLoans] = useState<Loan[]>([]);
  const [clientTransactions, setClientTransactions] = useState<Transaction[]>([]);
  const [dbCompanySettings, setDbCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // 1. Resolve Client, Loans, Transactions and Company Settings
  useEffect(() => {
    const fetchFullAccountStatementData = async () => {
      if (!effectiveClientId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch company settings from DB as robust fallback
        try {
          const { data: dbSettings } = await insforge.database
            .from('company_settings')
            .select('*')
            .maybeSingle();

          if (dbSettings) {
            setDbCompanySettings({
              name: dbSettings.name || 'UltraMoney Financial',
              rnc: dbSettings.rnc || '',
              phone: dbSettings.phone || '',
              email: dbSettings.email || '',
              address: dbSettings.address || '',
              logoUrl: dbSettings.logourl || dbSettings.logo_url || dbSettings.logoUrl || '',
              lateFeeRate: Number(dbSettings.late_fee_rate || dbSettings.latefeerate) || 5,
              gracePeriodDays: Number(dbSettings.grace_period_days || dbSettings.graceperioddays) || 3
            });
          }
        } catch (e) {
          console.error("Error fetching company settings:", e);
        }
        // Find in local memory store first
        let currentClient = clients.find(c => c.id === effectiveClientId);
        
        // If not in store, fetch from database
        if (!currentClient) {
          const { data: dbClient } = await insforge.database
            .from('clients')
            .select('*')
            .eq('id', effectiveClientId)
            .maybeSingle();

          if (dbClient) {
            currentClient = {
              id: dbClient.id,
              name: dbClient.name,
              lastName: dbClient.lastname || dbClient.last_name || '',
              cedula: dbClient.cedula || 'N/A',
              documentType: dbClient.documenttype || 'Cédula',
              phone: dbClient.phone || '',
              whatsapp: dbClient.whatsapp || dbClient.phone || '',
              email: dbClient.email || '',
              address: dbClient.address || '',
              sector: dbClient.sector || '',
              municipality: dbClient.municipality || '',
              province: dbClient.province || '',
              occupation: dbClient.occupation || '',
              income: Number(dbClient.income) || 0,
              creditScore: Number(dbClient.credit_score || dbClient.creditscore) || 850,
              status: (dbClient.status as Client['status']) || 'Activo',
              sex: (dbClient.sex as Client['sex']) || 'Masculino',
              joinedDate: dbClient.created_at || new Date().toISOString()
            };
          }
        }

        if (currentClient) {
          setClient(currentClient);

          // Get Loans for this client
          let matchedLoans = loans.filter(l => l.clientId === currentClient.id);
          if (matchedLoans.length === 0) {
            const { data: dbLoans } = await insforge.database
              .from('loans')
              .select('*')
              .or(`clientid.eq.${currentClient.id},client_id.eq.${currentClient.id}`)
              .order('created_at', { ascending: false });

            if (dbLoans && dbLoans.length > 0) {
              matchedLoans = dbLoans.map(l => ({
                id: l.id,
                clientId: l.clientid || l.client_id || currentClient.id,
                clientName: `${currentClient.name} ${currentClient.lastName || ''}`.trim(),
                amount: Number(l.amount) || 0,
                interestRate: Number(l.interestrate || l.interest_rate) || 0,
                durationWeeks: Number(l.durationweeks || l.installments) || 12,
                installments: Number(l.installments) || 12,
                frequency: l.frequency || 'Semanal',
                startDate: l.startdate || l.start_date || '',
                nextPaymentDate: l.next_payment_date || l.nextpaymentdate || '',
                status: (l.status as Loan['status']) || 'Activo',
                loanType: (l.loantype || l.loan_type || 'Amortizado') as Loan['loanType'],
                loanCategory: (l.loancategory || l.loan_category) as Loan['loanCategory'],
                totalToPay: Number(l.totaltopay || l.total_to_pay || l.amount) || 0,
                remainingBalance: Number(l.remainingbalance ?? l.remaining_balance ?? l.amount) || 0,
                installmentAmount: Number(l.installmentamount || l.installment_amount) || 0
              }));
            }
          }
          setClientLoans(matchedLoans);

          // Get Transactions for this client
          const loanIds = matchedLoans.map(l => l.id);
          let matchedTransactions = transactions.filter(t => 
            (t.referenceId && loanIds.includes(t.referenceId)) || 
            t.referenceId === currentClient.id ||
            t.description?.includes(currentClient.name)
          );

          if (matchedTransactions.length === 0 && loanIds.length > 0) {
            const { data: dbTransactions } = await insforge.database
              .from('transactions')
              .select('*')
              .or(`referenceid.in.(${loanIds.join(',')}),reference_id.in.(${loanIds.join(',')})`)
              .order('date', { ascending: false });

            if (dbTransactions && dbTransactions.length > 0) {
              matchedTransactions = dbTransactions.map(t => ({
                id: t.id,
                type: t.type as Transaction['type'],
                category: t.category as Transaction['category'],
                amount: Number(t.amount) || 0,
                date: t.date || t.created_at,
                description: t.description || 'Cobro de Cuota',
                referenceId: t.referenceid || t.reference_id,
                paymentMethod: (t.paymentmethod || t.payment_method || 'Efectivo') as Transaction['paymentMethod'],
                paymentType: (t.paymenttype || t.payment_type || 'Interes') as Transaction['paymentType']
              }));
            }
          }
          setClientTransactions(matchedTransactions);
        }
      } catch (err) {
        console.error("Error cargando estado de cuenta del cliente:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullAccountStatementData();
  }, [effectiveClientId, clients, loans, transactions]);

  // 2. Financial Metrics Calculations
  const metrics = useMemo(() => {
    const totalBorrowed = clientLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const totalToPay = clientLoans.reduce((sum, l) => sum + (Number(l.totalToPay) || Number(l.amount) || 0), 0);
    const totalPending = clientLoans.filter(l => l.status !== LoanStatus.PAID).reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
    const totalPaid = clientTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const activeLoans = clientLoans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE);
    const overdueLoans = clientLoans.filter(l => l.status === LoanStatus.OVERDUE);
    const paidLoans = clientLoans.filter(l => l.status === LoanStatus.PAID);

    return {
      totalBorrowed,
      totalToPay,
      totalPending,
      totalPaid,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
      paidLoansCount: paidLoans.length,
      totalLoansCount: clientLoans.length
    };
  }, [clientLoans, clientTransactions]);

  // 3. Upcoming Active Installments
  const upcomingInstallments = useMemo(() => {
    const list: { loan: Loan; installment: Installment }[] = [];
    clientLoans
      .filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE)
      .forEach(loan => {
        try {
          const schedule = LoanEngine.generateAmortizationSchedule(
            loan.amount || 0,
            loan.interestRate || 0,
            loan.installments || loan.durationWeeks || 12,
            loan.frequency || 'Semanal',
            loan.startDate || new Date().toISOString().split('T')[0],
            { amortizationMethod: 'Amortizado' },
            loan.loanType || 'Amortizado'
          );

          schedule.slice(0, 8).forEach(s => {
            list.push({
              loan,
              installment: {
                number: s.installmentNumber,
                date: s.date,
                amount: s.installmentAmount,
                capital: s.principal,
                interest: s.interest,
                paidAmount: 0,
                status: 'Pendiente'
              }
            });
          });
        } catch (e) {
          console.error("Error generando cuotas:", e);
        }
      });
    return list.slice(0, 10);
  }, [clientLoans]);

  // 4. Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Enlace del estado de cuenta copiado al portapapeles");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!client) return;
    const clientFullName = `${client.name} ${client.lastName || ''}`.trim();
    const url = window.location.href;
    const text = `*${companySettings.name}*\n*Estado de Cuenta Integral*\nCliente: ${clientFullName}\nCedula: ${client.cedula}\nBalance Pendiente: RD$ ${metrics.totalPending.toLocaleString('es-DO', { minimumFractionDigits: 2 })}\nTotal Pagado: RD$ ${metrics.totalPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n\nPuede consultar y descargar su estado de cuenta oficial aqui:\n${url}`;
    const targetPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : '';
    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone.length === 10 ? '1' + targetPhone : targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-account-statement');
    if (!element) return;

    try {
      setIsExportingPdf(true);
      toast.info("Generando documento PDF oficial de alta resolución...");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeName = client ? `${client.name}_${client.lastName || ''}`.replace(/\s+/g, '_') : 'Cliente';
      pdf.save(`Estado_de_Cuenta_${safeName}.pdf`);
      toast.success("Estado de cuenta descargado exitosamente");
    } catch (e) {
      console.error("Error generando PDF:", e);
      toast.error("Error al exportar PDF. Puede usar la opción de Imprimir para guardarlo.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Generando Estado de Cuenta Integral...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Cliente no encontrado</h2>
        <p className="text-sm text-slate-500">No se localizó el registro del cliente especificado.</p>
        <button 
          onClick={() => navigate('/clientes')} 
          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors"
        >
          Volver a Clientes
        </button>
      </div>
    );
  }

  const clientFullName = `${client.name} ${client.lastName || ''}`.trim();
  const issueDate = new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
  const issueTime = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true });

  const effectiveCompany = companySettings?.name ? companySettings : (dbCompanySettings || companySettings || { name: 'UltraMoney Financial' });
  const effectiveLogo = effectiveCompany.logoUrl || effectiveCompany.logourl;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 lg:p-8 font-sans pb-20">
      
      {/* Top Floating Action Toolbar (Hidden when printing) */}
      <div className="max-w-5xl mx-auto mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Estado de Cuenta Integral
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expediente: <span className="font-bold text-slate-700 dark:text-slate-200">{clientFullName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar Enlace'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            title="Compartir por WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" colored={false} />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Exportando...' : 'Descargar PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Canvas */}
      <div 
        id="printable-account-statement"
        className="max-w-5xl mx-auto bg-white text-slate-900 p-6 sm:p-12 rounded-3xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-full space-y-8"
      >
        {/* Document Header & Company Identification */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {effectiveLogo ? (
                <img 
                  src={effectiveLogo} 
                  alt={effectiveCompany.name || 'Logo Empresa'} 
                  className="h-14 w-auto max-w-[190px] max-h-16 object-contain rounded-xl"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
                  {effectiveCompany.name ? effectiveCompany.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {effectiveCompany.name || 'UltraMoney Financial'}
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Soluciones Financieras & Gestión de Cartera
                </p>
              </div>
            </div>
            <div className="pt-2 text-xs text-slate-600 space-y-0.5">
              <p className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {effectiveCompany.address || 'Santo Domingo, República Dominicana'}
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Tel: {effectiveCompany.phone || '(809) 555-0199'} | RNC: {effectiveCompany.rnc || '1-32-45678-9'}
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {effectiveCompany.email || 'cobranzas@ultramoney.do'}
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-mono font-black text-xs rounded-lg border border-indigo-200 uppercase">
              ESTADO DE CUENTA OFICIAL
            </span>
            <p className="text-xs font-mono font-bold text-slate-700">
              Expediente No: <span className="text-indigo-600">EXP-{client.id.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-xs text-slate-500">
              Fecha de Emisión: <strong className="text-slate-800">{issueDate}</strong>
            </p>
            <p className="text-xs text-slate-400">
              Hora: {issueTime}
            </p>
          </div>
        </div>

        {/* Client Complete Information Profile Banner */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-black tracking-wider">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Información General del Titular</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {clientFullName}
            </h3>
            <div className="space-y-1 text-xs text-slate-600">
              <p>
                <span className="font-semibold text-slate-400">Documento / Cédula:</span>{' '}
                <strong className="text-slate-900 font-mono">{client.cedula}</strong> ({client.documentType || 'Cédula'})
              </p>
              <p>
                <span className="font-semibold text-slate-400">Teléfono Celular:</span>{' '}
                <strong className="text-slate-900">{client.phone}</strong>
                {client.whatsapp && <span className="text-slate-400"> (WhatsApp: {client.whatsapp})</span>}
              </p>
              <p>
                <span className="font-semibold text-slate-400">Dirección Residencial:</span>{' '}
                <span className="text-slate-900">{client.address || 'No registrada'}</span>
                {client.sector && <span>, {client.sector}</span>}
                {client.province && <span>, {client.province}</span>}
              </p>
              {client.occupation && (
                <p>
                  <span className="font-semibold text-slate-400">Ocupación / Actividad:</span>{' '}
                  <span className="text-slate-900">{client.occupation}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-black tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Condición & Perfil Crediticio</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs">
                Score: {client.creditScore || 850} / 850
              </div>
              <div className={`px-3 py-1.5 rounded-xl font-black text-xs ${
                metrics.overdueLoansCount > 0 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {metrics.overdueLoansCount > 0 ? 'Con Atrasos' : 'Al Día / Frecuente'}
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-600 pt-1">
              <p>
                <span className="font-semibold text-slate-400">Estado de Cuenta:</span>{' '}
                <strong className="text-slate-900">{client.status}</strong>
              </p>
              <p>
                <span className="font-semibold text-slate-400">Contratos Históricos:</span>{' '}
                <span className="text-slate-900">{metrics.totalLoansCount} préstamos</span> ({metrics.activeLoansCount} activos, {metrics.paidLoansCount} saldados)
              </p>
              <p>
                <span className="font-semibold text-slate-400">Moneda Oficial:</span>{' '}
                <span className="text-slate-900 font-bold">Pesos Dominicanos (RD$)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Consolidated Financial Summary (KPIs) */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Consolidado Financiero del Cliente
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Prestado</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 mt-1 block">
                RD$ {metrics.totalBorrowed.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">{metrics.totalLoansCount} Contratos</span>
            </div>

            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-left">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Pagado</span>
              <span className="text-lg sm:text-xl font-black text-emerald-700 mt-1 block">
                RD$ {metrics.totalPaid.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">{clientTransactions.length} Pagos registrados</span>
            </div>

            <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 text-left">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Balance Pendiente</span>
              <span className="text-lg sm:text-xl font-black text-rose-700 mt-1 block">
                RD$ {metrics.totalPending.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-rose-600 font-semibold">Deuda Total Activa</span>
            </div>

            <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-left">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Préstamos Activos</span>
              <span className="text-lg sm:text-xl font-black text-indigo-700 mt-1 block">
                {metrics.activeLoansCount}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">
                {metrics.overdueLoansCount > 0 ? `${metrics.overdueLoansCount} en atraso` : 'Sin atrasos'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Detailed Loans Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              1. Resumen de Préstamos y Contratos
            </h4>
            <span className="text-xs text-slate-400 font-semibold">
              {clientLoans.length} registros
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[11px]">
                  <th className="p-3">No. Préstamo</th>
                  <th className="p-3">Fecha Inicio</th>
                  <th className="p-3">Tipo / Frecuencia</th>
                  <th className="p-3 text-right">Monto Original</th>
                  <th className="p-3 text-right">Tasa</th>
                  <th className="p-3 text-right">Total a Pagar</th>
                  <th className="p-3 text-right">Balance Pendiente</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientLoans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      No hay préstamos asociados a este cliente.
                    </td>
                  </tr>
                ) : (
                  clientLoans.map(loan => (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-black text-indigo-600">
                        {formatLoanId(loan.id, loan.loanCategory, loan.loanType)}
                      </td>
                      <td className="p-3 text-slate-600">
                        {loan.startDate}
                      </td>
                      <td className="p-3 text-slate-700">
                        <span className="font-semibold">{loan.loanType}</span>
                        <span className="text-slate-400 block text-[10px]">{loan.frequency}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        RD$ {Number(loan.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right text-slate-600 font-semibold">
                        {loan.interestRate}%
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700">
                        RD$ {Number(loan.totalToPay || loan.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-black text-rose-600">
                        RD$ {Number(loan.remainingBalance).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                          loan.status === LoanStatus.PAID 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : loan.status === LoanStatus.OVERDUE 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Complete Payments & Receipts History Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-600" />
              2. Historial de Pagos y Recibos Registrados
            </h4>
            <span className="text-xs text-slate-400 font-semibold">
              {clientTransactions.length} pagos realizados
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[11px]">
                  <th className="p-3">No. Recibo</th>
                  <th className="p-3">Fecha y Hora</th>
                  <th className="p-3">Préstamo Ref.</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Concepto / Nota</th>
                  <th className="p-3 text-right">Monto Pagado</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No hay registros de pagos para este cliente aún.
                    </td>
                  </tr>
                ) : (
                  clientTransactions.map(t => {
                    const parsedDate = t.date ? new Date(t.date) : new Date();
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-black text-indigo-600">
                          {formatReceiptId(t.id)}
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          {parsedDate.toLocaleDateString('es-DO', { month: 'short', day: 'numeric', year: 'numeric' })} • {parsedDate.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {t.referenceId ? formatLoanId(t.referenceId) : '-'}
                        </td>
                        <td className="p-3 text-slate-700 font-semibold">
                          {t.paymentMethod || 'Efectivo'}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate font-medium">
                          {t.description || 'Abono a Préstamo'}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600 whitespace-nowrap">
                          +RD$ {Number(t.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-block bg-emerald-100 text-emerald-800">
                            Aplicado
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Upcoming Installments Schedule (If active loans exist) */}
        {upcomingInstallments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              3. Próximos Vencimientos y Calendario de Cuotas
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[11px]">
                    <th className="p-3">Préstamo</th>
                    <th className="p-3">No. Cuota</th>
                    <th className="p-3">Fecha Vencimiento</th>
                    <th className="p-3 text-right">Capital</th>
                    <th className="p-3 text-right">Interés</th>
                    <th className="p-3 text-right">Monto Cuota</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcomingInstallments.map((item, idx) => (
                    <tr key={`${item.loan.id}-${item.installment.number}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-600">
                        {formatLoanId(item.loan.id, item.loan.loanCategory, item.loan.loanType)}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        Cuota #{item.installment.number}
                      </td>
                      <td className="p-3 text-slate-800 font-semibold">
                        {item.installment.date}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        RD$ {Number(item.installment.capital || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        RD$ {Number(item.installment.interest || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        RD$ {Number(item.installment.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-block bg-slate-100 text-slate-700">
                          Pendiente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legal Certification Terms & Official Signatures */}
        <div className="pt-6 border-t border-slate-200 space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed text-justify">
            <p>
              <strong>Certificación Oficial:</strong> El presente documento refleja de manera fehaciente el historial completo de operaciones, créditos y recaudaciones asociadas al cliente <strong>{clientFullName}</strong> en los registros contables de <strong>{effectiveCompany.name || 'UltraMoney'}</strong> hasta la fecha de corte <strong>{issueDate}</strong>. Este estado de cuenta es emitido para fines informativos y legales correspondientes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 pt-8">
            <div className="text-center space-y-2">
              <div className="border-b-2 border-slate-900 w-4/5 mx-auto h-12"></div>
              <p className="text-xs font-black text-slate-900 uppercase">{clientFullName}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Firma del Titular / Cliente</p>
              <p className="text-[10px] text-slate-400 font-mono">Cédula: {client.cedula}</p>
            </div>

            <div className="text-center space-y-2">
              <div className="border-b-2 border-slate-900 w-4/5 mx-auto h-12"></div>
              <p className="text-xs font-black text-slate-900 uppercase">{effectiveCompany.name || 'UltraMoney'}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Firma Autorizada & Sello Oficial</p>
              <p className="text-[10px] text-slate-400 font-mono">RNC: {effectiveCompany.rnc || '1-32-45678-9'}</p>
            </div>
          </div>

          <div className="text-center pt-4 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
            <span>Documento generado por UltraMoney Platform</span>
            <span className="font-mono">ID Verificación: SEC-{client.id.slice(0, 12).toUpperCase()}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
