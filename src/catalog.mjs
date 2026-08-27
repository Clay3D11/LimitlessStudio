const products = [
  ['pricing-monthly-social-essentials','Social Essentials','Monthly content',69500,'subscription'],
  ['pricing-monthly-content-engine','Content Engine','Monthly content',149500,'subscription'],
  ['pricing-monthly-brand-authority','Brand Authority','Monthly content',295000,'subscription'],
  ['pricing-editing-single-social-edit','Single Social Edit','One-off editing',12500,'payment'],
  ['pricing-editing-5-social-edits','5 Social Edits','One-off editing',49500,'payment'],
  ['pricing-editing-long-form-edit','Long-Form Edit','One-off editing',39500,'payment'],
  ['pricing-editing-content-multiplier','Content Multiplier','One-off editing',75000,'payment'],
  ['pricing-campaigns-conversion-ad','Conversion Ad','Campaigns & production',55000,'payment'],
  ['pricing-campaigns-campaign-pack','Campaign Pack','Campaigns & production',165000,'payment'],
  ['pricing-campaigns-real-estate-essential','Real Estate Essential','Campaigns & production',49500,'payment'],
  ['pricing-campaigns-signature-property','Signature Property','Campaigns & production',125000,'payment'],
  ['pricing-campaigns-music-video-edit','Music Video Edit','Campaigns & production',85000,'payment'],
  ['pricing-campaigns-music-video-premiere','Music Video Premiere','Campaigns & production',250000,'payment'],
  ['pricing-camera-portrait-session','Portrait Session','Camera & studio',45000,'payment'],
  ['pricing-camera-brand-photo-set','Brand Photo Set','Camera & studio',75000,'payment'],
  ['pricing-camera-brand-shoot-day','Brand Shoot Day','Camera & studio',120000,'payment'],
  ['pricing-camera-event-highlight','Event Highlight','Camera & studio',135000,'payment'],
  ['pricing-agencies-agency-edit-partner','Agency Edit Partner','Agency partnerships',185000,'subscription'],
  ['pricing-agencies-limitless-department','Limitless Department','Agency partnerships',395000,'subscription'],
  ['pricing-artists-artist-edit','Artist Edit','Exclusively for artists',49900,'payment'],
  ['pricing-artists-artist-premiere','Artist Premiere','Exclusively for artists',250000,'payment'],
  ['pricing-realtors-listing-edit','Listing Edit','Exclusively for realtors',29900,'payment'],
  ['pricing-realtors-listing-complete','Listing Complete','Exclusively for realtors',50000,'payment']
].map(([id,name,category,unitAmount,mode]) => Object.freeze({id,name,category,unitAmount,mode,currency:'usd',active:true}));
export const catalog = Object.freeze(products);
export const catalogById = new Map(catalog.map((product) => [product.id, product]));
export function publicCatalog() { return catalog.map(({unitAmount,...product}) => ({...product,price:unitAmount/100})); }
export function resolveCart(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) throw Object.assign(new Error('Choose between 1 and 20 cart items.'),{statusCode:422});
  const resolved = items.map((item) => {
    const product = catalogById.get(String(item.id || '')); const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw Object.assign(new Error('The cart contains an invalid product or quantity.'),{statusCode:422});
    return {...product,quantity};
  });
  const modes = new Set(resolved.map((item) => item.mode));
  if (modes.size > 1) throw Object.assign(new Error('Monthly subscriptions and one-time services must be checked out separately.'),{statusCode:422});
  return {items:resolved,mode:resolved[0].mode};
}
