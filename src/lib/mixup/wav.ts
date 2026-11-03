/** Encode mono PCM samples as a 16-bit WAV, tagged in its INFO chunk as AI-generated. */
export function encodeWav(samples: Float32Array, sampleRate: number, comment = 'AI-generated with Swaralaya Mix up'): Blob {
  const enc = new TextEncoder();
  const pad = (b: Uint8Array) => (b.length % 2 ? new Uint8Array([...b, 0]) : b);
  const sub = (id: string, text: string) => {
    const body = pad(enc.encode(text + '\0'));
    const out = new Uint8Array(8 + body.length);
    out.set(enc.encode(id), 0);
    new DataView(out.buffer).setUint32(4, enc.encode(text + '\0').length, true);
    out.set(body, 8);
    return out;
  };
  const icmt = sub('ICMT', comment);
  const isft = sub('ISFT', 'Swaralaya');
  const listLen = 4 + icmt.length + isft.length;
  const dataLen = samples.length * 2;
  const buf = new ArrayBuffer(44 + 8 + listLen + dataLen);
  const v = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let p = 0;
  const str = (s: string) => { u8.set(enc.encode(s), p); p += s.length; };
  const u32 = (n: number) => { v.setUint32(p, n, true); p += 4; };
  const u16 = (n: number) => { v.setUint16(p, n, true); p += 2; };
  str('RIFF'); u32(buf.byteLength - 8); str('WAVE');
  str('fmt '); u32(16); u16(1); u16(1); u32(sampleRate); u32(sampleRate * 2); u16(2); u16(16);
  str('LIST'); u32(listLen); str('INFO'); u8.set(icmt, p); p += icmt.length; u8.set(isft, p); p += isft.length;
  str('data'); u32(dataLen);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true); p += 2;
  }
  return new Blob([buf], { type: 'audio/wav' });
}
