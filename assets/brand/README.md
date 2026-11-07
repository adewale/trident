# Trident logo

The mark combines three arrow-tipped spears with a detached horizontal survey
datum. The wordmark uses **Inter Black**, the actual static weight-900 font.

- `trident.svg`: full lockup, transparent background; lettering is vector outlines.
- `trident.png`: 1000 × 1000 lockup on warm paper.
- `trident-mark.svg`: standalone mark, transparent background.
- `trident-mark.png`: 512 × 512 standalone mark, transparent background.

The colours are green `#205653`, ink `#161919`, and paper `#F7F5EF`.

## Regenerate

From the repository root, after `bun install --frozen-lockfile`:

```sh
bun run brand:generate
```

[`scripts/generate-brand.ts`](../../scripts/generate-brand.ts) owns the geometry,
spacing and colours. It uses the existing pinned `@resvg/resvg-js` dependency to
outline the bundled font and render the PNGs. Generation works offline and never
loads system fonts. SVG consumers do not need Inter installed.

## Font source and licence

`fonts/Inter-Black.ttf` is the full static Inter Black font, losslessly
decompressed from the [official Inter WOFF2](https://github.com/rsms/inter/blob/353b61b9f4430d5f420d56605a6e7993e0941470/docs/font-files/Inter-Black.woff2)
at commit `353b61b9f4430d5f420d56605a6e7993e0941470` using FontTools
(`TTFont(source); font.flavor = None; font.save(destination)`). Glyphs, metrics,
names and weight are unchanged. The upstream WOFF2 SHA-256 is
`12ed0eed6749099b46c7b2e8198dc30c2d7e0f2a4e5fb1d12f0b6ae2c4f33cc4`.

Inter is copyright © 2016 The Inter Project Authors and distributed under the
[SIL Open Font License 1.1](fonts/OFL.txt). The font is used only by the generator;
it is not a runtime dependency of Trident's benchmarks.
