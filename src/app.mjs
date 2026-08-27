import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config } from './config.mjs';
import { publicCatalog,resolveCart } from './catalog.mjs';
import { pingDatabase } from './db.mjs';
import { attachStripeSession,createPendingOrder,orderStatus,processStripeEvent,saveInquiry } from './orders.mjs';
import { constructWebhookEvent,createCheckoutSession } from './stripe.mjs';
import { cleanText,requireValidCustomer } from './validation.mjs';

const apiLimiter=rateLimit({windowMs:15*60*1000,limit:100,standardHeaders:'draft-8',legacyHeaders:false});
const checkoutLimiter=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:'draft-8',legacyHeaders:false});
export function createApp() {
  const app=express(); app.disable('x-powered-by'); if(config.isProduction) app.set('trust proxy',1);
  app.use(helmet({contentSecurityPolicy:false,crossOriginResourcePolicy:{policy:'cross-origin'}}));
  app.post('/api/webhooks/stripe',express.raw({type:'application/json',limit:'1mb'}),async(request,response,next)=>{
    try { const event=constructWebhookEvent(request.body,request.headers['stripe-signature']);
      if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed'].includes(event.type)) await processStripeEvent(event);
      response.json({received:true});
    } catch(error) { error.statusCode=error.type==='StripeSignatureVerificationError'?400:error.statusCode; next(error); }
  });
  app.use('/api',apiLimiter,express.json({limit:'64kb'}));
  app.get('/api/health',async(_request,response)=>{ try { await pingDatabase(); response.json({ok:true,service:'limitless-visual',database:'connected'}); } catch { response.status(503).json({ok:false,service:'limitless-visual',database:'unavailable'}); } });
  app.get('/api/catalog',(_request,response)=>response.json({products:publicCatalog()}));
  app.post('/api/inquiries',checkoutLimiter,async(request,response,next)=>{ try { if(cleanText(request.body.website,200)) return response.status(201).json({ok:true}); const customer=requireValidCustomer(request.body); const id=await saveInquiry(customer,cleanText(request.body.selectedServices,3000),cleanText(request.headers['user-agent'],500)); response.status(201).json({ok:true,id}); } catch(error){next(error);} });
  app.post('/api/checkout/sessions',checkoutLimiter,async(request,response,next)=>{ try { if(cleanText(request.body.website,200)) return response.status(422).json({error:'Unable to start checkout.'}); const customer=requireValidCustomer(request.body); const {items,mode}=resolveCart(request.body.items); const order=await createPendingOrder(customer,items,mode); const session=await createCheckoutSession(order,customer,items,mode); await attachStripeSession(order.id,session.id); response.status(201).json({checkoutUrl:session.url,orderId:order.id}); } catch(error){next(error);} });
  app.get('/api/orders/status',async(request,response,next)=>{ try { const sessionId=cleanText(request.query.session_id,255); if(!/^cs_(test_|live_)/.test(sessionId)) return response.status(422).json({error:'Invalid checkout session.'}); const order=await orderStatus(sessionId); if(!order) return response.status(404).json({error:'Order not found.'}); response.json({order}); } catch(error){next(error);} });
  const privatePaths=['/src','/database','/test','/.github','/.git','/.env','/node_modules','/server.mjs','/package.json','/package-lock.json','/dockerfile','/docker-compose.yml','/.dockerignore','/.gitignore'];
  app.use((request,response,next)=>{
    const path=request.path.toLowerCase();
    if(privatePaths.some((privatePath)=>path===privatePath||path.startsWith(`${privatePath}/`))) return response.status(404).type('text').send('Not found');
    next();
  });
  app.use(express.static(config.projectRoot,{dotfiles:'deny',index:'index.html',extensions:['html'],setHeaders(response){response.setHeader('X-Content-Type-Options','nosniff');}}));
  app.use('/api',(_request,response)=>response.status(404).json({error:'API route not found.'}));
  app.use((error,_request,response,_next)=>{const status=Number(error.statusCode||error.status||500);if(status>=500)console.error(error);response.status(status).json({error:status>=500?'Unable to process the request.':error.message,...(error.fields?{fields:error.fields}:{})});});
  return app;
}
