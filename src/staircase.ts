type StaircaseOptions = {
  startDb?: number;
  stepDb?: number;
  down?: number;
  up?: number;
  minDb?: number;
  maxDb?: number;
  stopReversals?: number;
};

function dbToGain(db: number) {
  return Math.pow(10, db / 20);
}

export class Staircase {
  currentDb: number;
  stepDb: number;
  down: number;
  up: number;
  minDb: number;
  maxDb: number;
  stopReversals: number;

  private consecutiveDowns: number;
  private lastDirection: 'up' | 'down' | null;
  private reversals: number[];

  constructor(opts: StaircaseOptions = {}) {
    this.currentDb = opts.startDb ?? -20;
    this.stepDb = opts.stepDb ?? 6;
    this.down = opts.down ?? 2;
    this.up = opts.up ?? 1;
    this.minDb = opts.minDb ?? -90;
    this.maxDb = opts.maxDb ?? 0;
    this.stopReversals = opts.stopReversals ?? 6;

    this.consecutiveDowns = 0;
    this.lastDirection = null;
    this.reversals = [];
  }

  getCurrentGain() {
    return Math.max(0, Math.min(1, dbToGain(this.currentDb)));
  }

  recordResponse(heard: boolean) {
    if (heard) {
      this.consecutiveDowns += 1;
      if (this.consecutiveDowns >= this.down) {
        // perform a down step
        const prevDir = this.lastDirection;
        this.lastDirection = 'down';
        if (prevDir === 'up') {
          this.reversals.push(this.currentDb);
        }
        this.currentDb = Math.max(this.minDb, this.currentDb - this.stepDb);
        this.consecutiveDowns = 0;
      }
    } else {
      // an 'up' step happens immediately for transformed up-down
      this.consecutiveDowns = 0;
      const prevDir = this.lastDirection;
      this.lastDirection = 'up';
      if (prevDir === 'down') {
        this.reversals.push(this.currentDb);
      }
      this.currentDb = Math.min(this.maxDb, this.currentDb + this.stepDb);
    }

    const finished = this.reversals.length >= this.stopReversals;
    return { finished, gain: this.getCurrentGain() };
  }

  getEstimateDb() {
    if (this.reversals.length === 0) return this.currentDb;
    // average last 4 reversals or all if fewer
    const last = this.reversals.slice(-4);
    const sum = last.reduce((s, v) => s + v, 0);
    return sum / last.length;
  }
}

export default Staircase;
