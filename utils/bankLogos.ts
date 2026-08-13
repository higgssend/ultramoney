export interface DominicanBankInfo {
  name: string;
  logo: string;
  shortName: string;
}

export const INSFORGE_STORAGE_BASE = 'https://sxwv82iw.us-east.insforge.app/storage/v1/object/public/bank-logos/logos';

export const DOMINICAN_BANKS: DominicanBankInfo[] = [
  { name: 'Banco de Reservas (Banreservas)', logo: `${INSFORGE_STORAGE_BASE}/Bancos_Banreservas.jpg`, shortName: 'Banreservas' },
  { name: 'Banco Popular Dominicano', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoPopular.jpg`, shortName: 'Banco Popular' },
  { name: 'Banco BHD', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoBHD.jpg`, shortName: 'Banco BHD' },
  { name: 'Asociación Popular de Ahorros y Préstamos (APAP)', logo: `${INSFORGE_STORAGE_BASE}/Bancos_AsociaciónPopular.jpg`, shortName: 'APAP' },
  { name: 'Asociación Cibao de Ahorros y Préstamos', logo: `${INSFORGE_STORAGE_BASE}/Bancos_AsociaciónCibao.jpg`, shortName: 'Asociación Cibao' },
  { name: 'Asociación La Nacional', logo: `${INSFORGE_STORAGE_BASE}/Bancos_LaNacional.jpg`, shortName: 'La Nacional' },
  { name: 'Qik Banco Digital', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoQik.jpg`, shortName: 'Qik' },
  { name: 'Banco Ademi', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoAdemi.jpg`, shortName: 'Banco Ademi' },
  { name: 'Banfondesa', logo: `${INSFORGE_STORAGE_BASE}/Bancos_Banfondesa.jpg`, shortName: 'Banfondesa' },
  { name: 'Banco Vimenca', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoVimenca.jpg`, shortName: 'Banco Vimenca' },
  { name: 'Banco Promerica', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoProamerica.jpg`, shortName: 'Banco Promerica' },
  { name: 'Banesco', logo: `${INSFORGE_STORAGE_BASE}/Bancos_Banesco.jpg`, shortName: 'Banesco' },
  { name: 'Scotiabank República Dominicana', logo: `${INSFORGE_STORAGE_BASE}/Bancos_Scotiabank.jpg`, shortName: 'Scotiabank' },
  { name: 'Banco BDI', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoBDI.jpg`, shortName: 'Banco BDI' },
  { name: 'Banco Adopen', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoAdopen.jpg`, shortName: 'Banco Adopen' },
  { name: 'Banco Atlántico', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoAtlantico.jpg`, shortName: 'Banco Atlántico' },
  { name: 'Banco Fihogar', logo: `${INSFORGE_STORAGE_BASE}/Bancos_Fihogar.jpg`, shortName: 'Banco Fihogar' },
  { name: 'Banco Lope de Haro', logo: `${INSFORGE_STORAGE_BASE}/Bancos_BancoLopedeHaro.jpg`, shortName: 'Banco Lope de Haro' },
  { name: 'Billet', logo: `${INSFORGE_STORAGE_BASE}/Bancos_Billet.jpg`, shortName: 'Billet' },
  { name: 'PayPal', logo: `${INSFORGE_STORAGE_BASE}/Bancos_Paypal.jpg`, shortName: 'PayPal' },
  { name: 'Zelle', logo: `${INSFORGE_STORAGE_BASE}/Bancos_Zelle.jpg`, shortName: 'Zelle' },
];

export const getBankLogoUrl = (bankName: string | undefined | null): string => {
  if (!bankName) return `${INSFORGE_STORAGE_BASE}/Bancos_Banreservas.jpg`;
  const n = String(bankName).toLowerCase();
  
  if (n.includes('banreservas') || n.includes('reservas')) return `${INSFORGE_STORAGE_BASE}/Bancos_Banreservas.jpg`;
  if (n.includes('bhd')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoBHD.jpg`;
  if (n.includes('popular') && !n.includes('asociación') && !n.includes('apap')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoPopular.jpg`;
  if (n.includes('apap') || (n.includes('asociación') && n.includes('popular'))) return `${INSFORGE_STORAGE_BASE}/Bancos_AsociaciónPopular.jpg`;
  if (n.includes('cibao')) return `${INSFORGE_STORAGE_BASE}/Bancos_AsociaciónCibao.jpg`;
  if (n.includes('nacional')) return `${INSFORGE_STORAGE_BASE}/Bancos_LaNacional.jpg`;
  if (n.includes('qik')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoQik.jpg`;
  if (n.includes('ademi')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoAdemi.jpg`;
  if (n.includes('fondesa') || n.includes('banfondesa')) return `${INSFORGE_STORAGE_BASE}/Bancos_Banfondesa.jpg`;
  if (n.includes('vimenca')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoVimenca.jpg`;
  if (n.includes('proamerica') || n.includes('promerica')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoProamerica.jpg`;
  if (n.includes('banesco')) return `${INSFORGE_STORAGE_BASE}/Bancos_Banesco.jpg`;
  if (n.includes('scotia')) return `${INSFORGE_STORAGE_BASE}/Bancos_Scotiabank.jpg`;
  if (n.includes('bdi')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoBDI.jpg`;
  if (n.includes('adopen')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoAdopen.jpg`;
  if (n.includes('atlántico') || n.includes('atlantico')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoAtlantico.jpg`;
  if (n.includes('fihogar')) return `${INSFORGE_STORAGE_BASE}/Bancos_Fihogar.jpg`;
  if (n.includes('lope')) return `${INSFORGE_STORAGE_BASE}/Bancos_BancoLopedeHaro.jpg`;
  if (n.includes('billet')) return `${INSFORGE_STORAGE_BASE}/Bancos_Billet.jpg`;
  if (n.includes('paypal')) return `${INSFORGE_STORAGE_BASE}/Bancos_Paypal.jpg`;
  if (n.includes('zelle')) return `${INSFORGE_STORAGE_BASE}/Bancos_Zelle.jpg`;
  
  return `${INSFORGE_STORAGE_BASE}/Bancos_Banreservas.jpg`;
};
