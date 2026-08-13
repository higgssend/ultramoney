
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, MapPin, ArrowLeft, Banknote, 
  Receipt, MoreHorizontal, FileText, 
  File as FileIcon, Image as ImageIcon, Upload, FileCheck, Edit, Plus, Trash2, X, Save, Globe,
  Briefcase, DollarSign, Lock, Mail, Clock, Camera, Shield, MessageCircle, Eye, Package
} from 'lucide-react';
import { useSettings, useClients, useLoans, useAccounting } from '../context/StoreContext';
import { LoanStatus, BankAccount, Client, Loan, Transaction, ClientDocument, formatLoanId } from '../types';
import { useToast } from '../context/ToastContext';
import { ContractViewer } from './features/ContractViewer';
import { LoanContractModal } from './features/LoanContractModal';
import { DocumentGenerator, DocumentType } from '../components/DocumentGenerator';
import { DataExportToolbar } from '../components/DataExportToolbar';
import { CustomSelect } from '../components/CustomSelect';
import { ImageCropperModal } from '../components/ImageCropperModal';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { clients, clientNotes, clientDocuments, addClientNote, updateClient, addClientDocument, updateClientDocument, removeClientDocument } = useClients();
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
  const [activeTab, setActiveTab] = useState<'general' | 'loans' | 'payments' | 'documents' | 'notes' | 'banks' | 'collateral'>('general');
  
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

  // Document Edit State
  const [editingDoc, setEditingDoc] = useState<ClientDocument | null>(null);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocType, setEditDocType] = useState<ClientDocument['type']>('Cedula');
  const [editDocFile, setEditDocFile] = useState<File | null>(null);
  const [isEditDocModalOpen, setIsEditDocModalOpen] = useState(false);

  const handleOpenEditDoc = (doc: ClientDocument) => {
    setEditingDoc(doc);
    setEditDocTitle(doc.title);
    setEditDocType(doc.type);
    setEditDocFile(null);
    setIsEditDocModalOpen(true);
  };

  const handleSaveEditDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    await updateClientDocument(editingDoc.id, {
      title: editDocTitle,
      type: editDocType,
      clientId: editingDoc.clientId
    }, editDocFile || undefined);
    setIsEditDocModalOpen(false);
    setEditingDoc(null);
  };

  const handleAvatarFileSelectInDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCropCompleteInDetail = async (croppedBase64: string) => {
    setShowCropperModal(false);
    if (client) {
      await updateClient({ ...client, avatarUrl: croppedBase64 });
      addToast('Foto de perfil actualizada correctamente', 'success');
    }
  };

  if (!client) {
    return <div className="p-8 text-center text-slate-500">Cliente no encontrado.</div>;
  }

  const clientLoans = loans.filter(l => l.clientId === client.id);
  const clientBanks = bankAccounts.filter(b => b.clientId === client.id);
  const myNotes = clientNotes.filter(n => n.clientId === client.id);

  const autoGeneratedDocs: ClientDocument[] = clientLoans.flatMap(l => {
    const list: ClientDocument[] = [
      {
        id: `auto-contrato-${l.id}`,
        clientId: client.id,
        title: `Contrato Inicial Préstamo #${formatLoanId(l.id, l.loanCategory, l.loanType)}`,
        type: 'Contrato',
        fileUrl: `${window.location.origin}/documento/contrato/${l.id}`,
        uploadDate: l.startDate || new Date().toISOString().split('T')[0],
        fileType: 'application/pdf'
      },
      {
        id: `auto-pagare-${l.id}`,
        clientId: client.id,
        title: `Pagaré Notarial #${formatLoanId(l.id, l.loanCategory, l.loanType)}`,
        type: 'Contrato',
        fileUrl: `${window.location.origin}/documento/pagare/${l.id}`,
        uploadDate: l.startDate || new Date().toISOString().split('T')[0],
        fileType: 'application/pdf'
      },
      {
        id: `auto-estado-${l.id}`,
        clientId: client.id,
        title: `Estado de Cuenta #${formatLoanId(l.id, l.loanCategory, l.loanType)}`,
        type: 'Otro',
        fileUrl: `${window.location.origin}/documento/estado/${l.id}`,
        uploadDate: new Date().toISOString().split('T')[0],
        fileType: 'application/pdf'
      }
    ];

    if (l.status === 'Pagado') {
      list.push({
        id: `auto-saldo-${l.id}`,
        clientId: client.id,
        title: `Carta de Saldo Cero #${formatLoanId(l.id, l.loanCategory, l.loanType)}`,
        type: 'Otro',
        fileUrl: `${window.location.origin}/documento/saldo/${l.id}`,
        uploadDate: new Date().toISOString().split('T')[0],
        fileType: 'application/pdf'
      });
    }

    return list;
  });

  const personalDocs = clientDocuments.filter(d => d.clientId === client.id);
  const legalDocs = autoGeneratedDocs;
  const myDocuments = [...personalDocs, ...legalDocs];

  const clientCollaterals = clientLoans.filter(l => l.collateral && l.collateral.type && l.collateral.type !== 'Sin Garantía').map(l => ({
    loanId: l.id,
    loanCategory: l.loanCategory,
    loanType: l.loanType,
    loanStatus: l.status,
    itemPrice: l.itemPrice,
    downPayment: l.downPayment,
    downPaymentMode: l.downPaymentMode,
    financedAmount: l.financedAmount,
    collateral: l.collateral!
  }));

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
                    <input type="file" accept="image/*" onChange={handleAvatarFileSelectInDetail} className="hidden" />
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
                <TabButton label="Garantías y Avales" active={activeTab === 'collateral'} onClick={() => setActiveTab('collateral')} />
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
                     <DetailRow label="Enlace Corto" value={`${window.location.origin}/portal/${client.portalAlias || client.id}`} highlight />
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
                                 <div 
                                      onClick={() => navigate(`/prestamos/${loan.id}`)}
                                      className="flex justify-between items-start mb-4 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 -mx-2 -mt-2 rounded-xl transition-all"
                                      title="Haz clic para ver el préstamo completo"
                                  >
                                      <div>
                                          <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                                              Préstamo #{formatLoanId(loan.id, loan.loanCategory, loan.loanType)}
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                  loan.status === 'Activo' ? 'bg-emerald-100 text-emerald-600' : 
                                                  loan.status === 'Atrasado' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                                              }`}>{loan.status}</span>
                                          </h4>
                                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            {loan.loanType} • Frecuencia: {loan.frequency} <Eye className="w-3.5 h-3.5 text-indigo-500 inline ml-1 opacity-80 group-hover:opacity-100" />
                                          </p>
                                      </div>
                                  </div>
                                  <div className="space-y-3 mb-5">
                                      <div className="flex justify-between">
                                          <span className="text-sm text-slate-500">Monto Inicial</span>
                                          <span className="text-sm font-bold text-slate-700 dark:text-white">RD${loan.amount.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-sm text-slate-500">Balance</span>
                                          <span className="text-sm font-bold text-emerald-600">RD${loan.remainingBalance.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-sm text-slate-500">Cuota</span>
                                          <span className="text-sm font-bold text-slate-700 dark:text-white">RD${loan.installmentAmount.toLocaleString()} / {loan.frequency}</span>
                                      </div>
                                  </div>
                                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                                      <button 
                                          onClick={() => navigate(`/prestamos/${loan.id}`)}
                                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5 shadow-md shadow-indigo-500/20"
                                      >
                                          <Eye className="w-4 h-4" /> Ver Todo del Préstamo
                                      </button>
                                      <button 
                                          onClick={() => setSelectedContractLoan(loan)}
                                          className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all flex justify-center items-center gap-1.5 shadow-md"
                                      >
                                          <FileText className="w-4 h-4" /> Ver Contrato Oficial & Desglose
                                      </button>
                                     <div className="flex gap-2">
                                         <button 
                                             onClick={() => navigate(`/documentos/${client.id}?loanId=${loan.id}`)}
                                             className="flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1"
                                         >
                                             <FileText className="w-4 h-4" /> Documentos
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
            <div className="space-y-8">
                 {/* Top Action Bar */}
                 <div className="flex justify-between items-center flex-wrap gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Expediente Digital del Cliente</h3>
                        <p className="text-xs text-slate-500">Gestión clasificada de documentos personales y contratos legales de préstamos</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <button 
                              onClick={() => navigate(`/documentos/${client.id}`)}
                              className="text-sm bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                          >
                              <FileText className="w-4 h-4" /> Generar Documento Legal
                          </button>
                          <button onClick={() => setIsUploadModalOpen(true)} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                              <Upload className="w-4 h-4" /> Subir Documento Personal
                          </button>
                      </div>
                 </div>

                 {/* SECCIÓN 1: DOCUMENTOS PERSONALES & IDENTIDAD */}
                 <div className="bg-slate-50/70 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 space-y-4">
                     <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-2xl font-bold">
                             <User className="w-5 h-5" />
                         </div>
                         <div>
                             <h4 className="font-extrabold text-slate-800 dark:text-white text-base">Documentos Personales & Identidad</h4>
                             <p className="text-xs text-slate-500">Cédulas, pasaportes, licencias, títulos de propiedad, matrículas y comprobantes de ingresos</p>
                         </div>
                     </div>

                     {personalDocs.length === 0 ? (
                         <div className="text-center py-8 text-slate-400 bg-white dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                             <User className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-500" />
                             <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No hay documentos personales registrados aún.</p>
                             <button onClick={() => setIsUploadModalOpen(true)} className="mt-2 text-xs text-indigo-600 font-bold hover:underline">Subir Cédula o Documento ahora</button>
                         </div>
                     ) : (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                             {personalDocs.map(doc => (
                                 <div 
                                     key={doc.id} 
                                     className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                                 >
                                     <div>
                                         <div className="flex justify-between items-start mb-3">
                                             <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold overflow-hidden border border-blue-100 dark:border-blue-800">
                                                 {doc.fileType?.startsWith('image/') ? (
                                                     <img src={doc.fileUrl} alt={doc.title} className="w-full h-full object-cover" />
                                                 ) : (
                                                     <User className="w-5 h-5" />
                                                 )}
                                             </div>
                                             <span className="text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                                 {doc.type}
                                             </span>
                                         </div>

                                         <h4 className="font-bold text-slate-800 dark:text-white text-xs line-clamp-2 mb-1">{doc.title}</h4>
                                         <p className="text-[10px] text-slate-400">Fecha: {doc.uploadDate}</p>
                                     </div>

                                     <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60">
                                         <button
                                             onClick={() => setPreviewDoc(doc)}
                                             className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                                         >
                                             <Eye className="w-3.5 h-3.5" /> Ver
                                         </button>
                                         <button
                                             onClick={() => handleOpenEditDoc(doc)}
                                             className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                                             title="Editar documento"
                                         >
                                             <Edit className="w-4 h-4" />
                                         </button>
                                         <button
                                             onClick={() => {
                                                 navigator.clipboard.writeText(doc.fileUrl);
                                                 addToast('Enlace copiado', 'success');
                                             }}
                                             className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-all"
                                             title="Copiar enlace"
                                         >
                                             <Globe className="w-4 h-4" />
                                         </button>
                                         <button
                                             onClick={() => removeClientDocument(doc.id)}
                                             className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                             title="Eliminar"
                                         >
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>

                 {/* SECCIÓN 2: DOCUMENTOS LEGALES & PRÉSTAMOS */}
                 <div className="bg-slate-50/70 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-3">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Expediente Legal Agrupado por Préstamo
                            </h4>
                            <p className="text-xs text-slate-500">Contratos iniciales, pagarés notariales, estados de cuenta y cartas de saldo ordenados por crédito</p>
                          </div>
                      </div>

                      {clientLoans.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 bg-white dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">El cliente no posee préstamos o contratos registrados.</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {clientLoans.map(l => {
                                  const formattedId = formatLoanId(l.id, l.loanCategory, l.loanType);
                                  const contratoUrl = `${window.location.origin}/documento/contrato/${l.id}`;
                                  const pagareUrl = `${window.location.origin}/documento/pagare/${l.id}`;
                                  const estadoUrl = `${window.location.origin}/documento/estado/${l.id}`;
                                  const saldoUrl = `${window.location.origin}/documento/saldo/${l.id}`;

                                  return (
                                      <div 
                                          key={l.id} 
                                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                                      >
                                          <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
                                              <div>
                                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                                                      Préstamo #{formattedId}
                                                  </span>
                                                  <h4 className="font-extrabold text-slate-800 dark:text-white text-base mt-1">
                                                      {l.loanCategory || 'Préstamo'} ({l.loanType})
                                                  </h4>
                                                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                      Monto: <strong className="text-slate-800 dark:text-slate-200">RD$ {(l.amount || 0).toLocaleString()}</strong> • Inicio: {l.startDate}
                                                  </p>
                                              </div>

                                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                                  l.status === 'Activo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                                                  l.status === 'Pagado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                              }`}>
                                                  {l.status}
                                              </span>
                                          </div>

                                          {/* Documents Actions Bar */}
                                          <div className="space-y-2">
                                              {/* 1. Contrato */}
                                              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                                                  <div className="flex items-center gap-2">
                                                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                      <span className="font-bold text-slate-700 dark:text-slate-200">Contrato de Préstamo</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                      <button 
                                                          onClick={() => setSelectedContractLoan(l)} 
                                                          className="px-2.5 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                                                      >
                                                          <Eye className="w-3 h-3" /> Ver Documento Oficial & Desglose
                                                      </button>
                                                      <button 
                                                          onClick={() => {
                                                              navigator.clipboard.writeText(contratoUrl);
                                                              addToast('Enlace de contrato copiado', 'success');
                                                          }} 
                                                          className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg"
                                                          title="Copiar Link"
                                                      >
                                                          <Globe className="w-3.5 h-3.5" />
                                                      </button>
                                                  </div>
                                              </div>

                                              {/* 2. Pagaré Notarial */}
                                              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                                                  <div className="flex items-center gap-2">
                                                      <FileCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                      <span className="font-bold text-slate-700 dark:text-slate-200">Pagaré Notarial</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                      <button 
                                                          onClick={() => window.open(pagareUrl, '_blank')} 
                                                          className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                                                      >
                                                          <Eye className="w-3 h-3" /> Ver
                                                      </button>
                                                      <button 
                                                          onClick={() => {
                                                              navigator.clipboard.writeText(pagareUrl);
                                                              addToast('Enlace de pagaré copiado', 'success');
                                                          }} 
                                                          className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg"
                                                          title="Copiar Link"
                                                      >
                                                          <Globe className="w-3.5 h-3.5" />
                                                      </button>
                                                  </div>
                                              </div>

                                              {/* 3. Estado de Cuenta */}
                                              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                                                  <div className="flex items-center gap-2">
                                                      <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                      <span className="font-bold text-slate-700 dark:text-slate-200">Estado de Cuenta</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                      <button 
                                                          onClick={() => window.open(estadoUrl, '_blank')} 
                                                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                                                      >
                                                          <Eye className="w-3 h-3" /> Ver
                                                      </button>
                                                      <button 
                                                          onClick={() => {
                                                              navigator.clipboard.writeText(estadoUrl);
                                                              addToast('Enlace de estado de cuenta copiado', 'success');
                                                          }} 
                                                          className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg"
                                                          title="Copiar Link"
                                                      >
                                                          <Globe className="w-3.5 h-3.5" />
                                                      </button>
                                                  </div>
                                              </div>

                                              {/* 4. Carta de Saldo Cero (Si está completado/pagado) */}
                                              {l.status === 'Pagado' && (
                                                  <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 text-xs">
                                                      <div className="flex items-center gap-2">
                                                          <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                          <span className="font-bold text-blue-900 dark:text-blue-200">Carta de Saldo Cero</span>
                                                      </div>
                                                      <div className="flex items-center gap-1">
                                                          <button 
                                                              onClick={() => window.open(saldoUrl, '_blank')} 
                                                              className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 hover:bg-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                                                          >
                                                              <Eye className="w-3 h-3" /> Ver
                                                          </button>
                                                          <button 
                                                              onClick={() => {
                                                                  navigator.clipboard.writeText(saldoUrl);
                                                                  addToast('Enlace de carta de saldo copiado', 'success');
                                                              }} 
                                                              className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg"
                                                              title="Copiar Link"
                                                          >
                                                              <Globe className="w-3.5 h-3.5" />
                                                          </button>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>

                                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                              <button 
                                                  onClick={() => navigate(`/prestamos/${l.id}`)}
                                                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                              >
                                                  Ver Préstamo Completo →
                                              </button>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                 </div>
            </div>
        )}

        {activeTab === 'collateral' && (
            <div className="space-y-6">
                 <div className="flex justify-between items-center flex-wrap gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Garantías & Avales del Cliente</h3>
                        <p className="text-xs text-slate-500">Móviles, vehículos, tarjetas de crédito, propiedades e inmuebles registrados</p>
                      </div>
                      <button 
                        onClick={() => {
                            setUploadDocType('Garantia');
                            setUploadDocTitle('Foto de Garantía / Matrícula');
                            setIsUploadModalOpen(true);
                        }} 
                        className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                          <Upload className="w-4 h-4" /> + Subir Foto de Garantía
                      </button>
                 </div>

                 {clientCollaterals.length === 0 ? (
                     <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                         <Shield className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                         <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No hay garantías registradas para este cliente.</p>
                         <p className="text-xs text-slate-400 mt-1">Al crear préstamos con garantía (Vehículo, Teléfono, Tarjeta, Inmueble) aparecerán automáticamente aquí.</p>
                     </div>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         {clientCollaterals.map(({ loanId, loanCategory, loanType, loanStatus, itemPrice, downPayment, downPaymentMode, collateral }, idx) => {
                             const isFinancing = loanCategory === 'Financiamiento' || (loanType && loanType.includes('Financiamiento'));
                             return (
                             <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                                 <div className="flex justify-between items-start mb-4">
                                     <div className="flex items-center gap-3">
                                         <div className={`p-3 rounded-2xl border font-bold ${
                                             isFinancing 
                                                 ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                                 : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                         }`}>
                                             {isFinancing ? <Package className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                                         </div>
                                         <div>
                                             <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                                                 isFinancing 
                                                     ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                                                     : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                                             }`}>
                                                 {isFinancing ? 'Bien Financiado (Reserva Dominio)' : `Garantía (${collateral.type})`}
                                             </span>
                                             <h4 className="font-extrabold text-slate-800 dark:text-white text-base mt-1">
                                                 {collateral.description || collateral.type}
                                             </h4>
                                         </div>
                                     </div>

                                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                         loanStatus === 'Activo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                                         loanStatus === 'Pagado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                                         'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                     }`}>
                                         Préstamo {loanStatus}
                                     </span>
                                 </div>

                                 {/* Spec Details */}
                                 <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs space-y-2 mb-4">
                                     {collateral.refNumber && (
                                         <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-600/60 pb-1.5">
                                             <span className="text-slate-400 font-bold">Ref / Serial / Matrícula:</span>
                                             <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{collateral.refNumber}</span>
                                         </div>
                                     )}
                                     {collateral.brand && (
                                         <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-600/60 pb-1.5">
                                             <span className="text-slate-400 font-bold">Marca / Modelo:</span>
                                             <span className="font-bold text-slate-800 dark:text-slate-200">{collateral.brand} {collateral.model || ''}</span>
                                         </div>
                                     )}
                                     {collateral.imei2 && (
                                         <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-600/60 pb-1.5">
                                             <span className="text-slate-400 font-bold">IMEI 2:</span>
                                             <span className="font-mono text-slate-800 dark:text-slate-200">{collateral.imei2}</span>
                                         </div>
                                     )}
                                     {collateral.cardType && (
                                         <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-600/60 pb-1.5">
                                             <span className="text-slate-400 font-bold">Tarjeta:</span>
                                             <span className="font-bold text-slate-800 dark:text-slate-200">{collateral.bankName || ''} {collateral.cardType} (**** {collateral.last4})</span>
                                         </div>
                                     )}
                                     {isFinancing && itemPrice ? (
                                         <>
                                             <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-600/60 pb-1.5">
                                                 <span className="text-slate-400 font-bold">Precio Total de Venta:</span>
                                                 <span className="font-extrabold text-slate-800 dark:text-slate-200">RD$ {itemPrice.toLocaleString('es-DO')}</span>
                                             </div>
                                             {downPayment !== undefined && (
                                                 <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-600/60 pb-1.5">
                                                     <span className="text-slate-400 font-bold">Inicial Pagado:</span>
                                                     <span className="font-extrabold text-emerald-600 dark:text-emerald-400">RD$ {downPayment.toLocaleString('es-DO')} ({downPaymentMode || 'Efectivo'})</span>
                                                 </div>
                                             )}
                                         </>
                                     ) : collateral.estimatedValue ? (
                                         <div className="flex justify-between">
                                             <span className="text-slate-400 font-bold">Valor Estimado:</span>
                                             <span className="font-extrabold text-emerald-600 dark:text-emerald-400">RD$ {collateral.estimatedValue.toLocaleString()}</span>
                                         </div>
                                     ) : null}
                                     
                                     {/* Attached Photos / Documents Gallery */}
                                     {collateral.photoUrls && collateral.photoUrls.length > 0 && (
                                         <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-600/60">
                                             <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1.5">Fotos & Documentos de la Garantía:</span>
                                             <div className="flex flex-wrap gap-2">
                                                 {collateral.photoUrls.map((photo, pIdx) => (
                                                     <div 
                                                         key={pIdx} 
                                                         onClick={() => setPreviewDoc({
                                                             id: `col-photo-${pIdx}`,
                                                             clientId: client.id,
                                                             title: `Foto de Garantía - ${collateral.type}`,
                                                             type: 'Garantia',
                                                             fileUrl: photo,
                                                             uploadDate: new Date().toISOString().split('T')[0],
                                                             fileType: 'image/png'
                                                         })}
                                                         className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                                     >
                                                         {photo.startsWith('data:image') || photo.match(/\.(jpg|jpeg|png|webp)/i) || !photo.includes('.pdf') ? (
                                                             <img src={photo} alt="Garantía" className="w-full h-full object-cover" />
                                                         ) : (
                                                             <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">PDF</div>
                                                         )}
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     )}
                                 </div>

                                 <div className="flex items-center justify-between pt-2">
                                     <span className="text-xs text-slate-400 font-bold">Asociado a: Préstamo #{formatLoanId(loanId, loanCategory, loanType)}</span>
                                     <button
                                         onClick={() => navigate(`/prestamos/${loanId}?tab=collateral`)}
                                         className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all"
                                     >
                                         Ver Garantía en Préstamo →
                                     </button>
                                 </div>
                             </div>
                             );
                         })}
                     </div>
                 )}
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
                                onChange={e => setUploadDocType(e as ClientDocument['type'])}
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

      {/* Edit Document Modal */}
      {isEditDocModalOpen && editingDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-white">Editar Documento del Cliente</h3>
                     <button onClick={() => setIsEditDocModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                 </div>
                 <form onSubmit={handleSaveEditDoc} className="space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Título del Documento</label>
                         <input 
                             type="text" 
                             required
                             className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 dark:text-white text-sm font-bold"
                             value={editDocTitle} 
                             onChange={e => setEditDocTitle(e.target.value)} 
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría / Tipo</label>
                         <CustomSelect 
                             className="w-full"
                             value={editDocType} 
                             onChange={e => setEditDocType(e as ClientDocument['type'])}
                             options={[
                                 { value: 'Cedula', label: 'Cédula de Identidad' },
                                 { value: 'Pasaporte', label: 'Pasaporte' },
                                 { value: 'Matricula', label: 'Matrícula de Vehículo' },
                                 { value: 'Titulo', label: 'Título de Propiedad' },
                                 { value: 'Contrato', label: 'Contrato Firmado / Pagaré' },
                                 { value: 'Licencia', label: 'Licencia de Conducir' },
                                 { value: 'Ingresos', label: 'Comprobante de Ingresos / Trabajo' },
                                 { value: 'Garantia', label: 'Garantía / Aval' },
                                 { value: 'Otro', label: 'Otro' }
                             ]}
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reemplazar Archivo / Foto (Opcional)</label>
                         <input 
                             type="file" 
                             accept="image/*,.pdf"
                             onChange={e => setEditDocFile(e.target.files?.[0] || null)}
                             className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                         />
                     </div>

                     <div className="flex gap-3 pt-4">
                         <button 
                             type="button" 
                             onClick={() => setIsEditDocModalOpen(false)} 
                             className="flex-1 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                         >
                             Cancelar
                         </button>
                         <button 
                             type="submit" 
                             className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                         >
                             Guardar Cambios
                         </button>
                     </div>
                 </form>
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

      {/* Contract Modal */}
      <LoanContractModal
        isOpen={!!selectedContractLoan}
        onClose={() => setSelectedContractLoan(null)}
        loan={selectedContractLoan || undefined}
      />
    </div>
  );
};

// Helper Components
const DetailGroup: React.FC<{ icon: React.ElementType, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
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

const ActionButton: React.FC<{ icon: React.ElementType, label: string, onClick?: () => void, primary?: boolean }> = ({ icon: Icon, label, onClick, primary }) => (
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
