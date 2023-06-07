import {DiceRoll} from "./DiceRoll";

export interface IState {
  pickedDice: DiceRoll;
  rolledDice: DiceRoll | null;
  runningTotal: number;
  total: number;
  totalDiceCount: number;
  selectedDiceCount: number;
  remainingDiceCount: number;
}
