/**
 * A seeded random number generator (Linear Congruential Generator)
 * Modified to provide decent distribution for simple UI simulations.
 */
export class SeededRNG {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
     */
    next(): number {
        // Multimedia LCG constants
        // a = 22695477
        // c = 1
        // m = 2^32
        this.seed = (this.seed * 22695477 + 1) >>> 0;
        return this.seed / 4294967296;
    }

    /**
     * Returns a pseudo-random integer between min (inclusive) and max (exclusive).
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min)) + min;
    }

    /**
     * Returns a pseudo-random element from an array.
     */
    pick<T>(array: T[]): T {
        return array[this.nextInt(0, array.length)];
    }
}
