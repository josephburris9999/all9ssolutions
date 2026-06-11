# Bot protection (consultation form)

The consultation form uses layered defenses:

| Layer | What it does |
|--------|----------------|
| **Honeypot** | Hidden `website` field; bots that fill it are rejected |
| **Timing** | Submissions faster than 3 seconds or older than 24 hours are rejected |
| **User-Agent** | Empty user agent is rejected |
| **Rate limit** | 5 requests / 15 min per IP, 20 / day per IP (API route) |
| **Turnstile** | Off by default (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` must stay unset) |
| **API secret** | PHP mail handler rejects direct posts without `X-Consultation-Secret` when set |

Submissions go to **`POST /api/consultation`** by default (not directly to PHP).

## Setup

### 1. Use the API route (default)

No extra config required. Submissions are saved to PostgreSQL via Prisma.

### 2. Confirmation email to the client

Every submission is saved to `ConsultationRequest` (clients may submit multiple requests). The API sends an acknowledgment to the address they entered. Configure [Resend](https://resend.com) in `.env`:

```env
RESEND_API_KEY="re_..."
CONSULTATION_CONFIRMATION_FROM="all9s Solutions <hello@all9ssolutions.com>"
CONSULTATION_REPLY_TO="hello@all9ssolutions.com"
```

`CONSULTATION_CONFIRMATION_FROM` must use a domain verified in Resend. The email states that all9s Solutions will contact them within one business day. Submitters are **not** redirected to the Client Portal sign-in page.

### 3. Resend webhooks (delivery and bounce tracking)

Register a webhook in the [Resend dashboard](https://resend.com/webhooks) pointing at:

```
https://your-domain.com/api/webhooks/resend
```

Subscribe to **`email.bounced`** and **`email.delivered`**. Copy the signing secret into `.env` (and production hosting env vars):

```env
RESEND_WEBHOOK_SECRET="whsec_..."
```

Without this secret, the endpoint returns HTTP 500 and Resend will eventually disable the webhook after repeated failures. When a consultation confirmation bounces, the admin portal shows an **Email bounced** badge on that request.

For local testing, use a tunnel (e.g. ngrok) to expose `http://localhost:9002/api/webhooks/resend`.

### 4. Email via PHP (optional, internal notification)

Set in `.env`:

```env
CONSULTATION_MAIL_FORWARD_URL="https://your-domain.com/php/send-consultation.php"
CONSULTATION_API_SECRET="your-long-random-secret"
```

The API adds header `X-Consultation-Secret` when forwarding. Set the same value in PHP (`CONSULTATION_API_SECRET`). Direct browser POSTs to PHP are then blocked.

### Turnstile

**Disabled for this project.** Do not set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` or `TURNSTILE_SECRET_KEY` in `.env` or hosting env vars. The form will not load Cloudflare scripts or require a CAPTCHA token.

## Production notes

- In-memory rate limits apply per Node process; use **Cloudflare**, **nginx limit_req**, or **Redis** at scale.
- Keep `CONSULTATION_API_SECRET` long and private.
- Monitor `ConsultationRequest` table for abuse patterns.
