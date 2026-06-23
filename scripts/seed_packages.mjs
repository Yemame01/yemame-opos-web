// scripts/seed_packages.mjs
//
// Seed the OPOS store's packages collection with DEFAULT placeholders.
// Prices default to 0 (not sellable until you set real prices) so we never ship
// accidental free licenses. Set real GHS prices later (priceMinor = pesewas).
//
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
//   node scripts/seed_packages.mjs
//
// Requires a service-account key for the yemame-opos project (admin access).

import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({
  credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? applicationDefault()
    : applicationDefault(),
});

const db = getFirestore();

const PACKAGES = [
  { id: "act1", name: "Single", activations: 1, sortOrder: 1 },
  { id: "act3", name: "Triple", activations: 3, sortOrder: 2 },
  { id: "act5", name: "Five", activations: 5, sortOrder: 3 },
  { id: "act10", name: "Ten", activations: 10, sortOrder: 4 },
];

for (const p of PACKAGES) {
  await db.collection("packages").doc(p.id).set(
    {
      name: p.name,
      activations: p.activations,
      priceMinor: 0, // DEFAULT — set a real price before selling
      currency: "GHS",
      active: true,
      sortOrder: p.sortOrder,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`seeded package ${p.id} (${p.activations} activations)`);
}

// Non-secret store config.
await db.collection("config").doc("general").set(
  {
    currency: "GHS",
    supportWhatsapp: "+233559760063",
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true },
);
console.log("seeded config/general");
console.log("Done.");
process.exit(0);
