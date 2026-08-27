import assert from 'node:assert/strict';
import test from 'node:test';
import { checkoutEventPaymentSucceeded } from '../src/orders.mjs';

function checkoutEvent(type, paymentStatus) {
  return {
    type,
    data: {
      object: {
        payment_status: paymentStatus
      }
    }
  };
}

test('paid completed Checkout sessions are successful', () => {
  assert.equal(
    checkoutEventPaymentSucceeded(
      checkoutEvent('checkout.session.completed', 'paid')
    ),
    true
  );
});

test('completed Checkout sessions requiring no payment are successful', () => {
  assert.equal(
    checkoutEventPaymentSucceeded(
      checkoutEvent('checkout.session.completed', 'no_payment_required')
    ),
    true
  );
});

test('unpaid completed Checkout sessions remain pending', () => {
  assert.equal(
    checkoutEventPaymentSucceeded(
      checkoutEvent('checkout.session.completed', 'unpaid')
    ),
    false
  );
});

test('asynchronous payment success is successful', () => {
  assert.equal(
    checkoutEventPaymentSucceeded(
      checkoutEvent('checkout.session.async_payment_succeeded', 'paid')
    ),
    true
  );
});

test('asynchronous payment failure is not successful', () => {
  assert.equal(
    checkoutEventPaymentSucceeded(
      checkoutEvent('checkout.session.async_payment_failed', 'unpaid')
    ),
    false
  );
});