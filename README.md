# Wedding RSVP API

A small Express API backed by MongoDB Atlas. MongoDB creates the `users` and
`reservations` collections automatically when the first records are written.

## API

| Method | Route | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/users/validate` | Public, rate-limited | Validate a code and return safe invitation details |
| `POST` | `/api/reservations` | Invitation code | Submit the code owner's one-time RSVP |
| `GET` | `/api/reservations` | Admin code | Return RSVP totals and records |
| `GET` | `/api/reservations?format=csv` | Admin code | Download an Excel-compatible CSV |

The code for a reservation can be supplied in the JSON body as `code`. For the
admin GET route, supply it in the `x-invitation-code` header.

After the RSVP is saved, Resend sends a confirmation to the guest's submitted
email address. If `RSVP_NOTIFICATION_EMAIL` is configured, a separate copy of
the response is also sent to the couple. `RSVP_REPLY_TO` is optional and should
be an inbox the couple checks for replies.

## Local setup

1. Copy `.env.example` to `.env` and fill in the values.
2. Run `npm install`.
3. Copy `data/users.example.json` to `data/users.json` and replace the samples.
4. Run `npm run seed:users`.
5. Run `npm run dev`.

Invitation codes are normalized to uppercase and stored only as SHA-256 hashes.
Keep the original codes in your private guest list because they cannot be read
back from MongoDB.

Each invitation can submit only once. Code validation returns
`hasSubmittedRsvp`, and any repeated reservation request is rejected with HTTP
`409`. Guests must contact the bride or groom if a saved response needs to be
changed.

## Example requests

Validate a code:

```sh
curl -X POST http://localhost:3000/api/users/validate \
  -H 'content-type: application/json' \
  -d '{"code":"DELA-CRUZ-2026"}'
```

Submit an RSVP:

```sh
curl -X POST http://localhost:3000/api/reservations \
  -H 'content-type: application/json' \
  -d '{
    "code":"DELA-CRUZ-2026",
    "name":"Juan Dela Cruz",
    "email":"juan@example.com",
    "isAttending":true,
    "companions":1,
    "companionNames":["Maria Dela Cruz"],
    "notes":"No allergies"
  }'
```

Download the admin CSV:

```sh
curl 'http://localhost:3000/api/reservations?format=csv' \
  -H 'x-invitation-code: ADMIN-DEMO-CODE' \
  -o wedding-rsvps.csv
```

## Render deployment

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Add all values from `.env.example` as Render environment variables.
- Add the Render service's outbound IP ranges to the Atlas Network Access list.
