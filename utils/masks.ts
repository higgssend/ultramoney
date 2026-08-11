
export const maskCedula = (value: string) => {
  if (!value) return '';
  const v = value.replace(/\D/g, '').substring(0, 11);
  if (v.length === 0) return '';
  if (v.length <= 3) return v;
  if (v.length <= 10) return `${v.substring(0, 3)}-${v.substring(3)}`;
  return `${v.substring(0, 3)}-${v.substring(3, 10)}-${v.substring(10, 11)}`;
};

export const maskPhone = (value: string) => {
  const v = value.replace(/\D/g, '').substring(0, 10);
  if (v.length === 0) return '';
  if (v.length <= 3) return `(${v}`;
  if (v.length <= 6) return `(${v.substring(0, 3)}) ${v.substring(3)}`;
  return `(${v.substring(0, 3)}) ${v.substring(3, 6)}-${v.substring(6)}`;
};

export const unmask = (value: string) => {
  return value.replace(/\D/g, '');
};
