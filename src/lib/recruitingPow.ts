/**
 * Proof of work for the public application form.
 *
 * The database issues a single-use challenge id and a difficulty. The browser must find a
 * nonce such that sha256("<challenge id>:<nonce>") begins with that many zero bits. At the
 * default of 18 bits that is roughly a quarter of a million hashes.
 *
 * WHY NOT crypto.subtle.digest: it is async, so every hash costs a promise. Measured at a
 * few tens of thousands per second, which turns a one-second job into ten. The synchronous
 * implementation below is the reason this is usable at all.
 *
 * WHY A SINGLE-BLOCK IMPLEMENTATION: the message is a 36-character uuid, a colon and a
 * short decimal nonce - 45 characters at the outside, comfortably inside the 55 bytes that
 * fit in one 64-byte SHA-256 block with its padding. Dropping the multi-block loop removes
 * most of the per-hash overhead. `solve` refuses to run if that assumption is ever broken
 * rather than quietly computing the wrong digest.
 *
 * WHY NOT A WEB WORKER: a worker would need either a separate chunk (which Vite would emit
 * as another file to remember to copy into docs/) or a blob URL (which a future
 * Content-Security-Policy would block). Yielding to the event loop between batches keeps
 * the page responsive without either.
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const W = new Uint32Array(64);

/**
 * SHA-256 of a byte array that fits in one block (<= 55 bytes), returning only the first
 * 32 bits of the digest as an unsigned integer. That is all the caller needs: the
 * difficulty never exceeds 26 bits, so nothing beyond the first four bytes is ever
 * examined, and skipping the other six words is free speed.
 */
const sha256FirstWord = (block: Uint8Array): number => {
  for (let i = 0; i < 16; i++) {
    const j = i * 4;
    W[i] = (block[j] << 24) | (block[j + 1] << 16) | (block[j + 2] << 8) | block[j + 3];
  }
  for (let i = 16; i < 64; i++) {
    const x = W[i - 15];
    const y = W[i - 2];
    const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
    const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
    W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
  }

  let a = 0x6a09e667, b = 0xbb67ae85, c = 0x3c6ef372, d = 0xa54ff53a;
  let e = 0x510e527f, f = 0x9b05688c, g = 0x1f83d9ab, h = 0x5be0cd19;

  for (let i = 0; i < 64; i++) {
    const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    const ch = (e & f) ^ (~e & g);
    const t1 = (h + S1 + ch + K[i] + W[i]) | 0;
    const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const t2 = (S0 + maj) | 0;
    h = g; g = f; f = e; e = (d + t1) | 0;
    d = c; c = b; b = a; a = (t1 + t2) | 0;
  }

  return ((0x6a09e667 + a) | 0) >>> 0;
};

/** Build the padded single block for "<prefix><nonce>", reusing one buffer. */
const block = new Uint8Array(64);

const fillBlock = (prefixBytes: Uint8Array, nonce: number): number => {
  block.fill(0);
  block.set(prefixBytes, 0);
  let len = prefixBytes.length;

  // Decimal nonce, written without allocating a string.
  if (nonce === 0) {
    block[len++] = 48;
  } else {
    const start = len;
    let n = nonce;
    while (n > 0) { block[len++] = 48 + (n % 10); n = (n / 10) | 0; }
    for (let i = start, j = len - 1; i < j; i++, j--) {
      const t = block[i]; block[i] = block[j]; block[j] = t;
    }
  }

  block[len] = 0x80;
  const bits = len * 8;
  block[62] = (bits >>> 8) & 0xff;
  block[63] = bits & 0xff;
  return len;
};

export interface PowChallenge {
  challenge_id: string;
  difficulty_bits: number;
}

export interface PowSolution {
  pow_challenge_id: string;
  pow_nonce: string;
}

/** How many nonces to try before handing the thread back to the browser. */
const BATCH = 8192;

/**
 * Solve a challenge, yielding to the event loop between batches so the page keeps
 * repainting and the applicant can carry on typing.
 *
 * onProgress reports attempts so far, for a spinner that does not look frozen.
 * The 60-second ceiling is a safety net for a very slow device: rather than trapping
 * someone in an unresponsive form forever, it gives up and the caller lets them submit
 * again.
 */
export const solvePow = async (
  challenge: PowChallenge,
  onProgress?: (attempts: number) => void,
  signal?: { cancelled: boolean },
): Promise<PowSolution | null> => {
  const { challenge_id, difficulty_bits } = challenge;

  if (difficulty_bits <= 0) return { pow_challenge_id: challenge_id, pow_nonce: "0" };

  const prefix = new TextEncoder().encode(`${challenge_id}:`);
  // 55 bytes is the single-block limit; a 10-digit nonce leaves plenty of room, but assert
  // rather than silently hashing a truncated message.
  if (prefix.length + 10 > 55) {
    console.error("Proof-of-work prefix is too long for the single-block implementation.");
    return null;
  }

  const target = 32 - difficulty_bits;
  const started = Date.now();
  let nonce = 0;

  for (;;) {
    for (let i = 0; i < BATCH; i++) {
      fillBlock(prefix, nonce);
      if (sha256FirstWord(block) >>> target === 0) {
        return { pow_challenge_id: challenge_id, pow_nonce: String(nonce) };
      }
      nonce++;
    }

    if (signal?.cancelled) return null;
    if (Date.now() - started > 60_000) {
      console.warn("Proof of work gave up after 60 seconds.");
      return null;
    }

    onProgress?.(nonce);
    // Hand the thread back. setTimeout(0) rather than requestIdleCallback: idle callbacks
    // can be starved indefinitely on a busy page, and this work must actually finish.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};
