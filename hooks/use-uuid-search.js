import React from "react";
import { uuidToIndex, indexToUUID } from "../lib/uuidTools";
import { MAX_PASSWORD } from "../lib/constants";

const SEARCH_LOOKBACK = 50;
const SEARCH_LOOKAHEAD = 25;
const RANDOM_SEARCH_ITERATIONS = 1000;

function generatePasswordWithSubstring(sub, minLen = 4, maxLen = 32) {
  // Only use allowed chars
  const allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~`";
  if (!sub || sub.length > maxLen || ![...sub].every(c => allowed.includes(c))) return null;
  // If sub is already valid length, return it
  if (sub.length >= minLen && sub.length <= maxLen) return sub;
  // Otherwise, pad with 'a' to the right then left
  let padLen = minLen - sub.length;
  if (padLen < 0) padLen = 0;
  let padded = sub + 'a'.repeat(padLen);
  if (padded.length < minLen) padded = 'a'.repeat(minLen - padded.length) + padded;
  if (padded.length > maxLen) padded = padded.slice(0, maxLen);
  return padded;
}

export function useUUIDSearch({ virtualPosition, displayedUUIDs }) {
  const [search, setSearch] = React.useState(null);
  const [uuid, setUUID] = React.useState(null);
  // Stack of complete states we've seen
  const [nextStates, setNextStates] = React.useState([]);

  const previousUUIDs = React.useMemo(() => {
    let hasComputed = false;
    let value = null;
    const getValue = () => {
      const compute = () => {
        const prev = [];
        for (let i = 1; i <= SEARCH_LOOKBACK; i++) {
          i = BigInt(i);
          let index = BigInt(virtualPosition) - i;
          if (index < 0n) {
            index = MAX_PASSWORD + index;
          }
          const uuid = indexToUUID(index);
          prev.push({ index, uuid });
        }
        return prev;
      };
      if (!hasComputed) {
        value = compute();
        hasComputed = true;
      }
      return value;
    };
    return getValue;
  }, [virtualPosition]);

  const nextUUIDs = React.useMemo(() => {
    let hasComputed = false;
    let value = null;
    const getValue = () => {
      const compute = () => {
        const next = [];
        for (let i = 1; i <= SEARCH_LOOKAHEAD; i++) {
          i = BigInt(i);
          let index = virtualPosition + i;
          if (index > MAX_PASSWORD) {
            index = index - MAX_PASSWORD;
          }
          const uuid = indexToUUID(index);
          next.push({ index, uuid });
        }
        return next;
      };
      if (!hasComputed) {
        value = compute();
        hasComputed = true;
      }
      return value;
    };
    return getValue;
  }, [virtualPosition]);

  const searchAround = React.useCallback(
    ({ input, wantHigher, canUseCurrentIndex }) => {
      if (wantHigher) {
        const startPosition = canUseCurrentIndex ? 0 : 1;
        for (let i = startPosition; i < displayedUUIDs.length; i++) {
          const uuid = displayedUUIDs[i].uuid;
          if (uuid.includes(input)) {
            return { uuid, index: displayedUUIDs[i].index };
          }
        }
        const next = nextUUIDs();
        for (let i = 0; i < next.length; i++) {
          const uuid = next[i].uuid;
          if (uuid.includes(input)) {
            return { uuid, index: nextUUIDs[i].index };
          }
        }
      } else {
        // canUseCurrentIndex isn't relevant when searching backwards!
        const prev = previousUUIDs();
        for (const { uuid, index } of prev) {
          if (uuid.includes(input)) {
            return { uuid, index };
          }
        }
      }
      return null;
    },
    [displayedUUIDs, previousUUIDs, nextUUIDs]
  );

  const searchRandomly = React.useCallback(
    ({ input, wantHigher }) => {
      // For passwords, we'll search randomly by generating passwords that contain the input
      let best = null;
      let compareIndex = virtualPosition;
      
      for (let i = 0; i < RANDOM_SEARCH_ITERATIONS; i++) {
        // Generate a random password
        const randomIndex = BigInt(Math.floor(Math.random() * Number(MAX_PASSWORD)));
        const uuid = indexToUUID(randomIndex);
        
        if (uuid.includes(input)) {
          const index = uuidToIndex(uuid);
          if (index === null) continue;
          
          const satisfiesConstraint = wantHigher
            ? index > compareIndex
            : index < compareIndex;
          const notInHistory = !nextStates.some(
            ({ uuid: nextUUID }) => nextUUID === uuid
          );

          if (satisfiesConstraint && notInHistory) {
            if (best === null) {
              best = { uuid, index };
            } else {
              const bestDistance = wantHigher
                ? best.index - compareIndex
                : compareIndex - best.index;
              const currentDistance = wantHigher
                ? index - compareIndex
                : compareIndex - index;
              if (currentDistance < bestDistance) {
                best = { uuid, index };
              }
            }
          }
        }
      }
      return best;
    },
    [virtualPosition, nextStates]
  );

  const searchUUID = React.useCallback(
    (input) => {
      // Try to generate a password containing the input
      const password = generatePasswordWithSubstring(input);
      if (!password) return;
      const index = uuidToIndex(password);
      if (index !== null) {
        setUUID(password);
        return password;
      }
      return null;
    },
    []
  );

  const nextUUID = React.useCallback(() => {
    if (!uuid) return null;
    const idx = uuidToIndex(uuid);
    if (idx === null) return null;
    const nextIdx = idx + 1n;
    if (nextIdx >= MAX_PASSWORD) return null;
    const next = indexToUUID(nextIdx);
    setUUID(next);
    return next;
  }, [uuid]);

  const previousUUID = React.useCallback(() => {
    if (!uuid) return null;
    const idx = uuidToIndex(uuid);
    if (idx === null || idx === 0n) return null;
    const prevIdx = idx - 1n;
    const prev = indexToUUID(prevIdx);
    setUUID(prev);
    return prev;
  }, [uuid]);

  return {
    searchUUID,
    nextUUID,
    previousUUID,
    currentUUID: uuid,
    setSearch,
  };
}
