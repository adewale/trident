# Complete ecosystem evidence archive

GitHub release-asset upload rejected this environment's credential with HTTP401.
These five parts contain the complete unchanged archive; the small reports and
reviewed images remain browsable on this evidence branch. No product release is
being shipped.

Download all `part-*` files, `parts.sha256` and the archive SHA256 file. In that directory:

```sh
sha256sum -c parts.sha256
cat trident-ecosystem-2026-10-31.tar.gz.part-* > trident-ecosystem-2026-10-31.tar.gz
sha256sum -c trident-ecosystem-2026-10-31.tar.gz.sha256
mkdir extracted
tar -xzf trident-ecosystem-2026-10-31.tar.gz -C extracted
```

The archive retains full source inventories, preparation bytes, original failed
and completed attempts, every SVG/PNG/text witness, image reviews and rechecks.
Original absolute paths inside receipts are provenance; the portable campaign
uses the copied directories. Correctness scope and lost-clock disclosures remain
attached. These single-pass results do not establish full accuracy or speed.
