
export const maskCedula = (value: string) => {
  const v = value.replace(/\D/g, '').substring(0, 11);
  const parts = [];
  if (v.length > 3) {
    parts.push(v.substring(0, 3));
    if (v.length > 10) {
      parts.push(v.substring(3, 10));
      parts.push(v.substring(10, 11));
    } else {
      parts.push(v.substring(3));
    }
  } else {
    parts.push(v);
  }
  return parts.join('-');
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
