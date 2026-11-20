export interface Random {
  nextFloat(): number;
  intInclusive(min: number, max: number): number;
}

const fnv1aHash = (seed: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const UINT32_RANGE = 2 ** 32;

const mulberry32 = (seed: number): Random => {
  let generatorState = seed;
  const nextFloat = () => {
    generatorState = (generatorState + 0x6d2b79f5) >>> 0;
    let t = generatorState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
  return {
    nextFloat,
    intInclusive: (min, max) => min + Math.floor(nextFloat() * (max - min + 1)),
  };
};

export const createSeededRandom = (seed: string): Random => mulberry32(fnv1aHash(seed));
