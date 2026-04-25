# Quro

Crypto-native trading bot marketplace built with React, Supabase Auth, Supabase DB, Storage, and Supabase Edge Functions.

## Secure Marketplace Layer

The buyer flow is server-side now:

1. User adds bots to cart.
2. Frontend calls `create-payment`.
3. Edge Function validates bot IDs/prices from Supabase and creates the order, order items, and transaction.
4. Payment provider generates the crypto payment address.
5. Frontend calls `verify-payment` to let the Edge Function verify the provider/blockchain status.
6. On confirmation, the Edge Function marks the order paid and creates unique licenses.
7. Downloads go through `create-download-link`, which checks an active license before issuing a signed Storage URL.

## Supabase Objects

Core tables:

- `bots`
- `orders`
- `order_items`
- `transactions`
- `licenses`

Important views/functions:

- `my_purchases`
- `increment_bot_sales`

Edge Functions:

- `create-payment`
- `verify-payment`
- `create-download-link`
- `validate-license`

## Edge Function Secrets

Required by Supabase functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Payment provider:

- `PAYMENT_PROVIDER=nowpayments`
- `NOWPAYMENTS_API_KEY=...`

Local/demo payment generation works with `PAYMENT_PROVIDER=demo`, but demo confirmation only works if `ALLOW_DEMO_PAYMENT_CONFIRM=true`. Do not enable demo confirmation in production.

## Commands

```bash
npm install
npm run build
npm test
npm run lint
```
