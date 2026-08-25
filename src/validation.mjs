const projectTypes=new Set(['Brand or commercial','Music or artist visual','Real estate','Social content','Photography','Agency partnership','Other']);
const timelines=new Set(['As soon as possible','Within 30 days','1–3 months','Planning ahead']);
export function cleanText(value,maximumLength) { return typeof value==='string'?value.trim().replace(/\0/g,'').slice(0,maximumLength):''; }
export function validateCustomer(body={}) {
  const customer={firstName:cleanText(body.firstName,80),lastName:cleanText(body.lastName,80),email:cleanText(body.email,254).toLowerCase(),phone:cleanText(body.phone,40),projectType:cleanText(body.projectType,80),timeline:cleanText(body.timeline,80),details:cleanText(body.details,5000),consent:body.consent===true||body.consent==='on'};
  const errors={};
  if(!customer.firstName) errors.firstName='First name is required.'; if(!customer.lastName) errors.lastName='Last name is required.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errors.email='Enter a valid email address.';
  if(!projectTypes.has(customer.projectType)) errors.projectType='Choose a valid project type.'; if(!timelines.has(customer.timeline)) errors.timeline='Choose a valid timeline.';
  if(customer.details.length<10) errors.details='Please provide at least 10 characters about the project.'; if(!customer.consent) errors.consent='Consent is required.';
  return {customer,errors};
}
export function requireValidCustomer(body) { const result=validateCustomer(body); if(Object.keys(result.errors).length) throw Object.assign(new Error('Please correct the highlighted fields.'),{statusCode:422,fields:result.errors}); return result.customer; }
