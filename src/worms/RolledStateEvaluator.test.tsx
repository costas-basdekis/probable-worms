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
        new Evaluation(new Results(), new Results([[0, 1]]), 0)
      );
    });
    it("processes an empty state with 1 worm rolled die", () => {
      expect(RolledStateEvaluator.fromRolledState(RolledState.fromDice([], [Worm])).processAll().evaluation).toEqual(
        new Evaluation(new Results(_.range(1, 6).map(total => [total, 1])), new Results([[5, 1]]), 5)
      );
    });
    it("processes an empty state with 2 doubled non-worm rolled dice", () => {
      expect(RolledStateEvaluator.fromRolledState(RolledState.fromDice([], [1, 1])).processAll().evaluation).toEqual(
        new Evaluation(new Results(), new Results([[0, 1]]), 0)
      );
    });
    it("processes an empty state with 2 doubled worm rolled dice", () => {
      expect(RolledStateEvaluator.fromRolledState(RolledState.fromDice([], [Worm, Worm])).processAll().evaluation).toEqual(
        new Evaluation(new Results(_.range(1, 11).map(total => [total, 1])), new Results([[10, 1]]), 10)
      );
    });
    it("processes an state with 1 picked worm and 2 rolled dice of worm and 1, and has a 100% minimum of 1-5", () => {
      const rolledStateEvaluator = RolledStateEvaluator.fromRolledState(RolledState.fromDice([Worm], [1, Worm])).processAll();
      expect(Array.from(rolledStateEvaluator.evaluation!.toFixed().minimumResultOccurrences.entries()).filter(([total]) => total <= 5)).toEqual(
        [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]
      );
    });
  });
});
