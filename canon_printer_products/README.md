# Canon Printer products — full-stack storefront starter

Responsive printer store with product catalog/search/filtering, product details, cart, registration/login, order history, admin inventory tools, and Razorpay Checkout integration with server-side payment signature verification.

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Set a long random `JWT_SECRET`.
4. Before first startup, set a unique `ADMIN_EMAIL` and strong `ADMIN_PASSWORD` (not the example defaults).
5. Run `npm install`, then `npm start`.
6. Open http://localhost:3000.

## Razorpay live payments
A verified merchant account is required. Add your own credentials to `.env`:
```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_test_secret
PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```
Start with test keys; switch to live keys only after testing and merchant approval. Never expose the secret key in browser code or chat. Real payments are not enabled until valid keys are configured.

## Before production
- Prices/stock are sample data; verify current prices, taxes, warranty, shipping, returns and availability.
- Product image links are examples and may need replacement. Use photos you own or are licensed to use. Canon's photo library has terms of use.
- This is an independent storefront concept, not the official Canon website.
- Add HTTPS, a strict Content Security Policy, email verification, password reset, payment webhooks/reconciliation, refunds, tax invoices, shipping integration, audit logs and privacy/terms pages before commercial launch.
- SQLite is for a small prototype; use a managed database for a larger store. Payment status should be reconciled with server-to-server webhooks before production.
- This site does not collect card numbers or UPI credentials; Razorpay Checkout handles payment entry.

Model/pricing references for verification: https://in.canon/en/consumer/pixma-g3770/black/product and https://shop.in.canon/pixma-g3770-black.html
