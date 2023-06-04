// noinspection PointlessArithmeticExpressionJS

import {Evaluation, Results} from "./index";

describe("Evaluation", () => {
  describe("combineOptions", () => {
    it("combines 0 options into empty", () => {
      expect(Evaluation.combineOptions([])).toEqual(Evaluation.empty());
    });
    it("combines 1 option as is", () => {
      expect(Evaluation.combineOptions([
        new Evaluation(new Results([[1, 1], [2, 1]]), new Results([[1, 1], [2, 2]]), new Results([[1, 1.5], [2, 2]]), 1.5),
      ])).toEqual(new Evaluation(new Results([[1, 1], [2, 1]]), new Results([[1, 1], [2, 2]]), new Results([[1, 1.5], [2, 2]]), 1.5));
    });
    it("combines 2 options by picking the max values", () => {
      expect(Evaluation.combineOptions([
        new Evaluation(new Results([[1, 1], [2, 0.5]]), new Results([[1, 1], [2, 2]]), new Results([[1, 1.5], [2, 2]]), 1),
        new Evaluation(new Results([[1, 0.5], [2, 1]]), new Results([[1, 2], [2, 1]]), new Results([[1, 1], [2, 3]]), 2),
      ])).toEqual(new Evaluation(new Results([[1, 1], [2, 1]]), new Results([[1, 2], [2, 2]]), new Results([[1, 1.5], [2, 3]]), 2));
    });
  });

  describe("combineProbabilities", () => {
    it("combines 0 probabilities into empty", () => {
      expect(Evaluation.combineProbabilities([])).toEqual(Evaluation.empty());
    });
    it("combines 1 probability as is", () => {
      expect(Evaluation.combineProbabilities([
        {evaluation: new Evaluation(new Results([[1, 1], [2, 1]]), new Results([[1, 1], [2, 2]]), new Results([[1, 1.5], [2, 2]]), 1), ratio: 1},
      ])).toEqual(new Evaluation(new Results([[1, 1], [2, 1]]), new Results([[1, 1], [2, 2]]), new Results([[1, 1.5], [2, 2]]), 1));
    });
    it("combines 2 probabilities according to their weight", () => {
      expect(Evaluation.combineProbabilities([
        {evaluation: new Evaluation(new Results([[1, 0.5], [2, 1]]), new Results([[1, 1], [2, 0.5]]), new Results([[1, 1.5], [2, 2]]), 1), ratio: 0.25},
        {evaluation: new Evaluation(new Results([[1, 0.25], [2, 0.75]]), new Results([[1, 0.5], [2, 1]]), new Results([[1, 1], [2, 3]]), 2), ratio: 0.75},
      ])).toEqual(new Evaluation(
        new Results([[1, 0.5 * 0.25 + 0.25 * 0.75], [2, 1 * 0.25 + 0.75 * 0.75]]),
        new Results([[1, 1 * 0.25 + 0.5 * 0.75], [2, 0.5 * 0.25 + 1 * 0.75]]),
        new Results([[1, 1.125], [2, 2.75]]),
        1.75,
      ));
    });
  });
});
