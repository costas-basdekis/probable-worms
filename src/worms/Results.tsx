import _ from "underscore";

export type SerialisedResults = [number, number][];
export type CompressedSerialisedResults = [number, number, number][];

export class Results {
  counts: Map<number, number>;

  static deserialise(serialised: SerialisedResults): Results {
    return new Results(serialised);
  }

  static deserialiseRounded(serialised: SerialisedResults): Results {
    return new Results(serialised.map(([key, value]) => [key, (value === -1 ? 1000 : value) / 1000]));
  }

  static deserialiseCompressed(serialisedCompressed: CompressedSerialisedResults): Results {
    const expandedTriples: [number, number][][] = serialisedCompressed.map(
      ([min, max, ratio]) => _.range(min, max + 1).map(
        (total) => [total, ratio]));
    return new Results(expandedTriples.flat());
  }

  static deserialiseCompressedRounded(serialisedCompressed: CompressedSerialisedResults): Results {
    const expandedTriples: [number, number][][] = serialisedCompressed.map(
      ([min, max, ratio]) => _.range(min, max + 1).map(
        (total) => [total, ratio]));
    return this.deserialiseRounded(expandedTriples.flat());
  }

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

  serialise(): SerialisedResults {
    return Array.from(this.entries())
  }

  serialiseRounded(): SerialisedResults {
    return this.serialise().map(([total, ratio]) => {
      const value = Math.round(ratio * 1000);
      return [total, value === 1000 ? -1 : value];
    });
  }

  serialiseCompressed(): CompressedSerialisedResults {
    return this.serialise().sort(([lTotal], [rTotal]) => lTotal - rTotal).reduce((total, [rollTotal, ratio]): [number, number, number][] => {
      const min = rollTotal, max = rollTotal;
      if (!total.length) {
        return [[min, max, ratio]];
      }
      const [lastMin, lastMax, lastRatio] = total[total.length - 1];
      if (lastMax !== (max - 1) || lastRatio !== ratio) {
        return [...total, [min, max, ratio]];
      }
      return [...total.slice(0, total.length - 1), [lastMin, max, lastRatio]];
    }, [] as [number, number, number][]);
  }

  serialiseCompressedRounded(): CompressedSerialisedResults {
    return this.serialiseRounded().sort(([lTotal], [rTotal]) => lTotal - rTotal).reduce((total, [rollTotal, ratio]): [number, number, number][] => {
      const min = rollTotal, max = rollTotal;
      if (!total.length) {
        return [[min, max, ratio]];
      }
      const [lastMin, lastMax, lastRatio] = total[total.length - 1];
      if (lastMax !== (max - 1) || lastRatio !== ratio) {
        return [...total, [min, max, ratio]];
      }
      return [...total.slice(0, total.length - 1), [lastMin, max, lastRatio]];
    }, [] as [number, number, number][]);
  }
}
