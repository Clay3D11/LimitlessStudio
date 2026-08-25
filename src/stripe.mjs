import Stripe from 'stripe';
import { config,assertPaymentConfiguration } from './config.mjs';
let client;
export function stripeClient() { assertPaymentConfiguration(); if(!client) client=new Stripe(config.stripeSecretKey); return client; }
export async function createCheckoutSession(order,customer,items,mode) {
  return stripeClient().checkout.sessions.create({mode,customer_email:customer.email,client_reference_id:order.id,metadata:{order_id:order.id},
    line_items:items.map((item)=>({quantity:item.quantity,price_data:{currency:item.currency,unit_amount:item.unitAmount,product_data:{name:item.name,metadata:{product_id:item.id}},...(mode==='subscription'?{recurring:{interval:'month'}}:{})}})),
    success_url:`${config.publicUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${config.publicUrl}/?checkout=cancelled`,billing_address_collection:'auto',allow_promotion_codes:true,automatic_tax:{enabled:config.automaticTax}},
    {idempotencyKey:`checkout-${order.id}`});
}
export function constructWebhookEvent(rawBody,signature) { if(!config.stripeWebhookSecret) throw new Error('Stripe webhook signing secret is not configured.'); return stripeClient().webhooks.constructEvent(rawBody,signature,config.stripeWebhookSecret); }
