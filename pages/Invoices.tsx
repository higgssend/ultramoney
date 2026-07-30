
import React, { useState } from 'react';
import { Search, Eye, Download, X, User, ShoppingBag, Clock, CheckCircle, ChevronUp, AlertCircle, FileText, Share2, MessageCircle, Mail, ChevronLeft } from 'lucide-react';
import { Invoice } from '../types';
import { useNavigate } from 'react-router-dom';

import { useStore } from '../context/StoreContext';

const Invoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const navigate = useNavigate();
  const { transactions, clients } = useStore();

  const generatedInvoices: Invoice[] = transactions
    .filter(t => t.type === 'Ingreso' && t.category === 'Pago Préstamo')
    .map(t => {
      // Trying to find client using referenceId (which usually points to loanId or clientId depending on how it was saved)
      const client = clients.find(c => c.id === t.referenceId) || { firstName: 'Cliente', lastName: 'Desconocido' };
      return {
        id: `REC-${t.id.substring(0,6).toUpperCase()}`,
        date: t.date,
        reference: t.referenceId || '-',
        clientName: t.description.includes('Pago') ? t.description.split(' - ')[1] || `${client.firstName} ${client.lastName}` : t.description,
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
        items: [
          { id: '1', description: t.description, quantity: 1, unitPrice: Number(t.amount), subtotal: Number(t.amount) }
        ]
      };
    });

  const filteredInvoices = generatedInvoices.filter(inv => 
    inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getShareLinks = (inv: Invoice) => {
      const message = `Hola ${inv.clientName}, adjunto detalle de su factura ${inv.id} por un total de RD$${inv.total.toLocaleString()}. Estado: ${inv.paymentStatus}.`;
      const encoded = encodeURIComponent(message);
      return {
          whatsapp: `https://wa.me/?text=${encoded}`,
          email: `mailto:?subject=Factura ${inv.id}&body=${encoded}`
      };
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Facturas</h2>
                <p className="text-slate-500">Historial detallado de facturación y estados.</p>
            </div>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors">
            <Download className="w-4 h-4" /> Exportar Lista
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente o No. Factura..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">No. Factura</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Estado Pago</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                  <td className="px-6 py-4 font-mono text-indigo-600 font-medium">{inv.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{inv.clientName}</td>
                  <td className="px-6 py-4 text-slate-600">{inv.date}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">${inv.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1 ${
                            inv.paymentStatus === 'Pagado' ? 'bg-emerald-100 text-emerald-700' :
                            inv.paymentStatus === 'Pendiente' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {inv.paymentStatus}
                        </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                        <button className="p-2 text-slate-400 hover:text-indigo-600"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl animate-fade-in relative flex flex-col">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Factura {selectedInvoice.id}</h3>
                            <p className="text-xs text-slate-500">Detalle de transacción</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href={getShareLinks(selectedInvoice).whatsapp} target="_blank" rel="noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="Enviar por WhatsApp">
                            <MessageCircle className="w-5 h-5" />
                        </a>
                        <a href={getShareLinks(selectedInvoice).email} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Enviar por Correo">
                            <Mail className="w-5 h-5" />
                        </a>
                        <button onClick={() => setSelectedInvoice(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors ml-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header Summary */}
                    <div className="flex justify-between items-start bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold shadow-sm border border-indigo-100">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 uppercase text-sm">{selectedInvoice.clientName}</h3>
                                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block border border-amber-200">
                                    Adeudado
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-medium">Total Factura</p>
                            <p className="font-bold text-xl text-indigo-900">RD${selectedInvoice.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                    </div>

                    {/* Product List */}
                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-slate-400" />
                                Productos ({selectedInvoice.items.length})
                            </h4>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                             {selectedInvoice.items.map((item, idx) => (
                                 <div key={idx} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                     <div className="flex justify-between items-start mb-2">
                                         <span className="text-sm font-bold text-slate-800 uppercase">{item.description}</span>
                                         <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">RD${item.subtotal.toLocaleString()}</span>
                                     </div>
                                     <div className="flex text-xs text-slate-500 gap-4">
                                         <span>Cant: <span className="font-medium text-slate-700">{item.quantity}</span></span>
                                         <span>Precio: <span className="font-medium text-slate-700">RD${item.unitPrice.toLocaleString()}</span></span>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-2 text-sm">
                        <h4 className="font-bold text-slate-700 mb-3 text-xs uppercase tracking-wider">Información de Pagos</h4>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-medium text-slate-800">RD${selectedInvoice.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500">Cantidad Total</span>
                            <span className="font-bold text-indigo-600">RD${selectedInvoice.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-200">
                            <span className="text-slate-500">Total pagado</span>
                            <span className="font-bold text-emerald-600">RD${selectedInvoice.totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Pendiente</span>
                            <span className="font-bold text-rose-600">RD${selectedInvoice.totalPending.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>

                    {/* Metadata Accordion Style */}
                    <div className="border rounded-xl border-slate-200 overflow-hidden">
                         <div className="bg-slate-50 p-3 flex items-center justify-between cursor-pointer border-b border-slate-100">
                             <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" /> Información de Venta
                             </span>
                             <ChevronUp className="w-4 h-4 text-slate-400" />
                         </div>
                         <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                             <div>
                                 <p className="text-slate-400 mb-1">Fecha</p>
                                 <p className="font-medium text-slate-700">{selectedInvoice.date}</p>
                             </div>
                             <div>
                                 <p className="text-slate-400 mb-1">Referencia</p>
                                 <p className="font-medium text-slate-700">{selectedInvoice.reference}</p>
                             </div>
                             <div>
                                 <p className="text-slate-400 mb-1">Vendedor</p>
                                 <p className="font-medium text-slate-700">{selectedInvoice.seller}</p>
                             </div>
                              <div>
                                 <p className="text-slate-400 mb-1">Creado por</p>
                                 <p className="font-medium text-slate-700">{selectedInvoice.createdBy}</p>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl sticky bottom-0">
                    <button onClick={() => setSelectedInvoice(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
                        Cerrar
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" /> Descargar PDF
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
