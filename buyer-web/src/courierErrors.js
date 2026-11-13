import {phoneDigits} from './phone.js';
export function courierPhoneError(value){
 const digits=phoneDigits(value);
 if(!digits || /^0\d{10}$/.test(digits))return '';
 return /^\d+$/.test(digits)&&digits.length!==11?`That's ${digits.length} digits. Enter all 11, starting with 0, e.g. 0803 123 4567.`:'Enter all 11 digits, starting with 0, e.g. 0803 123 4567.';
}
export function courierAddressError(message,area){
 if(!/address|street|location/i.test(message || '') || /phone|name|right now|price|pickup/i.test(message || ''))return '';
 return `The courier couldn't find this address${area?` in ${area}`:''}. Check the street name, or add your estate or a landmark.`;
}
