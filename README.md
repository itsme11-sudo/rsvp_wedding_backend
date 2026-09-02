# Wedding RSVP API

A small Express API backed by MongoDB Atlas. MongoDB creates the `users` and
`reservations` collections automatically when the first records are written.

## API

| Method | Route | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/users/validate` | Public, rate-limited | Validate a code and return safe invitation details |
| `POST` | `/api/users` | Admin code | Create one invited guest without updating existing accounts |
| `POST` | `/api/reservations` | Invitation code | Submit the code owner's one-time RSVP |
| `POST` | `/api/reservations/reminders` | Admin code | Send one reminder to attending guests who have not received it |
| `GET` | `/api/reservations` | Admin code | Return RSVP totals and records |
| `GET` | `/api/reservations?format=csv` | Admin code | Download an Excel-compatible CSV |

The code for a reservation can be supplied in the JSON body as `code`. For the
admin GET route, supply it in the `x-invitation-code` header.

The reminder route accepts the admin `code` in its JSON body. It selects only
`isAttending: true` reservations whose reminder has not been sent, sends the
personalized burgundy email in Resend batches, and records `reminderSentAt` for
successful sends. Declined guests are never included.

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

To import or update only one code without applying the other entries in
`data/users.json`, use the targeted mode:

```sh
npm run seed:users -- --only Hanze
```

Only the matching account is upserted; all other MongoDB user records are left
unchanged.

The admin dashboard uses `POST /api/users` to create individual invitation
accounts. The admin code is supplied through `x-invitation-code`; the new
guest's code is supplied as `invitationCode` in the JSON body. The endpoint
hashes the new code and returns `409` rather than overwriting an existing user.

Invitation codes are normalized to uppercase and stored only as SHA-256 hashes.
Keep the original codes in your private guest list because they cannot be read
back from MongoDB.

Each invitation can submit only once. Code validation returns
`hasSubmittedRsvp`, and any repeated reservation request is rejected with HTTP
`409`. Guests must contact the bride or groom if a saved response needs to be
changed.

## Invitation roles

The `users` collection keeps two different role fields:

- `role` controls application access and remains either `admin` or `invited`.
- `invitationRole` personalizes the wedding invitation. Existing records with
  no value are treated as `guest` and receive the generic message.

Accepted `invitationRole` identifiers are:

```text
guest
principal-sponsor
secondary-sponsor
father-of-the-groom
mother-of-the-groom
best-man
groomsman
bridesmaid
coin-bearer
mother-of-the-bride
father-of-the-bride
matron-of-honor
maid-of-honor
bible-bearer
cord-sponsor
veil-sponsor
candle-sponsor
flower-girl
```

The seeder also accepts readable labels such as `Principal Sponsor`, `Cord`,
`Bride's maid`, and `Flower Girl`, then stores the canonical identifier.

When one invitation contains named entourage members—or one person has more
than one responsibility—use `invitationRoles`:

```json
{
  "invitationRoles": [
    {
      "name": "Juan Dela Cruz",
      "roles": ["cord-sponsor", "groomsman"]
    },
    {
      "name": "Maria Dela Cruz",
      "roles": ["cord-sponsor", "bridesmaid"]
    }
  ]
}
```

The singular `invitationRole` remains supported for existing records. New
family and entourage invitations should use the named array structure.

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

## Railway deployment

- Build command: `npm install`
- Start command: `npm start`
- Add all values from `.env.example` under the Railway service's Variables tab.
- Set `FRONTEND_ORIGIN` to the frontend's exact browser origin. Multiple origins
  are comma-separated, for example:

  ```env
  FRONTEND_ORIGIN=https://ianafk.com,https://www.ianafk.com
  ```

  Use only the origin: include `https://`, but do not include a path or trailing
  slash. Add each local development URL explicitly when it uses a different
  port.
- Add Railway's outbound IP to the Atlas Network Access list, or use Atlas's
  broader network rule if the Railway plan does not provide a static IP.

The frontend must set `VITE_API_URL` to the Railway API origin, without `/api`:

```env
VITE_API_URL=https://rsvpweddingbackend-rsvp-backend.up.railway.app
```
