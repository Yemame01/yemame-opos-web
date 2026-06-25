# OPOS Storage bucket CORS

The public download page (`/download`, via `src/lib/useReleases.ts`) and the
desktop in-app updater fetch `releases/opos/history.json` + `latest.json`
**from the browser**. Those files are public-read (see `storage.rules`
`match /releases/{allPaths=**}`), but a **browser** fetch also needs the bucket
to return CORS headers — otherwise the page shows "Couldn't load releases."
(`curl` works without CORS, which is why this can look fine from the terminal
but fail in the browser.)

The bucket `gs://yemame-opos.firebasestorage.app` therefore has a CORS policy
allowing GET/HEAD from the Yemame domains. The policy lives in
[`storage.cors.json`](../storage.cors.json).

## Apply / update

```bash
gsutil cors set storage.cors.json gs://yemame-opos.firebasestorage.app
# verify
gsutil cors get gs://yemame-opos.firebasestorage.app
```

This is a **bucket-level setting** (not part of `firebase deploy`), so it must
be applied with `gsutil` whenever the allowed origins change. Re-run the command
above after editing `storage.cors.json`.
