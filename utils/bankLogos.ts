export interface DominicanBankInfo {
  name: string;
  logo: string;
  shortName: string;
}

export const DOMINICAN_BANKS: DominicanBankInfo[] = [
  { name: 'Banco de Reservas (Banreservas)', logo: '/banks/Bancos_Banreservas.jpg', shortName: 'Banreservas' },
  { name: 'Banco Popular Dominicano', logo: '/banks/Bancos_BancoPopular.jpg', shortName: 'Banco Popular' },
  { name: 'Banco BHD', logo: '/banks/Bancos_BancoBHD.jpg', shortName: 'Banco BHD' },
  { name: 'Asociación Popular de Ahorros y Préstamos (APAP)', logo: '/banks/Bancos_AsociaciónPopular.jpg', shortName: 'APAP' },
  { name: 'Asociación Cibao de Ahorros y Préstamos', logo: '/banks/Bancos_AsociaciónCibao.jpg', shortName: 'Asociación Cibao' },
  { name: 'Asociación La Nacional', logo: '/banks/Bancos_LaNacional.jpg', shortName: 'La Nacional' },
  { name: 'Qik Banco Digital', logo: '/banks/Bancos_BancoQik.jpg', shortName: 'Qik' },
  { name: 'Banco Ademi', logo: '/banks/Bancos_BancoAdemi.jpg', shortName: 'Banco Ademi' },
  { name: 'Banfondesa', logo: '/banks/Bancos_Banfondesa.jpg', shortName: 'Banfondesa' },
  { name: 'Banco Vimenca', logo: '/banks/Bancos_BancoVimenca.jpg', shortName: 'Banco Vimenca' },
  { name: 'Banco Promerica', logo: '/banks/Bancos_BancoProamerica.jpg', shortName: 'Banco Promerica' },
  { name: 'Banesco', logo: '/banks/Bancos_Banesco.jpg', shortName: 'Banesco' },
  { name: 'Scotiabank República Dominicana', logo: '/banks/Bancos_Scotiabank.jpg', shortName: 'Scotiabank' },
  { name: 'Banco BDI', logo: '/banks/Bancos_BancoBDI.jpg', shortName: 'Banco BDI' },
  { name: 'Banco Adopen', logo: '/banks/Bancos_BancoAdopen.jpg', shortName: 'Banco Adopen' },
  { name: 'Banco Atlántico', logo: '/banks/Bancos_BancoAtlantico.jpg', shortName: 'Banco Atlántico' },
  { name: 'Banco Fihogar', logo: '/banks/Bancos_Fihogar.jpg', shortName: 'Banco Fihogar' },
  { name: 'Banco Lope de Haro', logo: '/banks/Bancos_BancoLopedeHaro.jpg', shortName: 'Banco Lope de Haro' },
  { name: 'Billet', logo: '/banks/Bancos_Billet.jpg', shortName: 'Billet' },
  { name: 'PayPal', logo: '/banks/Bancos_Paypal.jpg', shortName: 'PayPal' },
  { name: 'Zelle', logo: '/banks/Bancos_Zelle.jpg', shortName: 'Zelle' },
];

export const getBankLogoUrl = (bankName: string | undefined | null): string => {
  if (!bankName) return '/banks/Bancos_Banreservas.jpg';
  const n = String(bankName).toLowerCase();
  
  if (n.includes('banreservas') || n.includes('reservas')) return '/banks/Bancos_Banreservas.jpg';
  if (n.includes('bhd')) return '/banks/Bancos_BancoBHD.jpg';
  if (n.includes('popular') && !n.includes('asociación') && !n.includes('apap')) return '/banks/Bancos_BancoPopular.jpg';
  if (n.includes('apap') || (n.includes('asociación') && n.includes('popular'))) return '/banks/Bancos_AsociaciónPopular.jpg';
  if (n.includes('cibao')) return '/banks/Bancos_AsociaciónCibao.jpg';
  if (n.includes('nacional')) return '/banks/Bancos_LaNacional.jpg';
  if (n.includes('qik')) return '/banks/Bancos_BancoQik.jpg';
  if (n.includes('ademi')) return '/banks/Bancos_BancoAdemi.jpg';
  if (n.includes('fondesa') || n.includes('banfondesa')) return '/banks/Bancos_Banfondesa.jpg';
  if (n.includes('vimenca')) return '/banks/Bancos_BancoVimenca.jpg';
  if (n.includes('proamerica') || n.includes('promerica')) return '/banks/Bancos_BancoProamerica.jpg';
  if (n.includes('banesco')) return '/banks/Bancos_Banesco.jpg';
  if (n.includes('scotia')) return '/banks/Bancos_Scotiabank.jpg';
  if (n.includes('bdi')) return '/banks/Bancos_BancoBDI.jpg';
  if (n.includes('adopen')) return '/banks/Bancos_BancoAdopen.jpg';
  if (n.includes('atlántico') || n.includes('atlantico')) return '/banks/Bancos_BancoAtlantico.jpg';
  if (n.includes('fihogar')) return '/banks/Bancos_Fihogar.jpg';
  if (n.includes('lope')) return '/banks/Bancos_BancoLopedeHaro.jpg';
  if (n.includes('billet')) return '/banks/Bancos_Billet.jpg';
  if (n.includes('paypal')) return '/banks/Bancos_Paypal.jpg';
  if (n.includes('zelle')) return '/banks/Bancos_Zelle.jpg';
  
  return '/banks/Bancos_Banreservas.jpg';
};
