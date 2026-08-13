import React, { useState } from 'react';
import { Search, Eye, Download, X, User, ShoppingBag, Clock, CheckCircle, ChevronUp, AlertCircle, FileText, Share2, MessageCircle, Mail, ChevronLeft, Filter, Shield, DollarSign, Award, Tag } from 'lucide-react';
import { Invoice } from '../types';
import { useNavigate } from 'react-router-dom';
import { useClients, useLoans, useAccounting, useSettings } from '../context/StoreContext';

const Invoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'todos' | 'cierres' | 'legales' | 'ncf'>('todos');
  
  const navigate = useNavigate();
  const { transactions } = useAccounting();
  const { clients } = useClients();
  const { loans } = useLoans();
  const { companySettings } = useSettings();

  // Helper to resolve real client name from loan or client record
  const getClientName = (referenceId?: string, description?: string): string => {
    if (referenceId) {
      const loan = loans.find(l => l.id === referenceId);
      if (loan && loan.clientName && loan.clientName !== 'Sin Nombre' && loan.clientName !== 'Cliente') {
        return loan.clientName;
      }
      const client = clients.find(c => c.id === referenceId || c.id === loan?.clientId);
      if (client) {
        return `${client.name} ${client.lastName || ''}`.trim();
      }
    }
    if (description && description.includes(' - ')) {
      const parts = description.split(' - ');
      if (parts[1] && !parts[1].includes('REC-') && !parts[1].includes('PRES-')) {
        return parts[1];
      }
    }
    // Fallback search in clients list for partial match
    if (description) {
      const match = clients.find(c => description.toLowerCase().includes(c.name.toLowerCase()));
      if (match) return `${match.name} ${match.lastName || ''}`.trim();
    }
    return 'Cliente General';
  };

  // Generate REAL Invoices (Gastos de Cierre, Honorarios Legales, Comprobantes Fiscales NCF y Servicios)
  const generatedInvoices: (Invoice & { ncf?: string; typeLabel?: string })[] = [];

  // 1. Facturas de Gastos de Cierre desde los Préstamos
  loans.filter(l => l.closingCost && l.closingCost > 0).forEach((loan, idx) => {
    const ncfCode = `B02${String(idx + 1001).padStart(8, '0')}`;
    generatedInvoices.push({
      id: `FAC-${loan.id.substring(0, 6).toUpperCase()}`,
      date: loan.startDate || new Date().toISOString().split('T')[0],
      reference: `PRES-${loan.id.substring(0, 8).toUpperCase()}`,
      clientName: loan.clientName || 'Cliente General',
      status: 'Completada',
      paymentStatus: 'Pagado',
      seller: 'Sistema',
      createdBy: 'Sistema',
      updatedBy: '-',
      updatedAt: '-',
      warrantyInfo: loan.guarantorId ? 'Con Garantía' : 'Sin Garantía',
      subtotal: Number(loan.closingCost),
      total: Number(loan.closingCost),
      totalPaid: Number(loan.closingCost),
      totalPending: 0,
      ncf: ncfCode,
      typeLabel: 'Gasto de Cierre',
      items: [
        { 
          id: `item-${idx}`, 
          description: `Gastos de Cierre y Formalización Préstamo #${loan.id.substring(0, 8).toUpperCase()}`, 
          quantity: 1, 
          unitPrice: Number(loan.closingCost), 
          subtotal: Number(loan.closingCost) 
        }
      ]
    });
  });

  // 2. Facturas de Servicios / Honorarios / Transacciones de Gastos y Comprobantes
  transactions
    .filter(t => t.type === 'Ingreso' || t.category === 'Gasto Cierre' || t.category === 'Servicios')
    .forEach((t, idx) => {
      const clientName = getClientName(t.referenceId, t.description);
      const isClosingFee = t.description.toLowerCase().includes('cierre') || t.description.toLowerCase().includes('legal');
      const ncfCode = `B01${String(idx + 2001).padStart(8, '0')}`;
      
      generatedInvoices.push({
        id: `FAC-${t.id.substring(0, 6).toUpperCase()}`,
        date: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0],
        reference: t.referenceId ? `REF-${t.referenceId.substring(0, 6).toUpperCase()}` : '-',
        clientName: clientName,
        status: 'Completada',
        paymentStatus: 'Pagado',
        seller: 'Sistema',
        createdBy: 'Sistema',
        updatedBy: '-',
        updatedAt: '-',
        warrantyInfo: '-',
        subtotal: Number(t.amount),
        total: Number(t.amount),
        totalPaid: Number(t.amount),
        totalPending: 0,
        ncf: ncfCode,
        typeLabel: isClosingFee ? 'Honorarios Legales' : 'Comprobante NCF',
        items: [
          { 
            id: `tx-${t.id}`, 
            description: t.description || 'Factura de Servicio Financiero', 
            quantity: 1, 
            unitPrice: Number(t.amount), 
            subtotal: Number(t.amount) 
          }
        ]
      });
    });

  const filteredInvoices = generatedInvoices.filter(inv => {
    const matchesSearch = (inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (inv.ncf && inv.ncf.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (invoiceTypeFilter === 'cierres') return matchesSearch && inv.typeLabel === 'Gasto de Cierre';
    if (invoiceTypeFilter === 'legales') return matchesSearch && inv.typeLabel === 'Honorarios Legales';
    if (invoiceTypeFilter === 'ncf') return matchesSearch && inv.ncf;
    return matchesSearch;
  });

  const getShareLinks = (inv: Invoice & { ncf?: string }) => {
    const message = `🏢 *${companySettings.name}*\n📄 *Factura de Venta*: ${inv.id}\n🔢 *NCF*: ${inv.ncf || 'B0200000000'}\n👤 *Cliente*: ${inv.clientName}\n💰 *Monto Total*: RD$ ${inv.total.toLocaleString()}\n\nGracias por confiar en nosotros.`;
    const encoded = encodeURIComponent(message);
    return {
      whatsapp: `https://wa.me/?text=${encoded}`,
      email: `mailto:?subject=Factura NCF ${inv.id}&body=${encoded}`
    };
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Facturación y NCF</h2>
            <p className="text-slate-500 text-sm">Emisión de facturas fiscales, gastos de cierre y comprobantes NCF.</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
          <button 
            onClick={() => setInvoiceTypeFilter('todos')}
            className={`px-3 py-1.5 rounded-lg transition-all ${invoiceTypeFilter === 'todos' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            Todas las Facturas
          </button>
          <button 
            onClick={() => setInvoiceTypeFilter('cierres')}
            className={`px-3 py-1.5 rounded-lg transition-all ${invoiceTypeFilter === 'cierres' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            Gastos de Cierre
          </button>
          <button 
            onClick={() => setInvoiceTypeFilter('legales')}
            className={`px-3 py-1.5 rounded-lg transition-all ${invoiceTypeFilter === 'legales' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            Honorarios / Legal
          </button>
          <button 
            onClick={() => setInvoiceTypeFilter('ncf')}
            className={`px-3 py-1.5 rounded-lg transition-all ${invoiceTypeFilter === 'ncf' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            Comprobantes NCF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, No. Factura o NCF..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            {filteredInvoices.length} Facturas registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-bold">No. Factura</th>
                <th className="px-6 py-4 font-bold">NCF (Fiscal)</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Concepto / Tipo</th>
                <th className="px-6 py-4 font-bold">Fecha</th>
                <th className="px-6 py-4 font-bold">Monto Total</th>
                <th className="px-6 py-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="font-bold">No hay facturas registradas en este criterio.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-indigo-50/40 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                    <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{inv.id}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono font-bold border border-slate-200">
                        {inv.ncf || 'B0200000000'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{inv.clientName}</td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        {inv.typeLabel || 'Servicio Financiero'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{inv.date}</td>
                    <td className="px-6 py-4 font-black text-slate-900">RD$ {inv.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-fade-in relative flex flex-col border border-slate-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-900 text-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Factura Fiscal {selectedInvoice.id}</h3>
                  <p className="text-xs text-slate-300">NCF: {selectedInvoice.ncf || 'B0200000000'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={getShareLinks(selectedInvoice).whatsapp} target="_blank" rel="noreferrer" className="p-2 text-emerald-400 hover:bg-slate-800 rounded-full transition-colors" title="Enviar por WhatsApp">
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a href={getShareLinks(selectedInvoice).email} className="p-2 text-slate-300 hover:bg-slate-800 rounded-full transition-colors" title="Enviar por Correo">
                  <Mail className="w-5 h-5" />
                </a>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors ml-2">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Summary */}
              <div className="flex justify-between items-start bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{selectedInvoice.clientName}</h3>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block border border-emerald-200">
                      PAGADO CONFORME
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold">Total Factura</p>
                  <p className="font-black text-2xl text-indigo-900">RD$ {selectedInvoice.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  Detalle de Conceptos y Servicios
                </h4>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-slate-800">{item.description}</span>
                        <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">RD$ {item.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex text-xs text-slate-500 gap-4">
                        <span>Cantidad: <span className="font-bold text-slate-700">{item.quantity}</span></span>
                        <span>Precio Unitario: <span className="font-bold text-slate-700">RD$ {item.unitPrice.toLocaleString()}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Info Footer */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-1 text-slate-600">
                <p className="font-bold text-slate-800 text-sm">{companySettings.name}</p>
                <p>RNC: {companySettings.rnc || '131-00000-1'}</p>
                <p>{companySettings.address}</p>
                <p>Tel: {companySettings.phone}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl sticky bottom-0">
              <button onClick={() => setSelectedInvoice(null)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors">
                Cerrar
              </button>
              <button onClick={() => window.print()} className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> Imprimir Factura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
