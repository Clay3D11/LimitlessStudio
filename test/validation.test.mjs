import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCustomer } from '../src/validation.mjs';

const valid={firstName:'Ava',lastName:'Stone',email:'AVA@example.com',projectType:'Real estate',timeline:'Within 30 days',details:'A cinematic listing launch.',consent:'on'};
test('valid customer input is normalized',()=>{const {customer,errors}=validateCustomer(valid);assert.deepEqual(errors,{});assert.equal(customer.email,'ava@example.com');});
test('invalid customer input reports field errors',()=>{const {errors}=validateCustomer({});assert.ok(errors.email);assert.ok(errors.details);assert.ok(errors.consent);});
