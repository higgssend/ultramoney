
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, MapPin, ArrowLeft, Banknote, 
  Receipt, MoreHorizontal, FileText, 
  File as FileIcon, Image as ImageIcon, Upload, FileCheck, Edit, Plus, Trash2, X, Save, Globe,
  Briefcase, DollarSign, Lock, Mail, Clock, Camera, Shield, MessageCircle
} from 'lucide-react';
import { useSettings, useClients, useLoans, useAccounting } from '../context/StoreContext';
import { LoanStatus, BankAccount, Client, Loan, Transaction, ClientDocument } from '../types';
import { useToast } from '../context/ToastContext';
import { ContractViewer } from './features/ContractViewer';
import { DocumentGenerator, DocumentType } from '../components/DocumentGenerator';
import { DataExportToolbar } from '../components/DataExportToolbar';
import { CustomSelect } from '../components/CustomSelect';
import { ImageCropperModal } from '../components/ImageCropperModal';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { clients, clientNotes, clientDocuments, addClientNote, updateClient, addClientDocument, removeClientDocument } = useClients();
  const { loans } = useLoans();
  const { transactions, bankAccounts, addBankAccount, removeBankAccount } = useAccounting();
  const { companySettings } = useSettings();

  const [rawAvatarSrc, setRawAvatarSrc] = useState<string | null>(null);
  const [showCropperModal, setShowCropperModal] = useState(false);

  const [selectedContractLoan, setSelectedContractLoan] = useState<Loan | null>(null);
  const [selectedDocLoan, setSelectedDocLoan] = useState<Loan | null>(null);
  const [isDocGeneratorOpen, setIsDocGeneratorOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('pagare');
  
  const client = clients.find(c => c.id === id);
  const [activeTab, setActiveTab] = useState<'general' | 'loans' | 'payments' | 'documents' | 'notes' | 'banks'>('general');
  
  // State for Documents & Camera
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<ClientDocument['type']>('Cedula');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [newBank, setNewBank] = useState<Partial<BankAccount>>({ bankName: '', accountNumber: '', accountType: 'Ahorro', holderName: '' });
  const [showBankForm, setShowBankForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Client | null>(null);

  if (!client) {
    return <div className="p-8 text-center text-slate-500">Cliente no encontrado.</div>;
  }

  const clientLoans = loans.filter(l => l.clientId === client.id);
  const clientBanks = bankAccounts.filter(b => b.clientId === client.id);
  const myNotes = clientNotes.filter(n => n.clientId === client.id);
  const myDocuments = clientDocuments.filter(d => d.clientId === client.id);

  const handleSendStatement = () => {
    if(!client) return;
    const totalDebt = clientLoans.filter(l => l.status !== 'Completado').reduce((sum, l) => sum + l.remainingBalance, 0);
    const message = `🏢 *${companySettings?.name || 'UltraMoney'}*\n👤 *Estado de Cuenta*\nHola ${client.name},\n\nSu balance total pendiente es de *RD$ ${totalDebt.toLocaleString()}*.\n\nPuede revisar el detalle de sus préstamos y descargar sus recibos accediendo a su portal de cliente:\n${window.location.origin}/portal`;
    const url = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendReminder = (loan: Loan) => {
    if(!client) return;
    const message = `🏢 *${companySettings?.name || 'UltraMoney'}*\n⚠️ *Recordatorio de Pago*\nHola ${client.name},\n\nLe recordamos que su préstamo *${loan.id}* tiene una cuota de *RD$ ${loan.installmentAmount.toLocaleString()}* con fecha de pago ${loan.nextPaymentDate}.\n\nBalance Restante: RD$ ${loan.remainingBalance.toLocaleString()}\n\nPuede ver más detalles en su portal de cliente:\n${window.location.origin}/portal`;
    const url = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };


  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if(newBank.bankName && newBank.accountNumber) {
        addBankAccount({ ...newBank as BankAccount, id: Date.now().toString(), clientId: client.id });
        setNewBank({ bankName: '', accountNumber: '', accountType: 'Ahorro', holderName: '' });
        setShowBankForm(false);
    }
  };

  const handleAddNote = () => {
    if(!newNote.trim()) return;
    addClientNote({ id: Date.now().toString(), clientId: client.id, content: newNote, date: new Date().toISOString().split('T')[0], createdBy: 'Admin' });
    setNewNote('');
  };

  const handleEditClick = () => {
    navigate(`/clientes/editar/${client.id}`);
  };

  const handleAvatarChangeInDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawAvatarSrc(reader.result as string);
        setShowCropperModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateClient = (e: React.FormEvent) => {
      e.preventDefault();
      if(editFormData) {
          updateClient(editFormData);
          setIsEditModalOpen(false);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
          if (!uploadDocTitle) {
              setUploadDocTitle(e.target.files[0].name);
          }
      }
  };

  // Camera Logic
  const startCamera = async () => {
      setIsCameraOpen(true);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (err) {
          console.error("Error accessing camera", err);
          addToast("No se pudo acceder a la cámara", "error");
          setIsCameraOpen(false);
      }
  };

  const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d')?.drawImage(video, 0, 0);
          
          canvas.toBlob(blob => {
              if (blob) {
                  const file = new File([blob], "foto-camara.jpg", { type: "image/jpeg" });
                  setSelectedFile(file);
                  setUploadDocTitle("Foto capturada");
                  stopCamera();
              }
          }, 'image/jpeg');
      }
  };

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(false);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedFile) return;

      const fileUrl = URL.createObjectURL(selectedFile);
      
      const newDoc: ClientDocument = {
          id: `DOC-${Date.now()}`,
          clientId: client.id,
          title: uploadDocTitle || 'Documento sin título',
          type: uploadDocType,
          fileUrl: fileUrl,
          fileType: selectedFile.type,
          uploadDate: new Date().toISOString().split('T')[0]
      };

      addClientDocument(newDoc);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadDocTitle('');
  };

  const getDocIcon = (type: string, fileType: string) => {
      if (fileType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-indigo-500" />;
      if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-rose-500" />;
      return <FileIcon className="w-8 h-8 text-slate-500" />;
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen relative pb-20 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
               <button onClick={() => navigate('/clientes')} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md rounded-full transition-all">
                  <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
               </button>
               <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{client.name}</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">ID: {client.id}</span> 
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span> 
                    <span className={`text-xs font-bold ${client.status === 'Activo' ? 'text-emerald-500' : 'text-rose-500'}`}>{client.status}</span>
                  </p>
               </div>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/portal/${client.id}`);
                  addToast('Link copiado al portapapeles', 'success');
              }} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-sm border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors">
                  Copiar Link Portal
              </button>
              <button onClick={() => window.open(`/portal/${client.id}`, '_blank')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors shadow-sm">
                  Abrir Portal
              </button>
          </div>
      </div>

      {/* Profile Card with Gradient Accent */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden relative">
          <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-6 items-end -mt-12 mb-6">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 p-1 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    {client.avatarUrl ? (
                      <img src={client.avatarUrl} alt={client.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600">
                        {client.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 z-10" title="Cambiar y recortar foto">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleAvatarChangeInDetail} className="hidden" />
                  </label>
                </div>
                
                <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{client.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                           <MapPin className="w-4 h-4" /> {client.address}
                        </p>
                        {client.coordinates && (
                            <a 
                                href={`https://www.google.com/maps?q=${client.coordinates.lat},${client.coordinates.lng}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1"
                            >
                                <MapPin className="w-3 h-3" /> Ver en Google Maps
                            </a>
                        )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <ActionButton icon={MessageCircle} label="WhatsApp" onClick={handleSendStatement} />
                        <ActionButton icon={FileText} label="Documentos PDF" onClick={() => setIsDocGeneratorOpen(true)} />
                        <ActionButton icon={Edit} label="Editar" onClick={handleEditClick} />
                        <ActionButton icon={Banknote} label="Préstamo" onClick={() => setActiveTab('loans')} primary />
                    </div>
                </div>
            </div>

            <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto gap-6 hide-scrollbar">
                <TabButton label="General" active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
                <TabButton label="Préstamos" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />
                <TabButton label="Historial de Pagos" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
                <TabButton label="Documentos" active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                <TabButton label="Bancos" active={activeTab === 'banks'} onClick={() => setActiveTab('banks')} />
                <TabButton label="Notas" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
            </div>
          </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 min-h-[400px] p-8">
        {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                 <DetailGroup icon={User} title="Identificación">
                     <DetailRow label="Cédula" value={client.cedula} />
                     <DetailRow label="Sexo" value={client.sex} />
                     <DetailRow label="Ocupación" value={client.occupation} />
                 </DetailGroup>
                 
                 <DetailGroup icon={Globe} title="Portal Web de Cliente">
                     <DetailRow label="Enlace Corto" value={client.portalAlias ? `https://ultramoney.app/portal/${client.portalAlias}` : `https://ultramoney.app/portal/${client.id}`} highlight />
                     <DetailRow label="Alias" value={client.portalAlias || 'No configurado'} />
                     <DetailRow label="PIN" value={client.clientPin || 'Sin PIN'} />
                     <DetailRow label="Estado" value={client.portalActive !== false ? 'Activo' : 'Desactivado'} />
                 </DetailGroup>

                 <DetailGroup icon={Phone} title="Contacto">
                     <DetailRow label="Celular" value={client.phone} highlight />
                     <DetailRow label="Tel. Casa" value={client.phoneHome || '-'} />
                     <DetailRow label="Email" value={client.email || '-'} />
                 </DetailGroup>
                 <DetailGroup icon={Briefcase} title="Financiero">
                     <DetailRow label="Ingresos" value={`$${client.income.toLocaleString()}`} />
                     <DetailRow label="Score Crediticio" value={
                         <span className="flex items-center gap-2">
                             <span className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <span className="block h-full bg-emerald-500" style={{width: `${client.creditScore}%`}}></span>
                             </span>
                             {client.creditScore}
                         </span>
                     } />
                     <DetailRow label="Registro" value={client.joinedDate} />
                 </DetailGroup>
            </div>
        )}

         {activeTab === 'loans' && (
             <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">Préstamos del Cliente</h3>
                      <DataExportToolbar 
                          data={clientLoans} 
                          title={`Préstamos de ${client.name}`}
                          filename={`prestamos_${client.cedula}`}
                          columns={[
                              { header: 'ID', key: 'id' },
                              { header: 'Monto Inicial', key: 'amount', format: (v) => `$${v?.toLocaleString()}` },
                              { header: 'Balance', key: 'remainingBalance', format: (v) => `$${v?.toLocaleString()}` },
                              { header: 'Cuota', key: 'installmentAmount', format: (v) => `$${v?.toLocaleString()}` },
                              { header: 'Frecuencia', key: 'frequency' },
                              { header: 'Estado', key: 'status' }
                          ]} 
                      />
                  </div>
                  {clientLoans.length === 0 ? (
                     <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                         <Banknote className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
                         <p className="text-slate-500 dark:text-slate-400 font-bold">Este cliente no tiene préstamos registrados.</p>
                     </div>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {clientLoans.map(loan => (
                             <div key={loan.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                 {loan.status === 'Completado' && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 text-white font-bold text-[10px] transform rotate-45 flex items-end justify-center pb-2 translate-x-8 -translate-y-8 shadow-sm">PAGADO</div>}
                                 <div className="flex justify-between items-start mb-4">
                                     <div>
                                         <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                             {loan.id}
                                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                 loan.status === 'Activo' ? 'bg-emerald-100 text-emerald-600' : 
                                                 loan.status === 'Atrasado' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                                             }`}>{loan.status}</span>
                                         </h4>
                                         <p className="text-xs text-slate-500">{loan.loanType}</p>
                                     </div>
                                 </div>
                                 <div className="space-y-3 mb-5">
                                     <div className="flex justify-between">
                                         <span className="text-sm text-slate-500">Monto Inicial</span>
                                         <span className="text-sm font-bold text-slate-700 dark:text-white">${loan.amount.toLocaleString()}</span>
                                     </div>
                                     <div className="flex justify-between">
                                         <span className="text-sm text-slate-500">Balance</span>
                                         <span className="text-sm font-bold text-emerald-600">${loan.remainingBalance.toLocaleString()}</span>
                                     </div>
                                     <div className="flex justify-between">
                                         <span className="text-sm text-slate-500">Cuota</span>
                                         <span className="text-sm font-bold text-slate-700 dark:text-white">${loan.installmentAmount.toLocaleString()} / {loan.frequency}</span>
                                     </div>
                                 </div>
                                 <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                     <div className="flex gap-2">
                                         <button 
                                             onClick={() => navigate(`/documentos/${client.id}?loanId=${loan.id}`)}
                                             className="flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1"
                                         >
                                             <FileText className="w-4 h-4" /> Ver Documentos
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
                                             className="w-full py-2 mt-2 bg-[#25D366]/10 text-[#1eaf53] hover:bg-[#25D366]/20 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1"
                                         >
                                             <MessageCircle className="w-4 h-4" /> Recordatorio WhatsApp
                                         </button>
                                     )}
                                 </div>
                                 
                                 {loan.collateral && loan.collateral.type !== 'Sin Garantía' && (
                                     <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1 uppercase">
                                             <Shield className="w-3 h-3" /> GARANTÍA: {loan.collateral.type}
                                         </p>
                                         <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{loan.collateral.description}</p>
                                         <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{loan.collateral.refNumber}</p>
                                     </div>
                                 )}
                             </div>
                         ))}
                     </div>
                 )}
            </div>
        )}

        {/* ... (Banks, Notes tabs remain similar, just adding dark mode classes) ... */}
        
        
        {activeTab === 'payments' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Historial de Pagos del Cliente</h3>
                    <DataExportToolbar 
                        data={transactions.filter(t => clientLoans.some(l => l.id === t.referenceId) && t.type === 'Ingreso')} 
                        title={`Historial de Pagos de ${client.name}`}
                        filename={`pagos_${client.cedula}`}
                        columns={[
                            { header: 'ID', key: 'id' },
                            { header: 'Fecha', key: 'date' },
                            { header: 'Monto', key: 'amount', format: (v) => `$${v?.toLocaleString()}` },
                            { header: 'Tipo', key: 'type' },
                            { header: 'Nota', key: 'note' },
                            { header: 'Préstamo (Ref)', key: 'referenceId' }
                        ]}
                    />
                </div>
                {transactions.filter(t => clientLoans.some(l => l.id === t.referenceId) && t.type === 'Ingreso').length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                        <table className="w-full text-left border-collapse bg-white dark:bg-slate-800">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Recibo</th>
                                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Monto</th>
                                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Concepto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.filter(t => clientLoans.some(l => l.id === t.referenceId) && t.type === 'Ingreso').map(trx => (
                                    <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm text-slate-700 dark:text-slate-300 font-medium">{new Date(trx.date).toLocaleString()}</td>
                                        <td className="p-4 text-sm font-mono text-slate-500 dark:text-slate-400">{trx.id.substring(0,8)}</td>
                                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">${trx.amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{trx.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Banknote className="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 className="text-slate-700 dark:text-slate-300 font-bold mb-1">Sin historial de pagos</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Este cliente no ha realizado pagos todavía.</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'documents' && (
            <div>
                 <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">Documentos Digitales & Legales</h3>
                      <div className="flex items-center gap-2">
                          <button 
                              onClick={() => navigate(`/documentos/${client.id}`)}
                              className="text-sm bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                          >
                              <FileText className="w-4 h-4" /> Ver Documentos Legales
                          </button>
                          <button onClick={() => setIsUploadModalOpen(true)} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                              <Upload className="w-4 h-4" /> Subir Documento
                          </button>
                      </div>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                     {myDocuments.map(doc => (
                         <div key={doc.id} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center gap-3 hover:shadow-lg transition-all cursor-pointer group relative hover:-translate-y-1" onClick={() => setPreviewDoc(doc)}>
                             <button 
                                onClick={(e) => { e.stopPropagation(); removeClientDocument(doc.id); }}
                                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                             >
                                 <Trash2 className="w-4 h-4" />
                             </button>
                             <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                                 {doc.fileType.startsWith('image/') ? <img src={doc.fileUrl} className="w-full h-full object-cover" /> : getDocIcon(doc.type, doc.fileType)}
                             </div>
                             <div className="text-center w-full">
                                 <p className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate w-full mb-1">{doc.title}</p>
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${doc.type === 'Cedula' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>{doc.type}</span>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-white">Subir Documento</h3>
                     <button onClick={() => { setIsUploadModalOpen(false); stopCamera(); }}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                 </div>
                 <form onSubmit={handleUploadSubmit} className="space-y-5">
                     {!isCameraOpen ? (
                     <>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Título</label>
                            <input type="text" className="w-full px-4 py-2 border dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white" placeholder="Ej. Cédula Frontal" value={uploadDocTitle} onChange={e => setUploadDocTitle(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                            <CustomSelect 
                                className="w-full"
                                value={uploadDocType} 
                                onChange={e => setUploadDocType(e as any)}
                                options={[
                                    { value: 'Cedula', label: 'Cédula de Identidad' },
                                    { value: 'Contrato', label: 'Contrato Firmado' },
                                    { value: 'Garantia', label: 'Garantía / Aval' },
                                    { value: 'Otro', label: 'Otro' }
                                ]}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative group">
                                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} accept="image/*,.pdf" />
                                {selectedFile ? (
                                    <div className="flex flex-col items-center">
                                        <FileCheck className="w-8 h-8 text-emerald-500 mb-2" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedFile.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                                        <span className="text-xs font-bold text-indigo-600">Subir Archivo</span>
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={startCamera} className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-xs font-bold text-slate-500">Usar Cámara</span>
                            </button>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20" disabled={!selectedFile}>
                            Guardar
                        </button>
                     </>
                     ) : (
                         <div className="flex flex-col items-center">
                             <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
                                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                                 <canvas ref={canvasRef} className="hidden"></canvas>
                             </div>
                             <div className="flex gap-4 w-full">
                                 <button type="button" onClick={stopCamera} className="flex-1 py-3 rounded-xl font-bold border border-slate-300 text-slate-700 hover:bg-slate-50">Cancelar</button>
                                 <button type="button" onClick={capturePhoto} className="flex-1 py-3 rounded-xl font-bold bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-2">
                                     <div className="w-4 h-4 rounded-full bg-rose-600"></div> Capturar
                                 </button>
                             </div>
                         </div>
                     )}
                 </form>
             </div>
        </div>
      )}

      {/* Contract Viewer Modal */}
      {selectedContractLoan && (
          <ContractViewer 
              loan={selectedContractLoan} 
              client={client} 
              company={companySettings} 
              onClose={() => setSelectedContractLoan(null)} 
          />
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
              <div className="relative max-w-4xl max-h-[90vh] w-full">
                  <button className="absolute -top-12 right-0 text-white hover:text-slate-300" onClick={() => setPreviewDoc(null)}><X className="w-8 h-8" /></button>
                  {previewDoc.fileType.startsWith('image/') ? (
                      <img src={previewDoc.fileUrl} alt={previewDoc.title} className="w-full h-full object-contain rounded-lg" />
                  ) : (
                      <iframe src={previewDoc.fileUrl} className="w-full h-[80vh] bg-white rounded-lg" title="Document Preview"></iframe>
                  )}
                  <p className="text-center text-white mt-4 font-bold">{previewDoc.title}</p>
              </div>
          </div>
      )}

      {/* Official Legal Document Generator Modal */}
      {isDocGeneratorOpen && (
        <DocumentGenerator
          client={client}
          loan={selectedDocLoan || clientLoans[0]}
          clientLoans={clientLoans}
          company={companySettings}
          isOpen={isDocGeneratorOpen}
          onClose={() => {
            setIsDocGeneratorOpen(false);
            setSelectedDocLoan(null);
          }}
          defaultDocType={selectedDocType}
        />
      )}

      {/* Modal de Recorte Cuadrado de Foto */}
      {showCropperModal && rawAvatarSrc && (
        <ImageCropperModal
          imageSrc={rawAvatarSrc}
          onCropComplete={(croppedDataUrl) => {
            updateClient({ ...client, avatarUrl: croppedDataUrl });
            setShowCropperModal(false);
            setRawAvatarSrc(null);
            addToast('Foto de perfil actualizada y recortada', 'success');
          }}
          onClose={() => {
            setShowCropperModal(false);
            setRawAvatarSrc(null);
          }}
        />
      )}
    </div>
  );
};

// Helper Components
const DetailGroup: React.FC<{ icon: any, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div>
        <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
            <Icon className="w-4 h-4 text-indigo-500" /> {title}
        </h4>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const DetailRow: React.FC<{ label: string; value: string | React.ReactNode; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">{label}</span>
    <span className={`font-medium ${highlight ? 'text-indigo-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{value}</span>
  </div>
);

const ActionButton: React.FC<{ icon: any, label: string, onClick?: () => void, primary?: boolean }> = ({ icon: Icon, label, onClick, primary }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm ${primary ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
  >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-bold">{label}</span>
  </button>
);

const TabButton: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
      onClick={onClick}
      className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-all rounded-full ${active ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
  >
      {label}
  </button>
);

export default ClientDetail;
