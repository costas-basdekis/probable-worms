import {RolledStateEvaluator} from "./RolledStateEvaluator";
import {RolledState} from "./RolledState";
import {Evaluation} from "./Evaluation";
import {Results} from "./Results";
import {Worm} from "./RollResult";
import _ from "underscore";

describe("RolledStateEvaluator", () => {
  describe("getCacheKey", () => {
    it("returns the cache key for an empty state with 1 rolled die", () => {
      expect(RolledStateEvaluator.fromRolledState(RolledState.fromDice([], [1])).getCacheKey()).toEqual(
        "Rt0cd1,1"
      );
    });
    it("returns the cache key for a state with many rolled die", () => {
      expect(RolledStateEvaluator.fromRolledState(RolledState.fromDice([1, 1, 2, 2, 3, 3], [1, 1, 3])).getCacheKey()).toEqual(
        "Rt12c1,2,3d1,2,3,1"
      );
    });
  });
  describe("processAll", () => {
    it("processes an empty state with 1 non-worm rolled die", () => {
      expect(RolledStateEvaluator.fromRolledState(RolledState.fromDice([], [1])).processAll().evaluation).toEqual(
        new Evaluation(new Results(), new Results([[0, 1]]), new Results(), 0)
      );
    });
    it("processes an empty state with 1 worm rolled die", () => {
      expect(RolledStateEvaluator.fromRolledState(RolledState.fromDice([], [Worm])).processAll().evaluation).toEqual(
        new Evaluation(
          new Results(_.range(1, 6).map(total => [total, 1])),
          new Results([[5, 1]]),
          new Results([[1, 5], [2, 5], [3, 5], [4, 5], [5, 5]]),
          5,
        )
      );
    });
    it("processes an empty state with 2 doubled non-worm rolled dice", () => {
      expect(RolledStateEvaluator.fromRolledState(RolledState.fromDice([], [1, 1])).processAll().evaluation).toEqual(
        new Evaluation(new Results(), new Results([[0, 1]]), new Results(), 0)
      );
    });
    it("processes an empty state with 2 doubled worm rolled dice", () => {
      expect(RolledStateEvaluator.fromRolledState(RolledState.fromDice([], [Worm, Worm])).processAll().evaluation).toEqual(
        new Evaluation(
          new Results(_.range(1, 11).map(total => [total, 1])),
          new Results([[10, 1]]),
          new Results([[1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10]]),
          10,
        )
      );
    });
    it("processes an state with 1 picked worm and 2 rolled dice of worm and 1, and has a 100% minimum of 1-5", () => {
      const rolledStateEvaluator = RolledStateEvaluator.fromRolledState(RolledState.fromDice([Worm], [1, Worm])).processAll();
      expect(Array.from(rolledStateEvaluator.evaluation!.toFixed().minimumResultOccurrences.entries()).filter(([total]) => total <= 5)).toEqual(
        [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]
      );
    });
  });
  describe("getRemainingDiceCountFromCacheKey", () => {
    it("gets remaining dice count from initial rolled state with 1 distinct die", () => {
      expect(RolledStateEvaluator.getRemainingDiceCountFromCacheKey("Rt0cd5,5")).toBe(5);
    });
    it("gets remaining dice count from initial rolled state with many distinct die", () => {
      expect(RolledStateEvaluator.getRemainingDiceCountFromCacheKey("Rt0cd3,2,4,1,5,2")).toBe(5);
    });
    it("gets remaining dice count from initial rolled state with many distinct die with Worm", () => {
      expect(RolledStateEvaluator.getRemainingDiceCountFromCacheKey("Rt0cd4,2,5,1,\"W\",2")).toBe(5);
    });
    it("gets remaining dice count from terminal rolled state", () => {
      expect(RolledStateEvaluator.getRemainingDiceCountFromCacheKey("Rt4c1d1,1")).toBe(1);
    });
    it("doesn't get remaining dice count from non-rolled state cache key", () => {
      expect(RolledStateEvaluator.getRemainingDiceCountFromCacheKey("St12c1,2,3,5r0")).toBe(null);
    });
  });
});
