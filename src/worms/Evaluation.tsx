import _ from "underscore";

import {CompressedSerialisedResults, Results, SerialisedResults} from "./Results";

export interface SerialisedEvaluation {
  minimumResultOccurrencesEntries: SerialisedResults,
  exactResultOccurrencesEntries: SerialisedResults,
  expectedValueOfAtLeastEntries: SerialisedResults,
  expectedValue: number,
}

export interface CompressedSerialisedEvaluation {
  minimumResultOccurrencesEntries: CompressedSerialisedResults,
  exactResultOccurrencesEntries: SerialisedResults,
  expectedValueOfAtLeastEntries: CompressedSerialisedResults,
  expectedValue: number,
}

export class Evaluation {
  minimumResultOccurrences: Results;
  exactResultOccurrences: Results;
  expectedValueOfAtLeast: Results;
  expectedValue: number;

  static combineOptions(options: Evaluation[]): Evaluation {
    const combined = this.empty();
    let maxExpectedValue = 0;
    for (const evaluation of options) {
      for (const [result, count] of evaluation.minimumResultOccurrences.entries()) {
        combined.minimumResultOccurrences.set(result, Math.max(combined.minimumResultOccurrences.get(result) || 0, count));
      }
      for (const [result, count] of evaluation.exactResultOccurrences.entries()) {
        combined.exactResultOccurrences.set(result, Math.max(combined.exactResultOccurrences.get(result) || 0, count));
      }
      for (const [result, expectedValue] of evaluation.expectedValueOfAtLeast.entries()) {
        combined.expectedValueOfAtLeast.set(result, Math.max(combined.expectedValueOfAtLeast.get(result) || 0, expectedValue));
      }
      maxExpectedValue = Math.max(maxExpectedValue, evaluation.expectedValue);
    }
    combined.expectedValue = maxExpectedValue;
    return combined;
  }

  static combineProbabilities(options: {evaluation: Evaluation, ratio: number}[]): Evaluation {
    const combined = this.empty();
    let expectedValue = 0;
    for (const {evaluation, ratio: evaluationRatio} of options) {
      for (const [result, ratio] of evaluation.minimumResultOccurrences.entries()) {
        combined.minimumResultOccurrences.set(result, (combined.minimumResultOccurrences.get(result) || 0) + ratio * evaluationRatio);
      }
      for (const [result, ratio] of evaluation.exactResultOccurrences.entries()) {
        combined.exactResultOccurrences.set(result, (combined.exactResultOccurrences.get(result) || 0) + ratio * evaluationRatio);
      }
      for (const [result, expectedValue] of evaluation.expectedValueOfAtLeast.entries()) {
        combined.expectedValueOfAtLeast.set(result, (combined.expectedValueOfAtLeast.get(result) || 0) + expectedValue * evaluationRatio);
      }
      expectedValue += evaluation.expectedValue * evaluationRatio;
    }
    combined.expectedValue = expectedValue;
    return combined;
  }

  static fromTotal(total: number): Evaluation {
    const evaluation = this.empty();
    for (const minTotal of _.range(1, total + 1)) {
      evaluation.minimumResultOccurrences.set(minTotal, 1);
      evaluation.expectedValueOfAtLeast.set(minTotal, total);
    }
    evaluation.exactResultOccurrences.set(total, 1);
    evaluation.expectedValue = total;
    return evaluation;
  }

  static empty(): Evaluation {
    return new Evaluation(new Results(), new Results(), new Results(), 0);
  }

  static deserialise(serialised: SerialisedEvaluation): Evaluation {
    return new Evaluation(
      Results.deserialise(serialised.minimumResultOccurrencesEntries),
      Results.deserialise(serialised.exactResultOccurrencesEntries),
      Results.deserialise(serialised.expectedValueOfAtLeastEntries ?? []),
      serialised.expectedValue ?? 0,
    );
  }

  static deserialiseRounded(serialised: SerialisedEvaluation): Evaluation {
    return new Evaluation(
      Results.deserialiseRounded(serialised.minimumResultOccurrencesEntries),
      Results.deserialiseRounded(serialised.exactResultOccurrencesEntries),
      Results.deserialiseRounded(serialised.expectedValueOfAtLeastEntries ?? []),
      serialised.expectedValue ?? 0,
    );
  }

  static deserialiseCompressed(serialised: CompressedSerialisedEvaluation): Evaluation {
    return new Evaluation(
      Results.deserialiseCompressed(serialised.minimumResultOccurrencesEntries),
      Results.deserialise(serialised.exactResultOccurrencesEntries),
      Results.deserialiseCompressed(serialised.expectedValueOfAtLeastEntries ?? []),
      serialised.expectedValue ?? 0,
    );
  }

  static deserialiseCompressedRoundedSparse(serialised: CompressedSerialisedEvaluation): Evaluation {
    return new Evaluation(
      Results.deserialiseCompressedRounded(serialised.minimumResultOccurrencesEntries),
      Results.deserialiseRounded(serialised.exactResultOccurrencesEntries),
      Results.deserialiseCompressedRounded(serialised.expectedValueOfAtLeastEntries ?? []),
      serialised.expectedValue ?? 0,
    );
  }

  constructor(minimumResultOccurrences: Results, exactResultOccurrences: Results, expectedValueOfAtLeast: Results, expectedValue: number) {
    this.minimumResultOccurrences = minimumResultOccurrences;
    this.exactResultOccurrences = exactResultOccurrences;
    this.expectedValueOfAtLeast = expectedValueOfAtLeast;
    this.expectedValue = expectedValue;
  }

  toFixed(): Evaluation {
    return new Evaluation(
      this.minimumResultOccurrences.toFixed(),
      this.exactResultOccurrences.toFixed(),
      this.expectedValueOfAtLeast.toFixed(),
      parseFloat(this.expectedValue.toFixed(6)),
    );
  }

  serialise(): SerialisedEvaluation {
    return {
      minimumResultOccurrencesEntries: this.minimumResultOccurrences.serialise(),
      exactResultOccurrencesEntries: this.exactResultOccurrences.serialise(),
      expectedValueOfAtLeastEntries: this.expectedValueOfAtLeast.serialise(),
      expectedValue: this.expectedValue,
    };
  }

  serialiseRounded(): SerialisedEvaluation {
    return {
      minimumResultOccurrencesEntries: this.minimumResultOccurrences.serialiseRounded(),
      exactResultOccurrencesEntries: this.exactResultOccurrences.serialiseRounded(),
      expectedValueOfAtLeastEntries: this.expectedValueOfAtLeast.serialiseRounded(),
      expectedValue: parseInt(this.expectedValue.toFixed(1), 10),
    };
  }

  serialiseCompressed(): CompressedSerialisedEvaluation {
    return {
      minimumResultOccurrencesEntries: this.minimumResultOccurrences.serialiseCompressed(),
      exactResultOccurrencesEntries: this.exactResultOccurrences.serialise(),
      expectedValueOfAtLeastEntries: this.expectedValueOfAtLeast.serialiseCompressed(),
      expectedValue: this.expectedValue,
    };
  }

  serialiseCompressedRoundedSparse(): CompressedSerialisedEvaluation {
    return {
      minimumResultOccurrencesEntries: this.minimumResultOccurrences.serialiseCompressedRounded(),
      exactResultOccurrencesEntries: this.exactResultOccurrences.serialiseRounded(),
      expectedValueOfAtLeastEntries: this.expectedValueOfAtLeast.serialiseCompressedRounded(),
      expectedValue: parseInt(this.expectedValue.toFixed(1), 10),
    };
  }
}
