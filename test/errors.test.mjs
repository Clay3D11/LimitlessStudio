import test from 'node:test';
import assert from 'node:assert/strict';
import { publicErrorMessage } from '../src/errors.mjs';

test('Stripe API details are hidden from checkout customers',()=>{
  const error=Object.assign(new Error('Invalid API key provided: mk_123. See https://dashboard.stripe.com/apikeys'),{type:'StripeAuthenticationError',statusCode:401});
  assert.equal(publicErrorMessage(error,401,'/api/checkout/sessions'),'Unable to start secure payment. Please try again.');
});

test('validation messages remain actionable',()=>{
  assert.equal(publicErrorMessage(new Error('Please correct the highlighted fields.'),422,'/api/checkout/sessions'),'Please correct the highlighted fields.');
});

test('server failures use a generic response',()=>{
  assert.equal(publicErrorMessage(new Error('database connection details'),500,'/api/checkout/sessions'),'Unable to process the request.');
});
