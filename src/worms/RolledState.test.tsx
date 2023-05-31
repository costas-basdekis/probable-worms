import {Chest, DiceRoll, Results, ResultState, RolledState, State, Worm} from "./index";

describe("RolledState", () => {
  describe("getNextStates", () => {
    it("gets next states for first 1-die roll", () => {
      expect(new RolledState(State.fromDice([], 1), DiceRoll.fromDice([Worm])).getNextStates()).toEqual({
        results: new ResultState(State.fromDice([], 1), new Results([[5, 1]])),
        nextStates: [
        ],
      });
    });
    it("gets next states for first 2-die roll", () => {
      expect(new RolledState(State.fromDice([], 2), DiceRoll.fromDice([1, Worm])).getNextStates()).toEqual({
        results: new ResultState(State.fromDice([], 2), new Results()),
        nextStates: [
          {state: State.fromDice([1], 1), pickedRoll: 1, pickedCount: 1, ratio: 0.5},
          {state: State.fromDice([Worm], 1), pickedRoll: Worm, pickedCount: 1, ratio: 0.5},
        ],
      });
    });
    it("gets next states for second 2-die roll, with 2 new rolls", () => {
      expect(new RolledState(State.fromDice([2], 2), DiceRoll.fromDice([1, Worm])).getNextStates()).toEqual({
        results: new ResultState(State.fromDice([2], 2), new Results()),
        nextStates: [
          {state: State.fromDice([2], 2).add(1, 1), pickedRoll: 1, pickedCount: 1, ratio: 0.5},
          {state: State.fromDice([2], 2).add(Worm, 1), pickedRoll: Worm, pickedCount: 1, ratio: 0.5},
        ],
      });
    });
    it("gets next states for second 2-die roll, with 1 double new roll", () => {
      expect(new RolledState(State.fromDice([2], 2), DiceRoll.fromDice([Worm, Worm])).getNextStates()).toEqual({
        results: new ResultState(State.fromDice([2], 2), new Results([[12, 1]])),
        nextStates: [
        ],
      });
    });
    it("gets next states for second 2-die roll, with a new roll and a duplicate roll", () => {
      expect(new RolledState(State.fromDice([2], 2), DiceRoll.fromDice([2, Worm])).getNextStates()).toEqual({
        results: new ResultState(State.fromDice([2], 2), new Results([[0, 0.5]])),
        nextStates: [
          {state: State.fromDice([2, Worm], 1), pickedRoll: Worm, pickedCount: 1, ratio: 0.5},
        ],
      });
    });
    it("gets next states for second 2-die roll, with 1 double duplicate roll", () => {
      expect(new RolledState(State.fromDice([2], 2), DiceRoll.fromDice([2, 2])).getNextStates()).toEqual({
        results: new ResultState(State.fromDice([2], 2), new Results([[0, 1]])),
        nextStates: [
        ],
      });
    });
  });
});
