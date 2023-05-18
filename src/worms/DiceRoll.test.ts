import {DiceRoll, Worm} from ".";

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
});
