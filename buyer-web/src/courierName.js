export const NAME_ERROR='Add your first and last name, using letters only.';
export const namePart=value=>/^\p{L}[\p{L}\p{M}]*(?: +\p{L}[\p{L}\p{M}]*)*$/u.test(String(value || '').trim());
export const hasCourierName=value=>Boolean(namePart(value?.firstName)&&namePart(value?.lastName));
export const nameForQuote=value=>hasCourierName(value)?`${value.firstName.trim()} ${value.lastName.trim()}`:'';
