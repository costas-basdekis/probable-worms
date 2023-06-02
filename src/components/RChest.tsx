import React, {Component} from "react";
import {Die} from "./Die";
import * as worms from "../worms";
import _ from "underscore";

interface RChestProps {
  chest: worms.Chest,
  remainingDice: number,
}

export class RChest extends Component<RChestProps> {
  render() {
    const {chest, remainingDice} = this.props;
    return (
      <div className={"dice"}>
        {chest.dice.map((roll, index) => (
          <Die key={index} face={roll} special={roll === worms.Worm} tiny/>
        ))}
        {_.range(remainingDice).map(index => (
          <Die key={index} face={""} tiny/>
        ))}
        {!chest.diceCount && !remainingDice ? (
          "No Dice Aside"
        ) : null}
      </div>
    );
  }
}