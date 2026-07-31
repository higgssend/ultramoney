import re

path = r'c:\Users\Dell\Downloads\ultramoney\pages\Payments.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace date block
date_find = """                            {/* Fechas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Fecha Emisión (Factura)</label>
                                    <input 
                                        type="date" 
                                        value={invoiceDate}
                                        onChange={e => setInvoiceDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Fecha de Pago (Recibo)</label>
                                    <input 
                                        type="date" 
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>"""

date_replace = """                            {/* Fechas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-slate-600">Fecha Emisión (Factura)</label>
                                        <button type="button" onClick={() => setInvoiceDate(new Date().toISOString().split('T')[0])} className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors">Hoy</button>
                                    </div>
                                    <input 
                                        type="date" 
                                        value={invoiceDate}
                                        onChange={e => setInvoiceDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-slate-600">Fecha de Pago (Recibo)</label>
                                        <button type="button" onClick={() => setPaymentDate(new Date().toISOString().split('T')[0])} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors">Hoy</button>
                                    </div>
                                    <input 
                                        type="date" 
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
                                    />
                                </div>
                            </div>"""

content = content.replace(date_find, date_replace)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Payments.tsx patched successfully!")
