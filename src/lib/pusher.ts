import Pusher from 'pusher';

// This file configures and exports a single, reusable instance
// of the Pusher server SDK.

// It reads your secret keys from the .env.local file.
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
