import {UnrolledStateEvaluator} from "./UnrolledStateEvaluator";

describe("UnrolledStateEvaluator", () => {
  describe("getRemainingDiceCountFromCacheKey", () => {
    it("gets remaining dice count for initial state", () => {
      expect(UnrolledStateEvaluator.getRemainingDiceCountFromCacheKey("St0cr8")).toEqual(8);
    });
    it("gets remaining dice count for initial state with 15 dice", () => {
      expect(UnrolledStateEvaluator.getRemainingDiceCountFromCacheKey("St0cr15")).toEqual(15);
    });
    it("gets remaining dice count for terminal state", () => {
      expect(UnrolledStateEvaluator.getRemainingDiceCountFromCacheKey("St5c1r0")).toEqual(0);
    });
    it("gets remaining dice count for terminal state with many dice in chest", () => {
      expect(UnrolledStateEvaluator.getRemainingDiceCountFromCacheKey("St12c1,2,3,5r0")).toEqual(0);
    });
    it("doesn't get remaining dice from non-unrolled state cache key", () => {
      expect(UnrolledStateEvaluator.getRemainingDiceCountFromCacheKey("Rt7c1,2,3d1,1")).toEqual(null);
    });
  });
});
