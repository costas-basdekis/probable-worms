import React, {Component} from "react";
import {Chest, State} from "../worms";
import {RChest} from "./RChest";
import {DieSize} from "./Die";

interface RSTateProps {
  state: State,
  size?: DieSize,
  center?: boolean,
}

export class RState extends Component<RSTateProps> {
  render() {
    const {state, size, center = false} = this.props;
    switch (state.type) {
      case "unrolled": {
        return (
          <RChest size={size} chest={state.chest} remainingDice={state.totalDiceCount - state.selectedDiceCount} center={center} />
        );
      }
      case "rolled": {
        return <div className={"state"}>
          <RChest size={size} chest={state.unrolledState.chest} remainingDice={0} />
          +
          <RChest size={size} chest={Chest.fromDiceRoll(state.diceRoll)} remainingDice={0} />
        </div>;
        }
      default:
        throw new Error("Unknown state type");
    }
  }
}
