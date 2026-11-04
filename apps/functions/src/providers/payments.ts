import Stripe from 'stripe';
import { config } from '../config.js';

let client: Stripe | null = null;
export const stripeConfigured = () => Boolean(config.stripeSecretKey);
export function stripe(): Stripe {
  if (!config.stripeSecretKey) throw new Error('Stripe is not configured');
  if (!client) client = new Stripe(config.stripeSecretKey);
  return client;
}
