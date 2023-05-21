import {State} from "./State";
import {Chest} from "./Chest";
import {DiceRoll} from "./DiceRoll";
import {rollResults, Worm} from "./RollResult";

describe("State", () => {
  describe("getNextStates", () => {
    it("gets no next states for state with 0 remaining dice", () => {
      expect(new State(Chest.initial(), 0).getNextRolledStates()).toEqual([]);
    });
    it("gets one state for each die side for state with 1 remaining die", () => {
      expect(new State(Chest.initial(), 1).getNextRolledStates()).toEqual([
        {rolledState: new State(Chest.initial(), 1).withRoll(DiceRoll.fromDice([1])), count: 1},
        {rolledState: new State(Chest.initial(), 1).withRoll(DiceRoll.fromDice([2])), count: 1},
        {rolledState: new State(Chest.initial(), 1).withRoll(DiceRoll.fromDice([3])), count: 1},
        {rolledState: new State(Chest.initial(), 1).withRoll(DiceRoll.fromDice([4])), count: 1},
        {rolledState: new State(Chest.initial(), 1).withRoll(DiceRoll.fromDice([5])), count: 1},
        {rolledState: new State(Chest.initial(), 1).withRoll(DiceRoll.fromDice([Worm])), count: 1},
      ]);
    });
    it("gets one state for each die side that wasn't picked already for state with 1-wide chest and 1 remaining die", () => {
      expect(new State(new Chest(DiceRoll.fromDice([1]), false), 1).getNextRolledStates()).toEqual([
        {rolledState: new State(Chest.fromDice([1]), 1).withRoll(DiceRoll.fromDice([1])), count: 1},
        {rolledState: new State(Chest.fromDice([1]), 1).withRoll(DiceRoll.fromDice([2])), count: 1},
        {rolledState: new State(Chest.fromDice([1]), 1).withRoll(DiceRoll.fromDice([3])), count: 1},
        {rolledState: new State(Chest.fromDice([1]), 1).withRoll(DiceRoll.fromDice([4])), count: 1},
        {rolledState: new State(Chest.fromDice([1]), 1).withRoll(DiceRoll.fromDice([5])), count: 1},
        {rolledState: new State(Chest.fromDice([1]), 1).withRoll(DiceRoll.fromDice([Worm])), count: 1},
      ]);
    });
    it("gets one state for each unique 2-dice combination for state with 2 remaining dice", () => {
      expect(new State(Chest.initial(), 2).getNextRolledStates()).toEqual(
        rollResults.map(die1 => rollResults.filter(die2 => die2 >= die1 || die2 === "W").map(die2 => [die1, die2])).flat()
        .map(([die1, die2]) => ({diceRoll: DiceRoll.fromDice([die1, die2]), count: die1 === die2 ? 1 : 2}))
        .map(({diceRoll, count}) => ({
          rolledState: new State(Chest.initial(), 2).withRoll(diceRoll),
          count,
        }))
      );
    });
  });
});
