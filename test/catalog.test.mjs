import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog,publicCatalog,resolveCart } from '../src/catalog.mjs';

test('catalog IDs and products are unique and priced in cents',()=>{
  assert.equal(new Set(catalog.map(({id})=>id)).size,catalog.length);
  for(const product of catalog) { assert.ok(Number.isInteger(product.unitAmount)); assert.ok(product.unitAmount>0); }
});
test('server resolves price from trusted catalog',()=>{
  const result=resolveCart([{id:'pricing-editing-single-social-edit',quantity:2,unitAmount:1}]);
  assert.equal(result.items[0].unitAmount,12500); assert.equal(result.items[0].quantity,2); assert.equal(result.mode,'payment');
});
test('monthly subscriptions are excluded from the public catalog',()=>{
  assert.equal(publicCatalog().some(({mode})=>mode==='subscription'),false);
});
test('monthly subscriptions are rejected by the server',()=>{
  assert.throws(()=>resolveCart([{id:'pricing-monthly-social-essentials',quantity:1}]),/unavailable/);
});
