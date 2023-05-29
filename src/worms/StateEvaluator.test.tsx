import {StateEvaluator} from "./StateEvaluator";
import {State} from "./State";
import {Chest} from "./Chest";
import {Evaluation} from "./Evaluation";
import {Results} from "./Results";
import _ from "underscore";
import {Worm} from "./RollResult";

describe("StateEvaluator", () => {
  describe("getCacheKey", () => {
    it("returns the cache key for an empty state with no future states", () => {
      expect(StateEvaluator.fromState(new State(Chest.initial(), 0)).getCacheKey()).toEqual("St0cr0");
    });
    it("returns the cache key for an state with future states", () => {
      expect(StateEvaluator.fromState(new State(Chest.fromDice([1, 1, 2, 3]), 4)).getCacheKey()).toEqual("St7c1,2,3r4");
    });
  });
  describe("processAll", () => {
    it("processes an empty state with no future states", () => {
      expect(StateEvaluator.fromState(new State(Chest.initial(), 0)).processAll().evaluation).toEqual(
        new Evaluation(new Results(), new Results([[0, 1]]))
      );
    });
    it("processes an empty state with 1 die remaining", () => {
      expect(StateEvaluator.fromState(new State(Chest.initial(), 1)).processAll().evaluation!.toFixed()).toEqual(
        new Evaluation(
          new Results(_.range(1, 6).map(total => [total, 1 / 6])),
          new Results([[0, 1], [5, 1 / 6]]),
        ).toFixed()
      );
    });
    it("processes a state with 1 non-worm die picked and 1 die remaining", () => {
      expect(StateEvaluator.fromState(new State(Chest.fromDice([1]), 1)).processAll().evaluation!.toFixed()).toEqual(
        new Evaluation(
          new Results(_.range(1, 7).map(total => [total, 1 / 6])),
          new Results([[0, 1], [6, 1 / 6]]),
        ).toFixed()
      );
    });
    it("processes a state with 1 worm die picked and 1 die remaining", () => {
      expect(StateEvaluator.fromState(new State(Chest.fromDice([Worm]), 1)).processAll().evaluation!.toFixed()).toEqual(
        new Evaluation(
          new Results([..._.range(1, 6).map(total => [total, 1] as [number, number]), [5, 6 / 6], [6, 5 / 6], [7, 4 / 6], [8, 3 / 6], [9, 2 / 6], [10, 1 / 6]]),
          new Results([[5, 1], [6, 1 / 6], [7, 1 / 6], [8, 1 / 6], [9, 1 / 6], [10, 1 / 6]]),
        ).toFixed()
      );
    });
    it("processes an empty state with 2 dice remaining", () => {
      // noinspection PointlessArithmeticExpressionJS,DuplicatedCode
      expect(StateEvaluator.fromState(new State(Chest.initial(), 2)).processAll().evaluation!.exactResultOccurrences.toFixed()).toEqual(
        new Results([
          [0, 1],
          // Calculation if we couldn't stop
          // [0, (
          //   5 / 6 * 1 / 6/*([^W]\1)*/
          //   + 5 / 6 * 4 / 6 * 5 / 6 /*([^W])[^\1\W]+([^\W])*/
          //   + 5 / 6 * 1 / 6 * 5 / 6 /*([^W])W+([^\W])*/
          //   + 1 / 6 * 5 / 6 * 5 / 6 /*W([^W])+([^\W])*/
          // )],
          [5, (
            1 / 6 * 5 / 6 /*(W)[^W]*/
            + 5 / 6 * 1 / 6 /*[^W](W)*/
          )],
          [6, (
            1 / 6 * 5 / 6 * 1 / 6 /*(W)[^W]+(1)*/
            + 5 / 6 * 1 / 6 * 1 / 6 /*[^W](W)+(1)*/
            + 1 / 6 * 4 / 6 * 1 / 6 /*(1)[^4W]+(W)*/
            + 4 / 6 * 1 / 6 * 1 / 6 /*[^4W](1)+(W)*/
          )],
          [7, (
            1 / 6 * 5 / 6 * 1 / 6 /*(W)[^W]+(2)*/
            + 5 / 6 * 1 / 6 * 1 / 6 /*[^W](W)+(2)*/
            + 1 / 6 * 4 / 6 * 1 / 6 /*(2)[^2W]+(W)*/
            + 4 / 6 * 1 / 6 * 1 / 6 /*[^2W](2)+(W)*/
          )],
          [8, (
            1 / 6 * 5 / 6 * 1 / 6 /*(W)[^W]+(3)*/
            + 5 / 6 * 1 / 6 * 1 / 6 /*[^W](W)+(3)*/
            + 1 / 6 * 4 / 6 * 1 / 6 /*(3)[^3W]+(W)*/
            + 4 / 6 * 1 / 6 * 1 / 6 /*[^3W](3)+(W)*/
          )],
          [9, (
            1 / 6 * 5 / 6 * 1 / 6 /*(W)[^W]+(4)*/
            + 5 / 6 * 1 / 6 * 1 / 6 /*[^W](W)+(4)*/
            + 1 / 6 * 4 / 6 * 1 / 6 /*(4)[^4W]+(W)*/
            + 4 / 6 * 1 / 6 * 1 / 6 /*[^4W](4)+(W)*/
          )],
          [10, (
            1 / 6 * 1 / 6 * 1 /*(WW)*/
            + 1 / 6 * 5 / 6 * 1 / 6 /*(W)[^W]+(5)*/
            + 5 / 6 * 1 / 6 * 1 / 6 /*[^W](W)+(5)*/
            + 1 / 6 * 4 / 6 * 1 / 6 /*(5)[^5W]+(W)*/
            + 4 / 6 * 1 / 6 * 1 / 6 /*[^5W](5)+(W)*/
          )],
        ]).toFixed()
      );
    });
  });
});
