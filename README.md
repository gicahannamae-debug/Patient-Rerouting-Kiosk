This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Patient kiosk and clinic dashboard

- Patient-facing intake: `/kiosk`
- Staff clinic dashboard: `/dashboard`

The kiosk creates queue tickets in the `(default)` Standard Firestore database.
The dashboard listens to the signed-in staff member's assigned clinic with a
Firestore real-time query.

### Firebase setup

The web SDK uses this project's public Firebase web-app configuration in
`lib/firebase.ts`. Firebase web API keys identify the project; they are not
service-account credentials. Do not put service-account keys in the browser.

1. Enable **Email/Password** in Firebase Authentication and create an account
   for each staff member.
2. In Firestore, create `staff/{auth-uid}` for each account, using the Firebase
   Authentication UID as the document ID. The document must contain only:
   `{ "active": true, "clinic": "SUR" }`. Use one of `SUR`, `PED`, `OBG`, `IM`,
   or `ER` for `clinic`.
3. Review the prototype access controls in `firestore.rules`, then deploy the
   rules and indexes with `firebase deploy --only firestore --project
   opd-self-intake-kiosk`.
4. Restrict kiosk writes with Firebase App Check before public production use.
   The kiosk intentionally permits unauthenticated ticket creation; Firestore
   rules validate the payload and prohibit unauthenticated reads, but rules
   alone cannot prevent abusive ticket creation.

Patient records contain identifying and health information. Dashboard reads
and queue updates are limited by Firestore rules to active staff assigned to
the record's clinic. Never weaken those rules to public reads.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
