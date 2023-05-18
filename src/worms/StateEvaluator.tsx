import {Evaluation} from "./Evaluation";
import {RolledState} from "./RolledState";
import {RolledStateEvaluator} from "./RolledStateEvaluator";
import {State} from "./State";

export class StateEvaluator {
  state: State;
  nextRolledStates: {rolledState: RolledState, count: number, evaluator: RolledStateEvaluator | null}[];
  evaluation: Evaluation | null = null;

  static fromState(state: State): StateEvaluator {
    const nextRolledStates = state.getNextRolledStates();
    return new StateEvaluator(
      state,
      nextRolledStates.map(nextRolledState => ({...nextRolledState, evaluator: null})),      
    );
  }

  constructor(state: State, nextRolledStates: {rolledState: RolledState, count: number, evaluator: RolledStateEvaluator | null}[]) {
    this.state = state;
    this.nextRolledStates = nextRolledStates;
  }

  processAll(): StateEvaluator {
    while (this.processOne()) {
      //
    }
    return this!;
  }

  processOne(): boolean {
    if (this.evaluation) {
      return false;
    }
    for (const nextRolledState of this.nextRolledStates) {
      if (nextRolledState.evaluator?.evaluation) {
        continue;
      }
      if (!nextRolledState.evaluator) {
        nextRolledState.evaluator = RolledStateEvaluator.fromRolledState(nextRolledState.rolledState);
      }
      nextRolledState.evaluator.processOne();
      return true;
    }
    const totalCount = this.nextRolledStates.reduce((total, current) => total + current.count, 0);
    this.evaluation = Evaluation.combineProbabilities(
      this.nextRolledStates.map(
        ({evaluator, count}) => ({evaluation: evaluator!.evaluation!, ratio: count / totalCount}))
    );
    return false;
  }
}
