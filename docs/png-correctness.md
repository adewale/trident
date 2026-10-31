# PNG correctness and retained image evidence

A decoded PNG, a nonblank canvas, or a correct SVG supplies no PNG meaning pass.
`assessDocsPng` requires an actual image review bound to its literal source and
complete declared expected facts. The review author remains the authority for
those facts; hashes establish identity, not the truth of the review.

## Exact reviewed pixels

`bindPngReviewPixels` imports an existing review using the actual PNG whose raw
SHA256 the reviewer approved. It records canonical row-major RGBA16 samples,
width, height, and display-affecting metadata. `assessDocsPng` can then replay that
review across different compression, IDAT chunking, scanline filters, palette or
bit-depth encodings that represent the same exact samples. Standard text/time
annotations do not alter this identity.

Changes to any pixel, alpha, dimensions, color profile, orientation metadata or
unrecognized ancillary extension do not receive a pass from the old baseline.
The decoder preserves 16-bit low bits and Adam7 placement; a color histogram,
thumbnail or perceptual tolerance is not a substitute. Animated PNG remains
unknown without a separate frame observer. Existing decode and allocation budgets
continue to limit inspection. An explicitly empty drawing can have a blank PNG;
nonblank requirements follow declared visible source facts, not the format name.

No Codex/API call occurs during replay. Changed images still need a qualified
content checker or a new independent source-grounded review. These changes do not
implement a general native-PNG semantic oracle, OCR validation or aesthetic score.

## SVG-to-PNG preservation

The browser exporter returns both the original public SVG and the exact SVG
serialized for rasterization. The collector must retain both independently of
whether later observation succeeds. A different SVG from the SVG benchmark lane
cannot stand in for the PNG call's actual source.

`assessSvgPngConversion` requires all of the following:

1. A complete independent source review, with no unresolved facts.
2. Every planned SVG criterion, using the shared runtime-validated evidence
   contract, bound to the exact rasterized SVG hash.
3. An independent raster generated with the recorded resvg binary/dependencies,
   explicit background, intrinsic size, frozen font bytes and no system fonts.
   Unresolved image resources block this path.
4. A passing independent content review of that reference raster against the
   source facts. This prevents two rasters that omit the same unsupported SVG
   feature from certifying one another.
5. Exact decoded-pixel and display-metadata equality with the actual output PNG.

The returned certificate includes original/rasterized SVG hashes, actual and
reference PNG hashes, source/expectation hashes, the complete SVG verdict,
rasterizer identity and export profile. The returned reference PNG must be saved
alongside it. Pixel inequality withholds this preservation certificate; it does
not automatically prove a semantic error, since different rasterizers may paint
valid SVG differently. Direct reviewed-PNG evidence remains independent.

## Required qualification still outstanding

Full-corpus PNG accuracy is blocked until the complete source obligations and
image evidence cover that corpus. The canonical decoder and preservation
constructor enforce evidence requirements; they do not create missing independent
content judgments. Native PNG-only implementations never require an SVG API to
supply their own independently checked image evidence.
