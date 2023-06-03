import React, {Component} from "react";
import {Die, DieSize} from "./Die";
import * as worms from "../worms";
import _ from "underscore";

interface RChestProps {
  size?: DieSize,
  chest: worms.Chest,
  remainingDice: number,
}

export class RChest extends Component<RChestProps> {
  render() {
    const {size = "tiny", chest, remainingDice} = this.props;
    return (
      <div className={"dice"}>
        {chest.dice.map((roll, index) => (
          <Die key={index} face={roll} special={roll === worms.Worm} size={size} />
        ))}
        {_.range(remainingDice).map(index => (
          <Die key={index} face={""} size={size} />
        ))}
        {!chest.diceCount && !remainingDice ? (
          "No Dice Aside"
        ) : null}
      </div>
    );
  }
}
