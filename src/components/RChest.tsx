import React, {Component} from "react";
import {Die, DieSize} from "./Die";
import * as worms from "../worms";
import _ from "underscore";
import classNames from "classnames";

interface RChestProps {
  size?: DieSize,
  chest: worms.Chest,
  remainingDice: number,
  center?: boolean,
}

export class RChest extends Component<RChestProps> {
  render() {
    const {size = "tiny", chest, remainingDice, center = false} = this.props;
    return (
      <div className={classNames("dice", {center})}>
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
