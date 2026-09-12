export function isStripeError(error) {
  return typeof error?.type === 'string' && error.type.startsWith('Stripe');
}

export function publicErrorMessage(error,status,requestPath='') {
  if (status >= 500) return 'Unable to process the request.';
  if (!isStripeError(error)) return error.message;
  if (requestPath === '/api/webhooks/stripe') return 'Invalid webhook request.';
  return 'Unable to start secure payment. Please try again.';
}
