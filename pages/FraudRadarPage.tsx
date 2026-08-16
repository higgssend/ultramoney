import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Users, Phone, MapPin, Landmark, AlertTriangle, 
  Share2, Plus, Edit2, Trash2, Search, Filter, CheckCircle2, 
  ArrowRight, ShieldCheck, FileText, X, Save, RefreshCw, 
  ExternalLink, Network, Eye, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, useLoans, useAccounting } from '../context/StoreContext';
import { FraudRadarEngine, CrossGuarantorAlert, SharedDataAlert } from '../utils/FraudRadarEngine';
import { ClientRelationship, RelationshipType, formatLoanId } from '../types';
import StatCard from '../components/StatCard';
import { CustomSelect } from '../components/CustomSelect';
import { toast } from 'sonner';

export const FraudRadarPage: React.FC = () => {
  const navigate = useNavigate();
  const { clients = [], clientRelationships = [], addClientRelationship, updateClientRelationship, deleteClientRelationship } = useClients();
  const { loans = [] } = useLoans();
  const { bankAccounts = [] } = useAccounting();

  const [activeTab, setActiveTab] = useState<'cross' | 'duplicates' | 'network' | 'manage'>('cross');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for Custom Relationships (Add / Edit / Delete)
  const [isAddRelationshipModalOpen, setIsAddRelationshipModalOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<ClientRelationship | null>(null);
  const [relationshipToDelete, setRelationshipToDelete] = useState<ClientRelationship | null>(null);

  // Form State
  const [clientIdA, setClientIdA] = useState('');
  const [clientIdB, setClientIdB] = useState('');
  const [relType, setRelType] = useState<RelationshipType>('Familiar / Pariente');
  const [relNotes, setRelNotes] = useState('');

  // 1. Cross Guarantor Alerts
  const crossGuarantorAlerts: CrossGuarantorAlert[] = useMemo(() => {
    try {
      return FraudRadarEngine.detectCrossGuarantors(clients, loans);
    } catch (err) {
      console.error('Error detecting cross guarantors:', err);
      return [];
    }
  }, [clients, loans]);

  // 2. Shared Duplicate Data Alerts
  const sharedDataAlerts: SharedDataAlert[] = useMemo(() => {
    try {
      return FraudRadarEngine.detectSharedData(clients, bankAccounts);
    } catch (err) {
      console.error('Error detecting shared data:', err);
      return [];
    }
  }, [clients, bankAccounts]);

  // 3. Relationship Network
  const networkGraph = useMemo(() => {
    try {
      return FraudRadarEngine.buildRelationshipGraph(clients, loans, clientRelationships);
    } catch (err) {
      console.error('Error building relationship graph:', err);
      return { nodes: [], edges: [] };
    }
  }, [clients, loans, clientRelationships]);

  // Submit Add / Edit Relationship
  const handleSaveRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdA || !clientIdB) {
      toast.error('Seleccione ambos clientes para vincular');
      return;
    }
    if (clientIdA === clientIdB) {
      toast.error('No puede vincular a un cliente consigo mismo');
      return;
    }

    const clientA = clients.find(c => c.id === clientIdA);
    const clientB = clients.find(c => c.id === clientIdB);

    if (!clientA || !clientB) {
      toast.error('Cliente no válido');
      return;
    }

    if (editingRelationship) {
      await updateClientRelationship(editingRelationship.id, {
        relationshipType: relType,
        notes: relNotes.trim() || undefined,
        clientNameA: clientA.name,
        clientNameB: clientB.name
      });
      setEditingRelationship(null);
    } else {
      await addClientRelationship({
        clientIdA: clientA.id,
        clientNameA: clientA.name,
        clientIdB: clientB.id,
        clientNameB: clientB.name,
        relationshipType: relType,
        notes: relNotes.trim() || undefined
      });
      setIsAddRelationshipModalOpen(false);
    }

    setClientIdA('');
    setClientIdB('');
    setRelNotes('');
  };

  const handleConfirmDelete = async () => {
    if (!relationshipToDelete) return;
    await deleteClientRelationship(relationshipToDelete.id);
    setRelationshipToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" /> Prevención de Fraude & Vínculos Cruzados
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Radar Antifraude & Red de Vinculaciones</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Detección inmediata de fianzas cruzadas (A garantiza a B y B garantiza a A), teléfonos o cuentas bancarias duplicadas y mapeo de relaciones familiares o comerciales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingRelationship(null);
                setClientIdA('');
                setClientIdB('');
                setRelNotes('');
                setIsAddRelationshipModalOpen(true);
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg transition-all text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> + Registrar Vínculo Manual
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Garantes Cruzados Detectados"
          value={String(crossGuarantorAlerts.length)}
          trend="Riesgo de Fianza Inejecutable"
          trendUp={false}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-rose-600 to-red-700"
          glowColor="shadow-rose-500/20"
        />
        <StatCard
          title="Identidades Compartidas"
          value={String(sharedDataAlerts.length)}
          trend="Mismo Teléfono / Cuenta / Dirección"
          trendUp={false}
          icon={Share2}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          glowColor="shadow-amber-500/20"
        />
        <StatCard
          title="Nodos en Red Relacional"
          value={String(networkGraph.nodes.length)}
          trend="Clientes y Garantes Mapeados"
          trendUp={true}
          icon={Users}
          gradient="bg-gradient-to-br from-indigo-600 to-blue-700"
          glowColor="shadow-indigo-500/20"
        />
        <StatCard
          title="Vínculos Registrados"
          value={String(networkGraph.edges.length)}
          trend="Relaciones Familiares / Laborales"
          trendUp={true}
          icon={Network}
          gradient="bg-gradient-to-br from-purple-600 to-indigo-700"
          glowColor="shadow-purple-500/20"
        />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          <button 
            onClick={() => setActiveTab('cross')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cross' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Garantes Cruzados ({crossGuarantorAlerts.length})
          </button>
          <button 
            onClick={() => setActiveTab('duplicates')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'duplicates' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> Datos Duplicados & Identidad ({sharedDataAlerts.length})
          </button>
          <button 
            onClick={() => setActiveTab('network')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'network' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> Red Relacional Visual
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'manage' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" /> Administrar Vínculos ({clientRelationships.length})
          </button>
        </div>
      </div>

      {/* ─── TAB 1: GARANTES CRUZADOS ─── */}
      {activeTab === 'cross' && (
        <div className="space-y-4">
          {crossGuarantorAlerts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Excelente: No se detectan fianzas o garantes cruzados</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Todos los garantes registrados son independientes de los préstamos en los que figuran como deudores.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {crossGuarantorAlerts.map((alert, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-200 dark:border-rose-900/60 p-6 space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-2xl border border-rose-200">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 border border-rose-200">
                          {alert.alertType}
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                          Vínculo Cruzado: {alert.clientAName} ⇄ {alert.clientBName}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Exposición en Riesgo</span>
                      <span className="font-mono font-black text-sm text-rose-600">RD$ {alert.totalExposedBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/40">
                    {alert.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                      <span className="text-slate-400 font-bold block text-[10px]">Deudor A</span>
                      <p className="font-bold text-slate-900 dark:text-white">{alert.clientAName}</p>
                      {alert.loanAId && <p className="font-mono text-slate-500">Préstamo #{formatLoanId(alert.loanAId)}</p>}
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                      <span className="text-slate-400 font-bold block text-[10px]">Deudor B</span>
                      <p className="font-bold text-slate-900 dark:text-white">{alert.clientBName}</p>
                      {alert.loanBId && <p className="font-mono text-slate-500">Préstamo #{formatLoanId(alert.loanBId)}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: DATOS DUPLICADOS & IDENTIDAD COMPARTIDA ─── */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          {sharedDataAlerts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">No hay duplicados o identidades compartidas</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Los números de teléfono, direcciones y cuentas bancarias registradas pertenecen a clientes únicos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedDataAlerts.map((alert, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-2xl border border-amber-200">
                        {alert.matchType === 'Teléfono / WhatsApp' ? <Phone className="w-5 h-5" /> :
                         alert.matchType === 'Cuenta Bancaria' ? <Landmark className="w-5 h-5" /> :
                         alert.matchType === 'Dirección Física' ? <MapPin className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Coincidencia en {alert.matchType}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                          Valor Coincidente: <span className="font-mono text-indigo-600">{alert.sharedValue}</span>
                        </h4>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      alert.severity === 'Crítico' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      Riesgo {alert.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">{alert.description}</p>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs font-bold text-slate-400">Clientes Involucrados:</span>
                    {alert.involvedClients.map(c => (
                      <span key={c.id} className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: RED RELACIONAL VISUAL ─── */}
      {activeTab === 'network' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Mapa de Relaciones y Garantías</h3>
              <p className="text-xs text-slate-400">Matriz de conexiones entre clientes principales, garantes solidarios y vínculos manuales.</p>
            </div>
            <button
              onClick={() => setIsAddRelationshipModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Vínculo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {networkGraph.edges.map((edge, idx) => {
              const nodeFrom = networkGraph.nodes.find(n => n.id === edge.fromId);
              const nodeTo = networkGraph.nodes.find(n => n.id === edge.toId);
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
                      {edge.relationshipType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs font-bold pt-1">
                    <span className="text-slate-900 dark:text-white">{nodeFrom?.name || 'Cliente'}</span>
                    <ArrowRight className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-slate-900 dark:text-white text-right">{nodeTo?.name || 'Cliente'}</span>
                  </div>

                  {edge.notes && (
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                      {edge.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 4: ADMINISTRAR VÍNCULOS REGISTRADOS (EDITAR & ELIMINAR) ─── */}
      {activeTab === 'manage' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Vínculos Familiares y Comerciales Registrados</h3>
              <p className="text-xs text-slate-400">Todos los vínculos son totalmente editables y eliminables si necesita corregirlos.</p>
            </div>
            <button
              onClick={() => {
                setEditingRelationship(null);
                setClientIdA('');
                setClientIdB('');
                setRelNotes('');
                setIsAddRelationshipModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> + Registrar Nuevo Vínculo
            </button>
          </div>

          {clientRelationships.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No hay vínculos manuales registrados.</p>
              <p className="text-[11px] text-slate-400">Use el botón superior para vincular familiares, cónyuges o socios comerciales entre clientes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Cliente A</th>
                    <th className="py-3 px-4">Tipo de Vínculo</th>
                    <th className="py-3 px-4">Cliente B</th>
                    <th className="py-3 px-4">Notas / Observaciones</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {clientRelationships.map((rel) => (
                    <tr key={rel.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{rel.clientNameA}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
                          {rel.relationshipType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{rel.clientNameB}</td>
                      <td className="py-3.5 px-4 text-slate-500">{rel.notes || '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingRelationship(rel);
                              setClientIdA(rel.clientIdA);
                              setClientIdB(rel.clientIdB);
                              setRelType(rel.relationshipType);
                              setRelNotes(rel.notes || '');
                              setIsAddRelationshipModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar vínculo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRelationshipToDelete(rel)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                            title="Eliminar vínculo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: AGREGAR / EDITAR VÍNCULO ─── */}
      {isAddRelationshipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" /> {editingRelationship ? 'Editar Vínculo' : 'Registrar Vínculo entre Clientes'}
              </h3>
              <button onClick={() => setIsAddRelationshipModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveRelationship} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Primer Cliente (Cliente A) *</label>
                <CustomSelect
                  value={clientIdA}
                  onChange={(val) => setClientIdA(val)}
                  options={[
                    { value: '', label: 'Seleccionar Cliente A' },
                    ...clients.map(c => ({ value: c.id, label: `${c.name} (${c.cedula || c.phone || 'Sin Cédula'})` }))
                  ]}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Relación *</label>
                <CustomSelect
                  value={relType}
                  onChange={(val) => setRelType(val as RelationshipType)}
                  options={[
                    { value: 'Familiar / Pariente', label: 'Familiar / Pariente' },
                    { value: 'Cónyuge / Pareja', label: 'Cónyuge / Pareja' },
                    { value: 'Socio Comercial', label: 'Socio Comercial' },
                    { value: 'Compañero de Trabajo', label: 'Compañero de Trabajo' },
                    { value: 'Garante', label: 'Garante Solidario' },
                    { value: 'Vecino', label: 'Vecino / Referencia de Zona' },
                    { value: 'Otro', label: 'Otro Tipo de Relación' },
                  ]}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Segundo Cliente (Cliente B) *</label>
                <CustomSelect
                  value={clientIdB}
                  onChange={(val) => setClientIdB(val)}
                  options={[
                    { value: '', label: 'Seleccionar Cliente B' },
                    ...clients.filter(c => c.id !== clientIdA).map(c => ({ value: c.id, label: `${c.name} (${c.cedula || c.phone || 'Sin Cédula'})` }))
                  ]}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Notas u Observaciones (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Hermanos con negocio conjunto / Viven en la misma casa..."
                  value={relNotes}
                  onChange={(e) => setRelNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRelationshipModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  {editingRelationship ? 'Guardar Cambios' : 'Guardar Vínculo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRMAR ELIMINACIÓN DE VÍNCULO ─── */}
      {relationshipToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">¿Eliminar este vínculo?</h3>
              <p className="text-xs text-slate-500">
                Se eliminará la relación entre <b>{relationshipToDelete.clientNameA}</b> y <b>{relationshipToDelete.clientNameB}</b>. Podrá crearla de nuevo cuando lo desee.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setRelationshipToDelete(null)}
                className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FraudRadarPage;
