import _ from "underscore";

import { Results } from "./Results";

export interface SerialisedEvaluation {
  minimumResultOccurrencesEntries: [number, number][],
  exactResultOccurrencesEntries: [number, number][],
}

export class Evaluation {
  minimumResultOccurrences: Results;
  exactResultOccurrences: Results;

  static combineOptions(options: Evaluation[]): Evaluation {
    const combined = this.empty();
    for (const evaluation of options) {
      for (const [result, count] of evaluation.minimumResultOccurrences.entries()) {
        combined.minimumResultOccurrences.set(result, Math.max(combined.minimumResultOccurrences.get(result) || 0, count));
      }
      for (const [result, count] of evaluation.exactResultOccurrences.entries()) {
        combined.exactResultOccurrences.set(result, Math.max(combined.exactResultOccurrences.get(result) || 0, count));
      }
    }
    return combined;
  }

  static combineProbabilities(options: {evaluation: Evaluation, ratio: number}[]): Evaluation {
    const combined = this.empty();
    for (const {evaluation, ratio: evaluationRatio} of options) {
      for (const [result, ratio] of evaluation.minimumResultOccurrences.entries()) {
        combined.minimumResultOccurrences.set(result, (combined.minimumResultOccurrences.get(result) || 0) + ratio * evaluationRatio);
      }
      for (const [result, ratio] of evaluation.exactResultOccurrences.entries()) {
        combined.exactResultOccurrences.set(result, (combined.exactResultOccurrences.get(result) || 0) + ratio * evaluationRatio);
      }
    }
    return combined;
  }

  static fromResults(results: Results): Evaluation {
    const evaluation = this.empty();
    for (const [total, count] of results.entries()) {
      for (const minTotal of _.range(1, total + 1)) {
        evaluation.minimumResultOccurrences.set(minTotal, (evaluation.minimumResultOccurrences.get(total) || 0) + count);
      }
    }
    evaluation.exactResultOccurrences.mergeWith(results);
    return evaluation;
  }

  static empty(): Evaluation {
    return new Evaluation(new Results(), new Results());
  }

  static deserialise(serialised: SerialisedEvaluation): Evaluation {
    return new Evaluation(
      new Results(serialised.minimumResultOccurrencesEntries),
      new Results(serialised.exactResultOccurrencesEntries),
    );
  }

  constructor(minimumResultOccurrences: Results, exactResultOccurrences: Results) {
    this.minimumResultOccurrences = minimumResultOccurrences;
    this.exactResultOccurrences = exactResultOccurrences;
  }

  toFixed(): Evaluation {
    return new Evaluation(
      this.minimumResultOccurrences.toFixed(),
      this.exactResultOccurrences.toFixed(),
    );
  }

  serialise(): SerialisedEvaluation {
    return {
      minimumResultOccurrencesEntries: Array.from(this.minimumResultOccurrences.entries()),
      exactResultOccurrencesEntries: Array.from(this.exactResultOccurrences.entries()),
    };
  }
}
