import {RolledStateEvaluator} from "./RolledStateEvaluator";
import {State} from "./State";
import {RolledState} from "./RolledState";
import {Chest} from "./Chest";
import {DiceRoll} from "./DiceRoll";
import {Evaluation} from "./Evaluation";
import {Results} from "./Results";
import {Worm} from "./RollResult";
import _ from "underscore";

describe("RolledStateEvaluator", () => {
  describe("getCacheKey", () => {
    it("returns the cache key for an empty state with 1 rolled die", () => {
      expect(RolledStateEvaluator.fromRolledState(new RolledState(new State(Chest.initial(), 1), DiceRoll.fromDice([1]))).getCacheKey()).toEqual(
        "Rcd1,1"
      );
    });
    it("returns the cache key for a state with many rolled die", () => {
      expect(RolledStateEvaluator.fromRolledState(new RolledState(new State(Chest.fromDice([1, 1, 2, 2, 3, 3]), 3), DiceRoll.fromDice([1, 1, 3]))).getCacheKey()).toEqual(
        "Rc1,2,3d1,2,3,1"
      );
    });
  });
  describe("processAll", () => {
    it("processes an empty state with 1 non-worm rolled die", () => {
      expect(RolledStateEvaluator.fromRolledState(new RolledState(new State(Chest.initial(), 1), DiceRoll.fromDice([1]))).processAll().evaluation).toEqual(
        new Evaluation(new Results(), new Results([[0, 1]]))
      );
    });
    it("processes an empty state with 1 worm rolled die", () => {
      expect(RolledStateEvaluator.fromRolledState(new RolledState(new State(Chest.initial(), 1), DiceRoll.fromDice([Worm]))).processAll().evaluation).toEqual(
        new Evaluation(new Results(_.range(1, 6).map(total => [total, 1])), new Results([[5, 1]]))
      );
    });
    it("processes an empty state with 2 doubled non-worm rolled dice", () => {
      expect(RolledStateEvaluator.fromRolledState(new RolledState(new State(Chest.initial(), 2), DiceRoll.fromDice([1, 1]))).processAll().evaluation).toEqual(
        new Evaluation(new Results(), new Results([[0, 1]]))
      );
    });
    it("processes an empty state with 2 doubled worm rolled dice", () => {
      expect(RolledStateEvaluator.fromRolledState(new RolledState(new State(Chest.initial(), 2), DiceRoll.fromDice([Worm, Worm]))).processAll().evaluation).toEqual(
        new Evaluation(new Results(_.range(1, 11).map(total => [total, 1])), new Results([[10, 1]]))
      );
    });
  });
});
