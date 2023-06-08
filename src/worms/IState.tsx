import {DiceRoll} from "./DiceRoll";
import type {UnrolledState} from "./UnrolledState";

export interface IState {
  unrolledState: UnrolledState
  pickedDice: DiceRoll;
  rolledDice: DiceRoll | null;
  runningTotal: number;
  total: number;
  totalDiceCount: number;
  selectedDiceCount: number;
  remainingDiceCount: number;
}
