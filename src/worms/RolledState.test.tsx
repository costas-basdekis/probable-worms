import {RolledState, UnrolledState, Worm} from "./index";

describe("RolledState", () => {
  describe("getNextUnrolledStates", () => {
    it("gets next states for first 1-die roll", () => {
      expect(RolledState.fromDice([], [Worm]).getNextUnrolledStates()).toEqual([
        UnrolledState.fromDice([Worm], 0),
      ]);
    });
    it("gets next states for first 2-die roll", () => {
      expect(RolledState.fromDice([], [1, Worm]).getNextUnrolledStates()).toEqual([
        UnrolledState.fromDice([1], 1),
        UnrolledState.fromDice([Worm], 1),
      ]);
    });
    it("gets next states for second 2-die roll, with 2 new rolls", () => {
      expect(RolledState.fromDice([2], [1, Worm]).getNextUnrolledStates()).toEqual([
        UnrolledState.fromDice([1, 2], 1),
        UnrolledState.fromDice([2, Worm], 1),
      ]);
    });
    it("gets next states for second 2-die roll, with 1 double new roll", () => {
      expect(RolledState.fromDice([2], [Worm, Worm]).getNextUnrolledStates()).toEqual([
        UnrolledState.fromDice([2, Worm, Worm], 0),
      ]);
    });
    it("gets next states for second 2-die roll, with a new roll and a duplicate roll", () => {
      expect(RolledState.fromDice([2], [2, Worm]).getNextUnrolledStates()).toEqual([
        UnrolledState.fromDice([2, Worm], 1),
      ]);
    });
    it("gets next states for second 2-die roll, with 1 double duplicate roll", () => {
      expect(RolledState.fromDice([2], [2, 2]).getNextUnrolledStates()).toEqual([
        UnrolledState.fromDice([2], 0),
      ]);
    });
  });
});
