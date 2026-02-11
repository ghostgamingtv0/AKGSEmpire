// PKCE Utilities with Insecure Context Support (SHA-256 Polyfill)

export function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Simple SHA-256 implementation for non-secure contexts
async function sha256(plain) {
  // Use Web Crypto API if available and secure
  if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      return digest;
  }
  
  // Fallback for insecure contexts (http://IP)
  // Minimal SHA-256 implementation
  const msgBuffer = new TextEncoder().encode(plain);
  const msgUint8 = new Uint8Array(msgBuffer);
  
  // Imports for fallback not available, using a simple pure JS implementation
  // Adapted from a standard minimal SHA-256 implementation
  
  function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j; // Used as a counter across the whole file
  let result = '';

  let words = [];
  let asciiBitLength = msgUint8[lengthProperty] * 8;
  
  //* caching results is optional - remove/add slash from front of this line to toggle
  // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
  // (we actually calculate the first 64, but extra values are just ignored)
  let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
  let k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  
  words = new Array(64);
  
  // Pad the message
  let m = Array.from(msgUint8);
  m.push(0x80); // Append 1 bit
  while (m[lengthProperty] % 64 !== 56) m.push(0); // Padding
  
  // Append length
  let len = asciiBitLength;
  for (i = 0; i < 8; i++) {
      m.push((len >>> ((7 - i) * 8)) & 0xff);
  }
  
  // Process blocks
  for (i = 0; i < m[lengthProperty]; i += 64) {
      let w = words;
      for (j = 0; j < 64; j++) {
          if (j < 16) w[j] = (m[i + j * 4] << 24) | (m[i + j * 4 + 1] << 16) | (m[i + j * 4 + 2] << 8) | m[i + j * 4 + 3];
          else {
              let s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
              let s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
              w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
          }
      }
      
      let a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7];
      
      for (j = 0; j < 64; j++) {
          let s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
          let ch = (e & f) ^ ((~e) & g);
          let temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
          let s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
          let maj = (a & b) ^ (a & c) ^ (b & c);
          let temp2 = (s0 + maj) | 0;
          
          h = g;
          g = f;
          f = e;
          e = (d + temp1) | 0;
          d = c;
          c = b;
          b = a;
          a = (temp1 + temp2) | 0;
      }
      
      hash[0] = (hash[0] + a) | 0;
      hash[1] = (hash[1] + b) | 0;
      hash[2] = (hash[2] + c) | 0;
      hash[3] = (hash[3] + d) | 0;
      hash[4] = (hash[4] + e) | 0;
      hash[5] = (hash[5] + f) | 0;
      hash[6] = (hash[6] + g) | 0;
      hash[7] = (hash[7] + h) | 0;
  }
  
  // Convert to ArrayBuffer
  const buffer = new ArrayBuffer(32);
  const view = new DataView(buffer);
  for (i = 0; i < 8; i++) {
      view.setUint32(i * 4, hash[i], false); // Big-endian
  }
  return buffer;
}

export async function generateCodeChallenge(codeVerifier) {
  const digest = await sha256(codeVerifier);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
