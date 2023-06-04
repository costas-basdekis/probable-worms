import {DiceRoll} from "./DiceRoll";

export interface State {
  pickedDice: DiceRoll;
  rolledDice: DiceRoll | null;
  total: number;
  totalDiceCount: number;
  selectedDiceCount: number;
}
