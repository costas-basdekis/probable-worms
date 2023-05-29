import {DiceRoll, rollResults, Worm} from "./index";
import _ from "underscore";

describe("DiceRoll", () => {
  describe("fromDice", () => {
    it("properly creates an empty roll", () => {
      expect(DiceRoll.fromDice([])).toEqual(new DiceRoll());
    });
    it("properly creates an roll from 3 different dice", () => {
      expect(DiceRoll.fromDice([1, 2, 3])).toEqual(new DiceRoll([[1, 1], [2, 1], [3, 1]]));
    });
    it("properly creates an roll from 3 same dice", () => {
      expect(DiceRoll.fromDice([1, 1, 1])).toEqual(new DiceRoll([[1, 3]]));
    });
    it("properly creates an roll from a mix of dice", () => {
      expect(DiceRoll.fromDice([1, 2, 1, 2, 1, 3, Worm])).toEqual(new DiceRoll([[1, 3], [2, 2], [3, 1], [Worm, 1]]));
    });
  });

  describe("getNextRolls", () => {
    it("gets one of each side for a 1-die roll", () => {
      expect(DiceRoll.getNextRolls(1)).toEqual(
        rollResults.map(die => ({diceRoll: DiceRoll.fromDice([die]), count: 1}))
      );
    });
    it("gets one of each double-roll and 2 of each non-double-roll for a 2-dice roll", () => {
      expect(DiceRoll.getNextRolls(2)).toEqual(
        rollResults.map(die1 => rollResults.filter(die2 => die2 >= die1 || die2 === "W").map(die2 => [die1, die2])).flat()
        .map(([die1, die2]) => ({diceRoll: DiceRoll.fromDice([die1, die2]), count: die1 === die2 ? 1 : 2}))
      );
    });
    it("gets one of each triple-roll, 3 of each double-roll, and 6 for each other roll, for a 3-dice roll", () => {
      expect(DiceRoll.getNextRolls(3)).toEqual(
        rollResults.map(die1 => rollResults.filter(die2 => die2 >= die1 || die2 === "W").map(die2 => rollResults.filter(die3 => die3 >= die2 || die3 === "W").map(die3 => [die1, die2, die3]))).flat(2)
        .map(([die1, die2, die3]) => ({
          diceRoll: DiceRoll.fromDice([die1, die2, die3]),
          count: (die1 === die2 && die2 === die3) ? 1 : (die1 === die2 || die1 === die3 || die2 === die3) ? 3 : 6,
        }))
      );
    });
  });

  describe("dice", () => {
    it("returns no dice for empty roll", () => {
      expect(DiceRoll.fromDice([]).dice).toEqual([]);
    });
    it("returns 1 die for 1 die", () => {
      expect(DiceRoll.fromDice([1]).dice).toEqual([1]);
    });
    it("returns as many dice of one face", () => {
      expect(DiceRoll.fromDice([1, 1, 1]).dice).toEqual([1, 1, 1]);
    });
    it("returns as many dice of many faces", () => {
      expect(DiceRoll.fromDice([1, 1, 1, 2, 2, 3, Worm, Worm]).dice).toEqual([1, 1, 1, 2, 2, 3, Worm, Worm]);
    });
  });

  describe("key", () => {
    it("returns an empty key for an empty roll", () => {
      expect(DiceRoll.fromDice([]).key).toEqual("[]");
    });
    it("returns a nested list of sorted dice pairs", () => {
      expect(DiceRoll.fromDice([1, 2, 3, 1, 2, 3]).key).toEqual("[[1,2],[2,2],[3,2]]")
      expect(DiceRoll.fromDice([3, 3, 2, 2, 1, 1]).key).toEqual("[[1,2],[2,2],[3,2]]")
    });
  });
});
