import React, { useState, useEffect } from 'react';
import {
  User, Phone, MapPin, Plus, Crosshair, Save, ArrowLeft,
  Building, Briefcase, Mail, ChevronRight, CheckCircle,
  AlertTriangle, Hash, FileText, Camera, Wand2, Globe, CheckCircle2, Copy, ExternalLink, Settings
} from 'lucide-react';
import { useClients } from '../context/StoreContext';
import { Client } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { maskPhone, maskCedula } from '../utils/masks';
import { useToast } from '../context/ToastContext';
import { CustomSelect } from '../components/CustomSelect';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { insforge } from '../lib/insforge';

const STEPS = [
  { id: 1, label: 'Datos Personales', icon: User },
  { id: 2, label: 'Contacto', icon: Phone },
  { id: 3, label: 'Información Laboral', icon: Briefcase },
];

const NewClient: React.FC = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { clients, addClient, updateClient, routes, addClientDocument } = useClients();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rawAvatarSrc, setRawAvatarSrc] = useState<string | null>(null);
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [createdSuccessClient, setCreatedSuccessClient] = useState<Client | null>(null);

  const [currentClient, setCurrentClient] = useState<Partial<Client>>({
    name: '', lastName: '', sex: 'Masculino', phone: '', whatsapp: '', phoneHome: '',
    cedula: '', documentType: 'Cedula', email: '', address: '', province: '', sector: '',
    municipality: '', referenceAddress: '', companyName: '', jobPosition: '', occupation: '',
    income: 0, routeId: '', routeSequence: 0, creditScore: 100, avatarUrl: ''
  });

  const [docFile, setDocFile] = useState<string>('');

  useEffect(() => {
    if (isEditMode && id) {
      const client = clients.find(c => c.id === id);
      if (client) {
        setCurrentClient(client);
      } else {
        addToast('Cliente no encontrado', 'error');
        navigate('/clientes');
      }
    }
  }, [isEditMode, id, clients, navigate, addToast]);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDocFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentClient({ ...currentClient, coordinates: { lat: position.coords.latitude, lng: position.coords.longitude } });
          addToast('Ubicación GPS capturada', 'success');
        },
        () => addToast('No se pudo obtener la ubicación. Verifica los permisos del navegador.', 'error')
      );
    } else {
      addToast('Geolocalización no disponible en este navegador', 'error');
    }
  };

  const handleGenerateAliasFromName = () => {
    const fullName = `${currentClient.name || ''} ${currentClient.lastName || ''}`.trim();
    if (!fullName) {
      addToast('Ingresa el nombre del cliente primero para generar el enlace', 'warning');
      return;
    }
    const baseSlug = fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    if (!baseSlug) return;

    let finalAlias = baseSlug;
    const exists = clients.find(c => c.portalAlias === finalAlias && c.id !== currentClient.id);
    if (exists) {
      const randDigits = Math.floor(10 + Math.random() * 90);
      finalAlias = `${baseSlug}-${randDigits}`;
    }

    set('portalAlias', finalAlias);
    addToast(`Enlace generado automáticamente: ${finalAlias}`, 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalClient = {
      ...currentClient,
      name: currentClient.name?.trim() || 'Cliente Nuevo',
      phone: currentClient.phone?.trim() || '',
      address: currentClient.address?.trim() || '',
      cedula: currentClient.cedula?.trim() || '',
      documentType: currentClient.documentType || 'Cedula',
    };

    try {
      if (isEditMode && finalClient.id) {
        await updateClient(finalClient as Client);
        navigate('/clientes');
      } else {
        const newClient = await addClient(finalClient as Omit<Client, 'id' | 'joinedDate'>);
        if (newClient) {
          if (docFile && currentClient.documentType) {
            await addClientDocument({
              id: Date.now().toString(),
              clientId: newClient.id,
              title: `Documento de Identidad (${currentClient.documentType})`,
              type: currentClient.documentType === 'Cedula' ? 'Cedula' : 'Otro',
              fileUrl: docFile,
              fileType: docFile.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
              uploadDate: new Date().toISOString().split('T')[0]
            });
          }
          setCreatedSuccessClient(newClient);
          addToast('¡Cliente registrado exitosamente!', 'success');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = <K extends keyof Client>(field: K, value: Client[K]) => setCurrentClient(prev => ({ ...prev, [field]: value }));

  const inputClass = "w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none dark:text-white text-sm transition-all placeholder-slate-400 dark:placeholder-slate-600";
  const labelClass = "block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-2">
        <button
          onClick={() => navigate('/clientes')}
          className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isEditMode ? 'Modifica la información del cliente' : 'Completa el formulario para registrar un nuevo cliente'}
          </p>
        </div>
      </div>

      {/* Step Indicator (only for new client) */}
      {!isEditMode && (
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => s.id < step && setStep(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30' : done ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'}`}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.id}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* STEP 1: Datos Personales */}
        {(isEditMode || step === 1) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white text-sm">Datos Personales</h2>
                <p className="text-xs text-slate-500">Información básica de identificación</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Foto de Perfil Circular (Opcional) */}
              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group shrink-0">
                  {currentClient.avatarUrl ? (
                    <img
                      src={currentClient.avatarUrl}
                      alt="Foto Cliente"
                      className="w-24 h-24 rounded-full object-cover border-4 border-indigo-600 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 dark:border-indigo-700">
                      <User className="w-8 h-8" />
                      <span className="text-[10px] font-bold mt-1">Sin Foto</span>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleAvatarFileSelect} className="hidden" />
                  </label>
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                    Foto de Perfil del Cliente
                    <span className="text-[10px] font-normal text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">Opcional</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    La fotografía es opcional. Puedes subir una imagen y recortarla en formato circular.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-xs transition-all">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    {currentClient.avatarUrl ? 'Cambiar Foto Circular' : 'Subir Foto Circular'}
                    <input type="file" accept="image/*" onChange={handleAvatarFileSelect} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className={labelClass}>Nombre(s)</label>
                <input
                  type="text" className={inputClass}
                  value={currentClient.name || ''}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Ej. Juan Carlos"
                />
              </div>
              <div>
                <label className={labelClass}>Apellidos</label>
                <input
                  type="text" className={inputClass}
                  value={currentClient.lastName || ''}
                  onChange={e => set('lastName', e.target.value)}
                  placeholder="Ej. Pérez García"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Documento de Identidad (Opcional)</label>
                <div className="flex gap-2">
                  <div className="w-36">
                    <CustomSelect
                      className="w-full"
                      value={currentClient.documentType || 'Cedula'}
                      onChange={v => set('documentType', v)}
                      options={[
                        { value: 'Cedula', label: 'Cédula' },
                        { value: 'Pasaporte', label: 'Pasaporte' },
                        { value: 'Licencia', label: 'Licencia' },
                        { value: 'ID', label: 'ID' },
                        { value: 'Otro', label: 'Otro' }
                      ]}
                    />
                  </div>
                  <input
                    type="text"
                    className={`${inputClass} flex-1`}
                    value={currentClient.cedula || ''}
                    onChange={e => set('cedula', maskCedula(e.target.value))}
                    placeholder="001-0000000-0"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Sexo</label>
                <CustomSelect
                  className="w-full"
                  value={currentClient.sex || 'Masculino'}
                  onChange={v => set('sex', v)}
                  options={[
                    { value: 'Masculino', label: 'Masculino' },
                    { value: 'Femenino', label: 'Femenino' },
                    { value: 'Otro', label: 'Otro' }
                  ]}
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email" className={`${inputClass} pl-10`}
                    value={currentClient.email || ''}
                    onChange={e => set('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              {!isEditMode && (
                <div className="md:col-span-2">
                  <label className={labelClass}>Imagen del Documento (Opcional)</label>
                  <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/10 transition-all group">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                      {docFile ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Camera className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                        {docFile ? 'Imagen seleccionada' : 'Seleccionar imagen o PDF'}
                      </p>
                      <p className="text-xs text-slate-400">JPG, PNG, PDF hasta 5MB</p>
                    </div>
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>
            {!isEditMode && step === 1 && (
              <div className="px-6 pb-6 flex justify-end">
                <button type="button" onClick={() => setStep(2)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Contacto y Ubicación */}
        {(isEditMode || step === 2) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white text-sm">Contacto y Ubicación</h2>
                <p className="text-xs text-slate-500">Teléfonos y dirección del cliente</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Teléfono Principal</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" className={`${inputClass} pl-10`}
                    value={currentClient.phone || ''}
                    onChange={e => set('phone', maskPhone(e.target.value))}
                    placeholder="(809) 000-0000"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>WhatsApp</label>
                <input type="text" className={inputClass}
                  value={currentClient.whatsapp || ''}
                  onChange={e => set('whatsapp', maskPhone(e.target.value))}
                  placeholder="(809) 000-0000"
                />
              </div>
              <div>
                <label className={labelClass}>Teléfono Casa</label>
                <input type="text" className={inputClass}
                  value={currentClient.phoneHome || ''}
                  onChange={e => set('phoneHome', maskPhone(e.target.value))}
                  placeholder="(809) 000-0000"
                />
              </div>

              {/* Enlace Personalizado del Portal (Opcional) */}
              <div className="md:col-span-3 bg-indigo-50/60 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    Enlace Personalizado del Portal (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAliasFromName}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Generar con Nombre
                  </button>
                </div>
                <div className="flex rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-slate-900">
                  <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-bold font-mono flex items-center shrink-0">
                    {window.location.origin}/portal/
                  </span>
                  <input
                    type="text"
                    value={currentClient.portalAlias || ''}
                    onChange={e => set('portalAlias', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="juan-perez"
                    className="flex-1 block w-full px-3 py-2 font-mono font-bold text-xs bg-white dark:bg-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">
                  Solo letras y números (sin caracteres especiales ni espacios). Puedes generarlo automáticamente con el botón o escribirlo manualmente.
                </p>
              </div>

              <div className="md:col-span-3">
                <label className={labelClass}>Dirección Física</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" className={`${inputClass} pl-10`}
                      value={currentClient.address || ''}
                      onChange={e => set('address', e.target.value)}
                      placeholder="Calle, Número, Sector..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureLocation}
                    title="Capturar GPS"
                    className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-2 text-sm font-semibold shrink-0"
                  >
                    <Crosshair className="w-4 h-4" />
                    <span className="hidden sm:inline">GPS</span>
                  </button>
                </div>
                {currentClient.coordinates && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    GPS capturado: {currentClient.coordinates.lat.toFixed(5)}, {currentClient.coordinates.lng.toFixed(5)}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Provincia</label>
                <input type="text" className={inputClass}
                  value={currentClient.province || ''}
                  onChange={e => set('province', e.target.value)}
                  placeholder="Ej. Santo Domingo"
                />
              </div>
              <div>
                <label className={labelClass}>Municipio</label>
                <input type="text" className={inputClass}
                  value={currentClient.municipality || ''}
                  onChange={e => set('municipality', e.target.value)}
                  placeholder="Ej. Santo Domingo Este"
                />
              </div>
              <div>
                <label className={labelClass}>Sector</label>
                <input type="text" className={inputClass}
                  value={currentClient.sector || ''}
                  onChange={e => set('sector', e.target.value)}
                  placeholder="Ej. Los Mina"
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelClass}>Punto de Referencia</label>
                <input type="text" className={inputClass}
                  value={currentClient.referenceAddress || ''}
                  onChange={e => set('referenceAddress', e.target.value)}
                  placeholder="Ej. Cerca de la Farmacia Cruz Verde"
                />
              </div>
            </div>
            {!isEditMode && step === 2 && (
              <div className="px-6 pb-6 flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Anterior
                </button>
                <button type="button" onClick={() => setStep(3)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Información Laboral */}
        {(isEditMode || step === 3) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 dark:to-transparent">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white text-sm">Información Laboral</h2>
                <p className="text-xs text-slate-500">Empleo, ingresos y asignación de ruta</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Empresa / Lugar de Trabajo</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" className={`${inputClass} pl-10`}
                    value={currentClient.companyName || ''}
                    onChange={e => set('companyName', e.target.value)}
                    placeholder="Nombre de empresa"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Cargo / Posición</label>
                <input type="text" className={inputClass}
                  value={currentClient.jobPosition || ''}
                  onChange={e => set('jobPosition', e.target.value)}
                  placeholder="Ej. Gerente de Ventas"
                />
              </div>

              <div>
                <label className={labelClass}>Ocupación / Profesión</label>
                <input type="text" className={inputClass}
                  value={currentClient.occupation || ''}
                  onChange={e => set('occupation', e.target.value)}
                  placeholder="Ej. Comerciante"
                />
              </div>
              <div>
                <label className={labelClass}>Ingresos Mensuales (RD$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                  <input type="number" min="0" className={`${inputClass} pl-8 font-semibold text-amber-600 dark:text-amber-400`}
                    value={currentClient.income || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={e => set('income', e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {routes.length > 0 && (
                <>
                  <div>
                    <label className={labelClass}>Zona / Ruta</label>
                    <CustomSelect
                      className="w-full"
                      value={currentClient.routeId || ''}
                      onChange={v => set('routeId', v)}
                      options={[
                        { value: '', label: '— Sin ruta —' },
                        ...routes.map(r => ({ value: r.id, label: r.name }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Orden de Cobro</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="number" min="0" className={`${inputClass} pl-10`}
                        value={currentClient.routeSequence || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={e => set('routeSequence', e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="Ej. 1"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>Score de Crédito (0–100)</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Puntuación inicial</span>
                    <span className={`text-sm font-bold ${(currentClient.creditScore || 0) >= 80 ? 'text-emerald-600' : (currentClient.creditScore || 0) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {currentClient.creditScore || 100} pts
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={currentClient.creditScore || 100}
                    onChange={e => set('creditScore', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(isEditMode || step === 3) && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!isEditMode && (
              <button type="button" onClick={() => setStep(2)} className="flex-1 sm:flex-none px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/clientes')}
              className="flex-1 sm:flex-none px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-semibold text-sm transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Guardar Cambios' : 'Registrar Cliente'}
                </>
              )}
            </button>
          </div>
        )}

      </form>

      {/* Modal de Recorte Cuadrado de Foto */}
      {showCropperModal && rawAvatarSrc && (
        <ImageCropperModal
          imageSrc={rawAvatarSrc}
          onCropComplete={async (croppedDataUrl) => {
            set('avatarUrl', croppedDataUrl);
            setShowCropperModal(false);
            setRawAvatarSrc(null);
            addToast('Foto de perfil lista', 'success');

            // Upload cropped image to InsForge Storage bucket
            try {
              const res = await fetch(croppedDataUrl);
              const blob = await res.blob();
              const filename = `avatars/avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
              const { error } = await insforge.storage.from('client-documents').upload(filename, blob);
              if (!error) {
                const { data } = insforge.storage.from('client-documents').getPublicUrl(filename);
                if (data?.publicUrl) {
                  set('avatarUrl', data.publicUrl);
                }
              }
            } catch (err) {
              console.warn("Storage avatar upload fallback:", err);
            }
          }}
          onClose={() => {
            setShowCropperModal(false);
            setRawAvatarSrc(null);
          }}
        />
      )}

      {/* Modal de Confirmación de Registro Exitoso & Portal del Cliente */}
      {createdSuccessClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">¡Cliente Registrado con Éxito!</h2>
              <p className="text-xs text-slate-500 font-medium">
                {createdSuccessClient.name} {createdSuccessClient.lastName || ''} - Cédula: {createdSuccessClient.cedula || 'N/A'}
              </p>
            </div>

            {/* Link del Portal */}
            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-indigo-600" /> Enlace del Portal del Cliente</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">Portal Activo</span>
              </label>
              
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 p-2.5 rounded-xl font-mono text-xs text-indigo-900 dark:text-indigo-300 font-bold overflow-x-auto">
                <span className="truncate flex-1">
                  {window.location.origin}/portal/{createdSuccessClient.portalAlias || createdSuccessClient.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/portal/${createdSuccessClient.portalAlias || createdSuccessClient.id}`;
                    navigator.clipboard.writeText(url);
                    addToast('Enlace del portal copiado al portapapeles', 'success');
                  }}
                  className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Enlace
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/portal/${createdSuccessClient.portalAlias || createdSuccessClient.id}`;
                    window.open(url, '_blank');
                  }}
                  className="px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-indigo-200 dark:border-indigo-800 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Probar / Ver Portal
                </button>
              </div>
            </div>

            {/* Opciones de Portal y Redirección */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigate('/portales');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" /> Configurar / Editar Portal del Cliente
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/clientes/${createdSuccessClient.id}`);
                  }}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" /> Ver Perfil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreatedSuccessClient(null);
                    setCurrentClient({
                      name: '', lastName: '', sex: 'Masculino', phone: '', whatsapp: '', phoneHome: '',
                      cedula: '', documentType: 'Cedula', email: '', address: '', province: '', sector: '',
                      municipality: '', referenceAddress: '', companyName: '', jobPosition: '', occupation: '',
                      income: 0, routeId: '', routeSequence: 0, creditScore: 100, avatarUrl: '', portalAlias: ''
                    });
                    setStep(1);
                  }}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Otro
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigate('/clientes');
                }}
                className="w-full py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 text-xs font-semibold text-center block pt-1"
              >
                Ir a la Lista General de Clientes →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewClient;
