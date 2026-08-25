import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog,resolveCart } from '../src/catalog.mjs';

test('catalog IDs and products are unique and priced in cents',()=>{
  assert.equal(new Set(catalog.map(({id})=>id)).size,catalog.length);
  for(const product of catalog) { assert.ok(Number.isInteger(product.unitAmount)); assert.ok(product.unitAmount>0); }
});
test('server resolves price from trusted catalog',()=>{
  const result=resolveCart([{id:'pricing-editing-single-social-edit',quantity:2,unitAmount:1}]);
  assert.equal(result.items[0].unitAmount,12500); assert.equal(result.items[0].quantity,2); assert.equal(result.mode,'payment');
});
test('mixed subscription and payment carts are rejected',()=>{
  assert.throws(()=>resolveCart([{id:'pricing-monthly-social-essentials',quantity:1},{id:'pricing-editing-single-social-edit',quantity:1}]),/separately/);
});
