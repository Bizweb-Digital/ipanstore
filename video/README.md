# IPAN STORE Live Overlay

## Output

- Type: horizontal OBS live overlay / looping text rail
- Canvas: 1920x1080
- Frame rate: 30 fps
- Duration: 16 seconds, designed to loop in OBS
- Background: solid `#00FF00` for chroma key
- Logo: official `D:\LOGO IPAN STORE\LOGO IPAN STORE.png`, rendered from the transparent `public/logo-transparent.png` asset
- Layout: compact full-width textured ribbon (200px tall), slanted logo cap on the left, message-only center
- Audio: none; the render is muted for OBS overlay use
- Legacy files: previous source and render are kept in `video/backup/`

The design follows the current IPAN STORE monochrome visual language: charcoal
texture, dark cap, restrained geometry, thin dividers, and no emoji or decorative
copy. The message treatment follows the Image 2/TikTok stream overlay pattern: a
wide textured ribbon, `Bowlby One SC` display font, white fill, dark outline, and
a short message swap inside the ribbon. The rail includes a
deterministic Remotion port of the website's SettinX `ElectricBorder` language:
irregular animated stroke, glow, and corner sparks. The logo has its own 4-second
slide/fade loop in the left cap, so it repeatedly appears like a live overlay
identity mark.

The previous left-to-right scan beam and bottom sweep shine were removed. Only
the electric edge and the requested logo/text motion remain.

## PANGGILAN-JIHAD-OVERLAY (three-zone layout)

The ribbon is split into three independent message zones, each swapping one
message at a time (4s per message, same enter pop and per-letter right-to-left
gravity exit). The composition runs 720 frames / 24s (LCM of 2- and 3-message
zones) so the loop repeats seamlessly:

- Left (3 messages): `LU WIN? GW RESET WS + GW FOLLBACK` / `BANTU POSTUL LIVE GW` / `TAP TAP SAMPE 10K`
- Center (2 messages): `CARA DI LAGAIN GIMANA? OPTES VS IPAN` + `LINK GB IPAN KE BIO` / `OPTES LAGA IPAN` + `11 10K GW NET` + `22 15K GW 2 KAYU` + `SKIP ANTRI 20K` + `11 HF 5K || 22 HF 8K`
- Right (2 messages): `JASA PEMBUATAN WEBSITE? KE BIO` / `CONTOH WEBSITE BISA CEK KE ipanstore.id`

Render with `npm run video:render-jihad`; output:
`video/out/panggilan-jihad-overlay-greenscreen.mp4`

It does not copy the placement or resolution of the example video. The local
reference was used only to confirm the intended overlay pattern. The TikTok
video was retrieved through its public playback metadata and inspected across
19.4 seconds at 30 fps; the implementation uses its scene-swap rhythm without
copying the excluded black text cards.

## Loop messages

Each message gets its own ribbon scene and enters with the same slide/pop as
before. On exit, the characters tumble down one by one from right to left
(per-letter stagger with gravity easing). The stagger is computed per message
so the very last (left-most) character finishes falling before the scene ends —
the text always empties completely first, then the next message enters.
All four repeat inside the 16-second composition:

1. `Mau Aim Kalian Stabil?`
2. `Mouse dan Analog suka stuck bareng emulator?`
3. `Langsung aja Order Ipan APP SettinX V1` plus `Dan dapatkan diskon dengan kode HEMAT5`
4. `Kunjungi Website ipanstore.id`

## Commands

```bash
npm run video:studio
npm run video:still
npm run video:render
npm run video:typecheck
```

The render command writes:

`video/out/ipanstore-live-overlay-greenscreen.mp4`

## OBS

Add the MP4 as a Media Source, enable `Loop`, then add a Chroma Key filter with
key color `#00FF00`. Keep the source at 1920x1080. The overlay is intentionally
full-width; the green area above and below the rail is removed by chroma key.

## Dependencies

- Node.js and npm
- `remotion` and `@remotion/cli`
- Chromium headless and FFmpeg managed by Remotion for local rendering
- No HeyGen account is needed because this is a code-generated motion overlay,
  not an avatar or voice video
