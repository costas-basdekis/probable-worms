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
  describe("hitCount/missCount", () => {
    it("has no counts for unused cached", () => {
      const evaluationCache = new EvaluationCache();
      expect([evaluationCache.hitCount, evaluationCache.missCount]).toEqual([0, 0]);
    });
    it("has no counts for unused filled cached", () => {
      const evaluationCache = new EvaluationCache();
      evaluationCache.set("abc", Evaluation.empty());
      expect([evaluationCache.hitCount, evaluationCache.missCount]).toEqual([0, 0]);
    });
    it("has no miss counts for always-hit filled cached", () => {
      const evaluationCache = new EvaluationCache();
      evaluationCache.set("abc", Evaluation.empty());
      evaluationCache.get("abc");
      evaluationCache.get("abc");
      evaluationCache.get("abc");
      expect([evaluationCache.hitCount, evaluationCache.missCount]).toEqual([3, 0]);
    });
    it("has no hit counts for always-hit filled cached", () => {
      const evaluationCache = new EvaluationCache();
      evaluationCache.set("abc", Evaluation.empty());
      evaluationCache.get("def");
      evaluationCache.get("def");
      evaluationCache.get("def");
      expect([evaluationCache.hitCount, evaluationCache.missCount]).toEqual([0, 3]);
    });
    it("has hit and miss counts for sometimes-hit filled cached", () => {
      const evaluationCache = new EvaluationCache();
      evaluationCache.set("abc", Evaluation.empty());
      evaluationCache.get("abc");
      evaluationCache.get("def");
      evaluationCache.get("abc");
      expect([evaluationCache.hitCount, evaluationCache.missCount]).toEqual([2, 1]);
    });
  });
});
