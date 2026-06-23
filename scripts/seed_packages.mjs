// scripts/seed_packages.mjs
//
// Seed adminConfig/general with the store config + a default packages array.
// Prices default to 0 (not sellable) so we never ship accidental free licenses.
// Set real GHS prices with scripts/set_package_prices.sh or the Hub UI.
//
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
//   node scripts/seed_packages.mjs
//
// Requires a service-account key for the yemame-opos project (admin access).

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const PACKAGES = [
  { id: "act1", name: "Solo", activations: 1, priceMinor: 0, currency: "GHS", active: true, sortOrder: 1 },
  { id: "act2", name: "Duo", activations: 2, priceMinor: 0, currency: "GHS", active: true, sortOrder: 2 },
  { id: "act3", name: "Trio", activations: 3, priceMinor: 0, currency: "GHS", active: true, sortOrder: 3 },
  { id: "act4", name: "Squad", activations: 4, priceMinor: 0, currency: "GHS", active: true, sortOrder: 4 },
  { id: "act5", name: "Crew", activations: 5, priceMinor: 0, currency: "GHS", active: true, sortOrder: 5 },
];

await db.doc("adminConfig/general").set(
  {
    currency: "GHS",
    supportWhatsapp: "+233559760063",
    packages: PACKAGES,
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true },
);
console.log("seeded adminConfig/general (config + packages, prices default 0)");
console.log("Set real prices via scripts/set_package_prices.sh --apply or the Hub UI.");
process.exit(0);
