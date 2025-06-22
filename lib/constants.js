// Calculate total number of possible passwords
// Characters: a-z, A-Z, 0-9, and common special characters typically allowed in passwords
const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~`";
const CHAR_COUNT = BigInt(CHARS.length); // 82 characters

// Calculate total combinations for passwords 4-32 characters
let totalPasswords = 0n;
for (let length = 4; length <= 32; length++) {
  totalPasswords += CHAR_COUNT ** BigInt(length);
}

export const MAX_PASSWORD = totalPasswords;
export const WIDTH_TO_SHOW_DOUBLE_HEIGHT = 768;
export const SCROLLBAR_WIDTH = 24;
export const ITEM_HEIGHT = 28;

export const querySmallScreen = `(max-width: ${WIDTH_TO_SHOW_DOUBLE_HEIGHT}px)`;
export const queryVerySmallScreen = `(max-width: 550px)`;
