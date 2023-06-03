import React, {Component} from "react";
import {Die} from "./Die";
import * as worms from "../worms";
import _ from "underscore";

interface RChestProps {
  tiny?: boolean,
  small?: boolean,
  medium?: boolean,
  chest: worms.Chest,
  remainingDice: number,
}

export class RChest extends Component<RChestProps> {
  render() {
    const {tiny = true, small, medium, chest, remainingDice} = this.props;
    const sizeProps = {tiny, small, medium};
    return (
      <div className={"dice"}>
        {chest.dice.map((roll, index) => (
          <Die key={index} face={roll} special={roll === worms.Worm} {...sizeProps} />
        ))}
        {_.range(remainingDice).map(index => (
          <Die key={index} face={""} {...sizeProps} />
        ))}
        {!chest.diceCount && !remainingDice ? (
          "No Dice Aside"
        ) : null}
      </div>
    );
  }
}
