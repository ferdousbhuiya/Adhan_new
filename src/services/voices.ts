import * as FileSystem from 'expo-file-system';

const SAMPLE_RATE = 22050;

function floatTo16BitPCM(float32Array: Float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function writeWavHeader(dataByteLength: number, sampleRate: number, numChannels = 1) {
  const blockAlign = numChannels * 2; // 16-bit
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  /* RIFF identifier */
  view.setUint32(0, 0x52494646, false);
  /* file length minus RIFF and length (8) */
  view.setUint32(4, 36 + dataByteLength, true);
  /* RIFF type */
  view.setUint32(8, 0x57415645, false);
  /* format chunk identifier */
  view.setUint32(12, 0x666d7420, false);
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, byteRate, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  view.setUint32(36, 0x64617461, false);
  /* data chunk length */
  view.setUint32(40, dataByteLength, true);

  return buffer;
}

function generateSine(durationSec: number, freq: number, sampleRate: number, amplitude = 0.9) {
  const length = Math.floor(durationSec * sampleRate);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    out[i] = amplitude * Math.sin(2 * Math.PI * freq * t);
  }
  return out;
}

function concatFloatArrays(arrs: Float32Array[]) {
  const total = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const a of arrs) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

export const AVAILABLE_SYNTHETIC_VOICES = [
  { id: 'default', name: 'Synthetic (default)' },
  { id: 'deep', name: 'Synthetic (deep)' },
  { id: 'bright', name: 'Synthetic (bright)' },
];

function buildPartsForVariant(variant: string) {
  const parts: Float32Array[] = [];

  function pause(sec: number) {
    parts.push(new Float32Array(Math.floor(sec * SAMPLE_RATE)));
  }

  let pattern: number[] = [440, 660, 550, 440];
  let verses = 6;
  let amp = 0.55;
  let finalFreq = 330;

  switch (variant) {
    case 'deep':
      pattern = [220, 330, 270, 220];
      verses = 5;
      amp = 0.6;
      finalFreq = 220;
      break;
    case 'bright':
      pattern = [550, 770, 660, 550];
      verses = 7;
      amp = 0.5;
      finalFreq = 440;
      break;
    case 'default':
    default:
      pattern = [440, 660, 550, 440];
      verses = 6;
      amp = 0.55;
      finalFreq = 330;
      break;
  }

  for (let verse = 0; verse < verses; verse++) {
    for (let f of pattern) {
      const s = generateSine(0.9, f + verse * (variant === 'bright' ? 12 : 6), SAMPLE_RATE, amp);
      parts.push(s);
      pause(0.14);
    }
    pause(0.5);
  }

  parts.push(generateSine(2.0, finalFreq, SAMPLE_RATE, amp + 0.05));
  return parts;
}

export async function generateSyntheticAdhan(variant = 'default'): Promise<string> {
  const parts = buildPartsForVariant(variant);
  const full = concatFloatArrays(parts);
  const pcm = floatTo16BitPCM(full);
  const header = writeWavHeader(pcm.byteLength, SAMPLE_RATE, 1);

  const wavBuffer = new Uint8Array(header.byteLength + pcm.byteLength);
  wavBuffer.set(new Uint8Array(header), 0);
  wavBuffer.set(new Uint8Array(pcm), header.byteLength);

  const base64 = Buffer.from(wavBuffer).toString('base64');

  const path = FileSystem.documentDirectory + `adhan-synthetic-${variant}.wav`;
  await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });

  return path;
}

export async function ensureSyntheticAdhanExists(variant = 'default'): Promise<string | null> {
  const path = FileSystem.documentDirectory + `adhan-synthetic-${variant}.wav`;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) return path;
  try {
    return await generateSyntheticAdhan(variant);
  } catch (e) {
    return null;
  }
}

export async function removeSyntheticAdhan(variant = 'default'): Promise<void> {
  const path = FileSystem.documentDirectory + `adhan-synthetic-${variant}.wav`;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}
