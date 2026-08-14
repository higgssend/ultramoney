import React from 'react';
import { UserCheck, Plus, Trash2, ShieldCheck, Phone, Briefcase, DollarSign, MapPin, Users } from 'lucide-react';
import { Guarantor } from '../types';
import { CustomSelect } from './CustomSelect';

interface GuarantorFormProps {
  guarantors: Guarantor[];
  onChange: (guarantors: Guarantor[]) => void;
  maxGuarantors?: number;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'Familiar (Hermano/a, Padre, Madre, Hijo/a)', label: 'Familiar (Hermano/a, Padre, Madre, Hijo/a)' },
  { value: 'Cónyuge / Pareja', label: 'Cónyuge / Pareja' },
  { value: 'Amigo / Conocido', label: 'Amigo / Conocido' },
  { value: 'Compañero de Trabajo', label: 'Compañero de Trabajo' },
  { value: 'Socio Comercial', label: 'Socio Comercial' },
  { value: 'Vecino', label: 'Vecino' },
  { value: 'Otro', label: 'Otro' }
];

export const GuarantorForm: React.FC<GuarantorFormProps> = ({
  guarantors = [],
  onChange,
  maxGuarantors = 2
}) => {
  const handleAddGuarantor = () => {
    if (guarantors.length >= maxGuarantors) return;
    const newGuarantor: Guarantor = {
      id: Date.now().toString(),
      name: '',
      lastName: '',
      cedula: '',
      phone: '',
      relationship: 'Familiar (Hermano/a, Padre, Madre, Hijo/a)',
      address: '',
      workplace: '',
      jobPosition: '',
      monthlyIncome: 0,
      notes: ''
    };
    onChange([...guarantors, newGuarantor]);
  };

  const handleRemoveGuarantor = (id: string) => {
    onChange(guarantors.filter(g => g.id !== id));
  };

  const handleUpdateGuarantor = <K extends keyof Guarantor>(
    id: string,
    field: K,
    value: Guarantor[K]
  ) => {
    onChange(
      guarantors.map(g => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Garantes y Codeudores Solidarios
              <span className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full font-medium">
                Opcional
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Asocia hasta {maxGuarantors} garantes solidarios para blindaje legal y pagaré notarial.
            </p>
          </div>
        </div>

        {guarantors.length < maxGuarantors && (
          <button
            type="button"
            onClick={handleAddGuarantor}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-indigo-200/60 dark:border-indigo-800 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Garante ({guarantors.length}/{maxGuarantors})</span>
          </button>
        )}
      </div>

      {guarantors.length === 0 ? (
        <div className="p-6 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
          <div className="inline-flex p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 shadow-sm">
            <UserCheck className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Sin garantes solidarios registrados para este crédito.
          </p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Si este préstamo requiere aval o codeudor, haz clic en el botón &quot;Agregar Garante&quot; para registrar sus datos y generar el pagaré mancomunado.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {guarantors.map((guarantor, index) => (
            <div
              key={guarantor.id}
              className="p-5 md:p-6 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4 relative transition-all"
            >
              {/* Header of Guarantor Card */}
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm">
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      {index === 0 ? 'Garante Principal' : 'Garante Secundario / Codeudor'}
                    </span>
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3" /> Responsabilidad Solidaria
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveGuarantor(guarantor.id)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors text-xs flex items-center gap-1 font-bold"
                  title="Eliminar garante"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Quitar</span>
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* Nombres */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombres del Garante <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guarantor.name}
                    onChange={(e) => handleUpdateGuarantor(guarantor.id, 'name', e.target.value)}
                    placeholder="Ej. Carlos Manuel"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-white outline-none"
                    required
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={guarantor.lastName || ''}
                    onChange={(e) => handleUpdateGuarantor(guarantor.id, 'lastName', e.target.value)}
                    placeholder="Ej. Gómez Pérez"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-white outline-none"
                  />
                </div>

                {/* Cédula */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cédula / Documento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guarantor.cedula}
                    onChange={(e) => handleUpdateGuarantor(guarantor.id, 'cedula', e.target.value)}
                    placeholder="001-0000000-0"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800 dark:text-white outline-none"
                    required
                  />
                </div>

                {/* Teléfono / WhatsApp */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    Teléfono / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={guarantor.phone}
                    onChange={(e) => handleUpdateGuarantor(guarantor.id, 'phone', e.target.value)}
                    placeholder="809-000-0000"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-white outline-none"
                    required
                  />
                </div>

                {/* Parentesco / Relación */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Parentesco o Vínculo
                  </label>
                  <CustomSelect
                    value={guarantor.relationship || 'Familiar (Hermano/a, Padre, Madre, Hijo/a)'}
                    onChange={(val) => handleUpdateGuarantor(guarantor.id, 'relationship', val)}
                    options={RELATIONSHIP_OPTIONS}
                    className="w-full"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    Dirección Residencial
                  </label>
                  <input
                    type="text"
                    value={guarantor.address || ''}
                    onChange={(e) => handleUpdateGuarantor(guarantor.id, 'address', e.target.value)}
                    placeholder="Calle, No., Sector, Ciudad"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-white outline-none"
                  />
                </div>

                {/* Lugar de Trabajo / Empresa */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                    Lugar de Trabajo / Empresa
                  </label>
                  <input
                    type="text"
                    value={guarantor.workplace || ''}
                    onChange={(e) => handleUpdateGuarantor(guarantor.id, 'workplace', e.target.value)}
                    placeholder="Ej. Distribuidora Nacional"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-white outline-none"
                  />
                </div>

                {/* Cargo / Ocupación */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cargo u Ocupación
                  </label>
                  <input
                    type="text"
                    value={guarantor.jobPosition || ''}
                    onChange={(e) => handleUpdateGuarantor(guarantor.id, 'jobPosition', e.target.value)}
                    placeholder="Ej. Supervisor de Ventas"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-white outline-none"
                  />
                </div>

                {/* Ingreso Mensual Estimado */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    Ingresos Mensuales Estimados
                  </label>
                  <input
                    type="number"
                    value={guarantor.monthlyIncome === 0 ? '' : guarantor.monthlyIncome}
                    onChange={(e) => handleUpdateGuarantor(guarantor.id, 'monthlyIncome', Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Legal Advisory Note */}
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2 text-xs text-indigo-700 dark:text-indigo-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
            <p>
              <strong>Blindaje Legal Activado:</strong> Al agregar garantes, el sistema generará las cláusulas mancomunadas y solidarias en el Pagaré Notarial y habilitará alertas de cobro directo si el deudor incurre en mora.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuarantorForm;
