export class Results {
  counts: Map<number, number>;

  constructor(items?: Iterable<readonly [number, number]>) {
    this.counts = new Map(items as Iterable<readonly [number, number]>);
  }

  get(key: number): number | undefined {
    return this.counts.get(key);
  }

  set(key: number, value: number): this {
    this.counts.set(key, value);
    return this;
  }

  keys(): Iterable<number> {
    return this.counts.keys();
  }

  entries(): Iterable<[number, number]> {
    return this.counts.entries();
  }

  mergeWith(other: Results): this {
    for (const [total, count] of other.entries()) {
      this.set(total, (this.get(total) || 0) + count);
    }
    return this;
  }

  add(result: number, count: number): void {
    this.set(result, (this.get(result) || 0) + count);
  }

  get total(): number {
    return Array.from(this.counts.values()).reduce(
      (total, current) => total + current,
      0
    );
  }

  toFixed(): Results {
    return new Results(
      Array.from(this.entries()).map(([key, value]: [number, number]) => {
        if (isNaN(parseFloat(value.toFixed(6)))) {
          throw new Error(
            `Value was not a number, it was a ${
              value?.constructor?.name || value
            }: ${value}`
          );
        }
        return [key, parseFloat(value.toFixed(6))] as [number, number];
      })
    );
  }
}
