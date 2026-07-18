export type Clock = {
  now: () => Date;
};

export const deterministicClock: Clock = {
  now: () => new Date("2026-07-17T00:00:00.000Z"),
};
