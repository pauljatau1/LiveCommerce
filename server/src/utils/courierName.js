const cleanName = value => String(value || '').normalize('NFC').replace(/[^\p{L}\p{M}\s]/gu,' ').replace(/\s+/g,' ').trim();
const fullName = value => {const name=cleanName(value).slice(0,100).trim();return name.split(' ').length>=2 ? name : null;};
const courierName = (address={},account={}) => fullName(address.name || address.recipientName || [address.firstName,address.lastName].filter(Boolean).join(' ')) || fullName([account.firstName,account.lastName].filter(Boolean).join(' '));
const courierProblem = error => /full.?name|\bname\b|numbers and symbols/i.test(error?.message || error) ? 'name' : /phone|mobile|contact.?number/i.test(error?.message || error) ? 'phone' : /address|location|coordinates|street/i.test(error?.message || error) ? 'address' : null;
const courierMessage = kind => ({name:'Add your full name for the courier',phone:'Check the phone number',address:"Shipbubble couldn't find that address"})[kind] || "Couldn't check delivery right now. Please try again.";
module.exports={cleanName,fullName,courierName,courierProblem,courierMessage};
