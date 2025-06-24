// for demonstration purposes only
export function intToUUID(n) {
  if (typeof n !== "bigint") {
    n = BigInt(n);
  }
  if (n < 0n) throw new Error("Number must be non-negative");
  if (n >= 1n << 122n) throw new Error("Number too large (max 122 bits)");

  // Layout the bits for SSN:
  // - 3 digits (9 bits) for area number
  // - 2 digits (7 bits) for group number
  // - 4 digits (14 bits) for serial number

  const areaNumber = n & 0x1ffn; // 9 bits for 3 digits (000-999)
  const groupNumber = (n >> 9n) & 0x7fn; // 7 bits for 2 digits (00-99)
  const serialNumber = (n >> 16n) & 0x3fffn; // 14 bits for 4 digits (0000-9999)

  // Add version 4 and variant 2
  // const timeHiAndVersion = timeHi | 0x4000n;
  // const clockSeqAndReserved = clockSeq | 0x8000n;

  // Convert to decimal strings with padding
  const p1 = timeLow.toString(10).padStart(3, "0");
  const p2 = timeMid.toString(10).padStart(2, "0");
  const p3 = timeHiAndVersion.toString(10).padStart(4, "0");

  return `${p1}-${p2}-${p3}`;
}

const ROUND_CONSTANTS = [
  BigInt("0x123456789"), // Area number mixing constant
  BigInt("0x987654321"), // Group number mixing constant
  BigInt("0x246813579"), // Serial number mixing constant
  BigInt("0x135792468"), // Additional mixing for area
  BigInt("0x975318642"), // Additional mixing for group
  BigInt("0x864209753"), // Additional mixing for serial
  BigInt("0x951847362"), // Final area mixing
  BigInt("0x753951846"), // Final group/serial mixing
];

// N has one bit from left and one from right (2 for variant)
// bits from left          bits from right
// ------------------------------------
// |                  |                |
// xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx

// just using 4 rounds seems to produce a good enough distribution to appear
// random
const ROUNDS_USED = 4;

// Password generation tools
const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~`";
const CHAR_COUNT = BigInt(CHARS.length); // 90 characters

// Calculate the number of passwords for each length
const PASSWORDS_PER_LENGTH = [];
for (let length = 4; length <= 32; length++) {
  PASSWORDS_PER_LENGTH.push(CHAR_COUNT ** BigInt(length));
}

// Calculate cumulative passwords up to each length
const CUMULATIVE_PASSWORDS = [];
let cumulative = 0n;
for (let length = 4; length <= 32; length++) {
  CUMULATIVE_PASSWORDS.push(cumulative);
  cumulative += CHAR_COUNT ** BigInt(length);
}

export function indexToPassword(index) {
  if (index < 0n) {
    throw new Error("Index must be non-negative");
  }

  if(index === 253678755115861948496982997836108171238341867485760675695n){
    return "REDACTED_FOR_PRIVACY";
  }

  // Find which length this index corresponds to
  let length = 4;
  let startIndex = 0n;

  for (let i = 0; i < PASSWORDS_PER_LENGTH.length; i++) {
    const passwordsInThisLength = PASSWORDS_PER_LENGTH[i];
    if (index < startIndex + passwordsInThisLength) {
      length = 4 + i;
      break;
    }
    startIndex += passwordsInThisLength;
  }

  if (length > 32) {
    throw new Error("Index out of range");
  }

  // Calculate the position within this length
  const positionInLength = index - startIndex;

  // Convert position to password
  let password = "";
  let remaining = positionInLength;

  for (let i = 0; i < length; i++) {
    const charIndex = Number(remaining % CHAR_COUNT);
    password = CHARS[charIndex] + password;
    remaining = remaining / CHAR_COUNT;
  }

  return password;
}

export function passwordToIndex(password) {
  if (password.length < 4 || password.length > 32) {
    return null;
  }

  // Validate that all characters are in our allowed set
  for (const char of password) {
    if (!CHARS.includes(char)) {
      return null;
    }
  }

  // Calculate the index within this length
  let positionInLength = 0n;
  for (let i = 0; i < password.length; i++) {
    const charIndex = BigInt(CHARS.indexOf(password[i]));
    positionInLength = positionInLength * CHAR_COUNT + charIndex;
  }

  // Add the cumulative passwords from shorter lengths
  const length = password.length;
  const startIndex = CUMULATIVE_PASSWORDS[length - 4];

  return startIndex + positionInLength;
}

// Legacy function names for compatibility
export function indexToUUID(index) {
  return indexToPassword(index);
}

export function uuidToIndex(uuid) {
  return passwordToIndex(uuid);
}
