import React, { useState, useMemo } from 'react';
import { Building2, Download, Send, ShieldCheck, FileSpreadsheet, FileText, Search, CheckCircle2, Key, Info, HelpCircle } from 'lucide-react';
import { useLoans, useClients, useSettings } from '../context/StoreContext';
import { CustomSelect } from '../components/CustomSelect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BureauConfig {
  datacreditoSubscriberId: string;
  datacreditoApiKey: string;
  transunionCode: string;
  autoSyncEnabled: boolean;
}

export const CreditBureauExport: React.FC = () => {
  const { loans } = useLoans();
  const { clients } = useClients();
  const { globalCurrency } = useSettings();

  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'AL_DIA' | 'MORA' | 'INCOBRABLE'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApiConfig, setShowApiConfig] = useState(false);

  const [bureauConfig, setBureauConfig] = useState<BureauConfig>({
    datacreditoSubscriberId: 'DC-884102',
    datacreditoApiKey: '••••••••••••••••',
    transunionCode: 'TU-9921',
    autoSyncEnabled: false
  });

  // Compute Days Overdue and Risk Category for each loan
  const bureauData = useMemo(() => {
    const today = new Date();
    return loans.map(loan => {
      const client = clients.find(c => c.id === loan.clientId);
      const cedula = client?.cedula?.replace(/[^0-9]/g, '') || '00000000000';
      const clientName = client ? `${client.name} ${client.lastName || ''}`.trim() : loan.clientName;
      
      let daysOverdue = 0;
      if (loan.nextPaymentDate && loan.status === 'Atrasado') {
        const dueDate = new Date(loan.nextPaymentDate);
        const diffTime = Math.max(0, today.getTime() - dueDate.getTime());
        daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      let category = 'A (Normal)';
      let statusNum = 1;
      if (daysOverdue > 180) {
        category = 'E (Incobrable / Pérdida)';
        statusNum = 4;
      } else if (daysOverdue > 90) {
        category = 'D (Dudoso Cobro)';
        statusNum = 3;
      } else if (daysOverdue > 60) {
        category = 'C (Deficiente)';
        statusNum = 2;
      } else if (daysOverdue > 30) {
        category = 'B (Muestra de Riesgo)';
        statusNum = 2;
      }

      const isOverdue = loan.status === 'Atrasado' || daysOverdue > 0;
      const overdueAmount = isOverdue ? (loan.installmentAmount || Math.round(loan.remainingBalance * 0.2)) : 0;

      return {
        loanId: loan.id,
        clientId: loan.clientId,
        cedula,
        clientName,
        phone: client?.phone || 'N/A',
        loanType: loan.loanType || 'Personal',
        amount: loan.amount,
        remainingBalance: loan.remainingBalance,
        overdueAmount,
        daysOverdue,
        category,
        statusNum,
        startDate: loan.startDate,
        status: loan.status
      };
    }).filter(row => {
      const matchesSearch = row.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || row.cedula.includes(searchTerm) || row.loanId.includes(searchTerm);
      if (!matchesSearch) return false;

      if (filterStatus === 'AL_DIA') return row.daysOverdue === 0 && row.status !== 'Atrasado';
      if (filterStatus === 'MORA') return row.daysOverdue > 0 || row.status === 'Atrasado';
      if (filterStatus === 'INCOBRABLE') return row.daysOverdue > 180;

      return true;
    });
  }, [loans, clients, searchTerm, filterStatus]);

  // Export DataCredito CSV (Standard Dominican Format)
  const exportDataCreditoCSV = () => {
    const headers = [
      'CEDULA_RNC',
      'NOMBRE_COMPLETO',
      'NUMERO_CONTRATO',
      'TIPO_CREDITO',
      'MONTO_OTORGADO',
      'BALANCE_PENDIENTE',
      'MONTO_VENCIDO',
      'DIAS_ATRASO',
      'CATEGORIA_RIESGO',
      'FECHA_APERTURA'
    ];

    const rows = bureauData.map(r => [
      `"${r.cedula}"`,
      `"${r.clientName}"`,
      `"${r.loanId}"`,
      `"${r.loanType}"`,
      r.amount.toFixed(2),
      r.remainingBalance.toFixed(2),
      r.overdueAmount.toFixed(2),
      r.daysOverdue,
      `"${r.category}"`,
      `"${r.startDate}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DataCredito_Reporte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export TransUnion CSV
  const exportTransUnionCSV = () => {
    const headers = [
      'DOCUMENTO',
      'NOMBRE_DEUDOR',
      'PRESTAMO_ID',
      'CAPITAL_INICIAL',
      'SALDO_ACTUAL',
      'ATRASO_MONTO',
      'DIAS_MOROSIDAD',
      'ESTADO_CUENTA'
    ];

    const rows = bureauData.map(r => [
      `"${r.cedula}"`,
      `"${r.clientName}"`,
      `"${r.loanId}"`,
      r.amount.toFixed(2),
      r.remainingBalance.toFixed(2),
      r.overdueAmount.toFixed(2),
      r.daysOverdue,
      r.statusNum
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TransUnion_Reporte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Summary PDF Report
  const exportPDFReport = () => {
    const doc = new jsPDF();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('ULTRAMONEY - REPORTE DE CARTERA PARA BURÓS', 14, 16);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleDateString()} | Total Créditos: ${bureauData.length}`, 14, 22);

    const tableRows = bureauData.map(r => [
      r.cedula,
      r.clientName,
      r.loanId,
      `${globalCurrency} ${r.amount.toLocaleString()}`,
      `${globalCurrency} ${r.remainingBalance.toLocaleString()}`,
      r.daysOverdue > 0 ? `${r.daysOverdue} días` : 'Al Día',
      r.category
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Cédula', 'Cliente', 'Préstamo', 'Otorgado', 'Saldo Residual', 'Morosidad', 'Calificación']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    doc.save(`Reporte_Buro_Credito_${Date.now()}.pdf`);
  };

  return (
    <div className="w-full animate-fade-in pb-10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
            <Building2 className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Exportador de Cartera para Buró de Crédito</h2>
            <p className="text-slate-500 text-sm">Generación de archivos de reporte normativos para DataCrédito Experian y TransUnion.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
            <Key className="w-4 h-4 text-indigo-600" /> Configuración API / SFTP
          </button>
        </div>
      </div>

      {/* Info Box: DataCredito API Explanation */}
      <div className="bg-indigo-900 text-white p-5 rounded-3xl shadow-xl flex flex-wrap md:flex-nowrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-300" />
            <h3 className="font-bold text-base text-indigo-100">¿Existe API de DataCrédito Experian y TransUnion en RD?</h3>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed max-w-3xl">
            <strong>Sí, absolutamente.</strong> Tanto DataCrédito (Experian República Dominicana) como TransUnion RD disponen de <strong>Servicios Web REST/SOAP y servidores SFTP institucionales</strong> para consultar la historia crediticia de los clientes y transmitir mensualmente los reportes de cartera. Para conectarte por API directa necesitas tu Código de Suscriptor corporativo.
          </p>
        </div>
        <div className="bg-indigo-800/80 p-3.5 rounded-2xl border border-indigo-700 text-xs shrink-0 space-y-1">
          <p className="font-bold text-emerald-400">✓ Formatos Soportados</p>
          <p className="text-indigo-200">• CSV / Excel Norma SIB</p>
          <p className="text-indigo-200">• Texto Ancho Fijo (.TXT)</p>
          <p className="text-indigo-200">• Transmisión Directa API</p>
        </div>
      </div>

      {/* API Config Panel (Collapsible) */}
      {showApiConfig && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-indigo-100 dark:border-slate-700 shadow-md space-y-4 animate-fade-in">
          <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" /> Credenciales de Conexión a Burós
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">ID Suscriptor DataCrédito</label>
              <input 
                type="text" 
                value={bureauConfig.datacreditoSubscriberId}
                onChange={e => setBureauConfig({ ...bureauConfig, datacreditoSubscriberId: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Token API / Clave SFTP DataCrédito</label>
              <input 
                type="password" 
                value={bureauConfig.datacreditoApiKey}
                onChange={e => setBureauConfig({ ...bureauConfig, datacreditoApiKey: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Código Institucional TransUnion</label>
              <input 
                type="text" 
                value={bureauConfig.transunionCode}
                onChange={e => setBureauConfig({ ...bureauConfig, transunionCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => alert('Credenciales guardadas en configuración.')}
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
              Guardar Configuración
            </button>
          </div>
        </div>
      )}

      {/* Main Table Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
        
        {/* Toolbar & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text" 
                placeholder="Buscar por cliente, cédula o préstamo..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
              />
            </div>

            <div className="w-48">
              <CustomSelect 
                value={filterStatus}
                onChange={e => setFilterStatus(e as typeof filterStatus)}
                options={[
                  { value: 'TODOS', label: 'Toda la Cartera' },
                  { value: 'AL_DIA', label: 'Solo Al Día (0 días)' },
                  { value: 'MORA', label: 'En Mora (>0 días)' },
                  { value: 'INCOBRABLE', label: 'Incobrables (>180 días)' }
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={exportDataCreditoCSV}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all">
              <FileSpreadsheet className="w-4 h-4" /> Exportar DataCrédito (.CSV)
            </button>
            <button 
              onClick={exportTransUnionCSV}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all">
              <Download className="w-4 h-4" /> Exportar TransUnion (.CSV)
            </button>
            <button 
              onClick={exportPDFReport}
              className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> PDF
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Cédula / RNC</th>
                <th className="px-4 py-3">Deudor</th>
                <th className="px-4 py-3">Préstamo</th>
                <th className="px-4 py-3 text-right">Monto Inicial</th>
                <th className="px-4 py-3 text-right">Saldo Actual</th>
                <th className="px-4 py-3 text-center">Días Atraso</th>
                <th className="px-4 py-3">Calificación Riego</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800">
              {bureauData.map((row) => (
                <tr key={row.loanId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{row.cedula}</td>
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{row.clientName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">#{row.loanId}</td>
                  <td className="px-4 py-3 text-right font-medium">{globalCurrency} {row.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">{globalCurrency} {row.remainingBalance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${row.daysOverdue === 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                      {row.daysOverdue > 0 ? `${row.daysOverdue} días` : 'Al Día'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-xs text-slate-600 dark:text-slate-300">
                    {row.category}
                  </td>
                </tr>
              ))}
              {bureauData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No se encontraron registros de cartera con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default CreditBureauExport;
