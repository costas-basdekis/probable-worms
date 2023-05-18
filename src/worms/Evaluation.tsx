import _ from "underscore";

import {Results} from "./Results";

export class Evaluation {
  minimumResultOccurences: Results;
  exactResultOccurrences: Results;

  static combineOptions(options: Evaluation[]): Evaluation {
    const combined = this.empty();
    for (const evaluation of options) {
      for (const [result, count] of evaluation.minimumResultOccurences.entries()) {
        combined.minimumResultOccurences.set(result, Math.max(combined.minimumResultOccurences.get(result) || 0, count));
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
      for (const [result, ratio] of evaluation.minimumResultOccurences.entries()) {
        combined.minimumResultOccurences.set(result, (combined.minimumResultOccurences.get(result) || 0) + ratio * evaluationRatio);
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
        evaluation.minimumResultOccurences.set(minTotal, evaluation.minimumResultOccurences.get(total) || 0 + count);
      }
    }
    evaluation.exactResultOccurrences.mergeWith(results);
    return evaluation;
  }

  static empty(): Evaluation {
    return new Evaluation(new Results(), new Results());
  }

  constructor(minimumResultOccurences: Results, exactResultOccurrences: Results) {
    this.minimumResultOccurences = minimumResultOccurences;
    this.exactResultOccurrences = exactResultOccurrences;
  }

  toFixed(): Evaluation {
    return new Evaluation(
      this.minimumResultOccurences.toFixed(),
      this.exactResultOccurrences.toFixed(),
    );
  }
}
