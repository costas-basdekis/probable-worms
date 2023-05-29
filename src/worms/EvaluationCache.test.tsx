import {EvaluationCache} from "./EvaluationCache";
import {Evaluation} from "./Evaluation";

describe("EvaluationCache", () => {
  describe("get", () => {
    it("returns nothing for unencountered evaluation with empty cache", () => {
      expect(new EvaluationCache().get("abc")).toBe(undefined);
    });
    it("returns previous evaluation for encountered evaluation", () => {
      const evaluationCache = new EvaluationCache();
      const evaluation = Evaluation.empty();
      evaluationCache.set("abc", evaluation);
      expect(evaluationCache.get("abc")).toBe(evaluation);
    });
    it("returns nothing for unencountered evaluation", () => {
      const evaluationCache = new EvaluationCache();
      const evaluation = Evaluation.empty();
      evaluationCache.set("abc", evaluation);
      expect(evaluationCache.get("def")).toBe(undefined);
    });
  });
});
