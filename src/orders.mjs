import { randomUUID } from 'node:crypto';
import { database, transaction } from './db.mjs';

export async function createPendingOrder(customer,items,mode) {
  const id=randomUUID(); const total=items.reduce((sum,item)=>sum+item.unitAmount*item.quantity,0);
  await transaction(async(connection)=>{
    await connection.execute(`INSERT INTO customers (email,first_name,last_name,phone) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE first_name=VALUES(first_name),last_name=VALUES(last_name),phone=VALUES(phone)`,[customer.email,customer.firstName,customer.lastName,customer.phone||null]);
    const [[record]]=await connection.execute('SELECT id FROM customers WHERE email=?',[customer.email]);
    await connection.execute(`INSERT INTO orders (id,customer_id,status,checkout_mode,currency,total_amount,project_type,timeline,details) VALUES (?,?,'pending',?,'usd',?,?,?,?)`,[id,record.id,mode,total,customer.projectType,customer.timeline,customer.details]);
    for(const item of items) await connection.execute(`INSERT INTO order_items (order_id,product_id,product_name,quantity,unit_amount) VALUES (?,?,?,?,?)`,[id,item.id,item.name,item.quantity,item.unitAmount]);
  });
  return {id,total};
}
export async function attachStripeSession(orderId,sessionId) { await database().execute('UPDATE orders SET stripe_checkout_session_id=? WHERE id=?',[sessionId,orderId]); }
export async function markOrderPaid(session) {
  const orderId=session.metadata?.order_id; if(!orderId) return;
  await database().execute(`UPDATE orders SET status='paid',stripe_payment_intent_id=?,stripe_customer_id=?,paid_at=COALESCE(paid_at,CURRENT_TIMESTAMP) WHERE id=? AND status<>'paid'`,[typeof session.payment_intent==='string'?session.payment_intent:null,typeof session.customer==='string'?session.customer:null,orderId]);
}
export async function markOrderFailed(session) { const id=session.metadata?.order_id; if(id) await database().execute("UPDATE orders SET status='payment_failed' WHERE id=? AND status='pending'",[id]); }
export async function processStripeEvent(event) {
  return transaction(async(connection)=>{
    const [claim]=await connection.execute('INSERT IGNORE INTO stripe_events (event_id,event_type) VALUES (?,?)',[event.id,event.type]);
    if(claim.affectedRows===0) return false;
    const session=event.data.object; const orderId=session.metadata?.order_id;
    if(!orderId) return true;
    if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded') {
      await connection.execute(`UPDATE orders SET status='paid',stripe_payment_intent_id=?,stripe_customer_id=?,paid_at=COALESCE(paid_at,CURRENT_TIMESTAMP) WHERE id=? AND status<>'paid'`,[typeof session.payment_intent==='string'?session.payment_intent:null,typeof session.customer==='string'?session.customer:null,orderId]);
    }
    if(event.type==='checkout.session.async_payment_failed') await connection.execute("UPDATE orders SET status='payment_failed' WHERE id=? AND status='pending'",[orderId]);
    return true;
  });
}
export async function saveInquiry(customer,selectedServices,userAgent) {
  const id=randomUUID(); await database().execute(`INSERT INTO inquiries (id,first_name,last_name,email,phone,project_type,timeline,details,selected_services,user_agent) VALUES (?,?,?,?,?,?,?,?,?,?)`,[id,customer.firstName,customer.lastName,customer.email,customer.phone||null,customer.projectType,customer.timeline,customer.details,selectedServices||'',userAgent||'']); return id;
}
export async function orderStatus(sessionId) { const [[order]]=await database().execute(`SELECT id,status,currency,total_amount AS totalAmount,checkout_mode AS checkoutMode,created_at AS createdAt FROM orders WHERE stripe_checkout_session_id=?`,[sessionId]); return order||null; }
