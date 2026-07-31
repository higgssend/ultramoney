import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\ClientDetail.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add MessageCircle import
content = content.replace(
    "import { \n  User, Phone, MapPin, ArrowLeft, Banknote, \n  Receipt, MoreHorizontal, FileText, \n  File as FileIcon, Image as ImageIcon, Upload, FileCheck, Edit, Plus, Trash2, X, Save,\n  Briefcase, DollarSign, Lock, Mail, Clock, Camera, Shield\n} from 'lucide-react';",
    "import { \n  User, Phone, MapPin, ArrowLeft, Banknote, \n  Receipt, MoreHorizontal, FileText, \n  File as FileIcon, Image as ImageIcon, Upload, FileCheck, Edit, Plus, Trash2, X, Save,\n  Briefcase, DollarSign, Lock, Mail, Clock, Camera, Shield, MessageCircle\n} from 'lucide-react';"
)

if "MessageCircle" not in content and "MessageCircle" not in "lucide-react":
    content = content.replace("Shield\n} from 'lucide-react';", "Shield, MessageCircle\n} from 'lucide-react';")

# 2. Add WhatsApp statement logic
wa_statement = """
  const handleSendStatement = () => {
    if(!client) return;
    const totalDebt = clientLoans.filter(l => l.status !== 'Completado').reduce((sum, l) => sum + l.remainingBalance, 0);
    const message = `🏢 *${companySettings?.name || 'UltraMoney'}*\\n👤 *Estado de Cuenta*\\nHola ${client.name},\\n\\nSu balance total pendiente es de *RD$ ${totalDebt.toLocaleString()}*.\\n\\nPuede revisar el detalle de sus préstamos y descargar sus recibos accediendo a su portal de cliente:\\n${window.location.origin}/portal`;
    const url = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendReminder = (loan: Loan) => {
    if(!client) return;
    const message = `🏢 *${companySettings?.name || 'UltraMoney'}*\\n⚠️ *Recordatorio de Pago*\\nHola ${client.name},\\n\\nLe recordamos que su préstamo *${loan.id}* tiene una cuota de *RD$ ${loan.installmentAmount.toLocaleString()}* con fecha de pago ${loan.nextPaymentDate}.\\n\\nBalance Restante: RD$ ${loan.remainingBalance.toLocaleString()}\\n\\nPuede ver más detalles en su portal de cliente:\\n${window.location.origin}/portal`;
    const url = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };
"""

content = content.replace(
    "const myDocuments = clientDocuments.filter(d => d.clientId === client.id);",
    "const myDocuments = clientDocuments.filter(d => d.clientId === client.id);\n" + wa_statement
)

# 3. Add Statement button
content = content.replace(
    '<ActionButton icon={FileText} label="Documentos PDF" onClick={() => setIsDocGeneratorOpen(true)} />',
    '<ActionButton icon={MessageCircle} label="WhatsApp" onClick={handleSendStatement} />\n                        <ActionButton icon={FileText} label="Documentos PDF" onClick={() => setIsDocGeneratorOpen(true)} />'
)

# 4. Add Reminder button in loan card
old_buttons = """                                 <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                                     <button 
                                         onClick={() => setSelectedContractLoan(loan)}
                                         className="flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1"
                                     >
                                         <FileText className="w-4 h-4" /> Ver Contrato
                                     </button>
                                     <button 
                                         onClick={() => navigate('/pagos', { state: { loanId: loan.id } })}
                                         className="flex-1 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1 shadow-md"
                                     >
                                         <Receipt className="w-4 h-4" /> Pagos
                                     </button>
                                 </div>"""

new_buttons = """                                 <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                     <div className="flex gap-2">
                                         <button 
                                             onClick={() => setSelectedContractLoan(loan)}
                                             className="flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1"
                                         >
                                             <FileText className="w-4 h-4" /> Ver Contrato
                                         </button>
                                         <button 
                                             onClick={() => navigate('/pagos', { state: { loanId: loan.id } })}
                                             className="flex-1 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1 shadow-md"
                                         >
                                             <Receipt className="w-4 h-4" /> Pagos
                                         </button>
                                     </div>
                                     {loan.status !== 'Completado' && (
                                         <button 
                                             onClick={() => handleSendReminder(loan)}
                                             className="w-full py-2 bg-[#25D366]/10 text-[#1eaf53] hover:bg-[#25D366]/20 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1"
                                         >
                                             <MessageCircle className="w-4 h-4" /> Recordatorio WhatsApp
                                         </button>
                                     )}
                                 </div>"""

content = content.replace(old_buttons, new_buttons)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("ClientDetail.tsx patched successfully for WhatsApp!")
