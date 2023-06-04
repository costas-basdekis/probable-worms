import React, {Component} from "react";
import {Die, DieSize} from "./Die";
import _ from "underscore";
import {rollResults, RollResult, Worm, DiceRoll} from "../worms";

interface DiceSelectorProps {
  excludedFaces?: RollResult[],
  counts?: DiceRoll,
  count: number,
  size?: DieSize,
  onChange?: (roll: DiceRoll, remainingDice: number) => void,
}

interface DiceSelectorState {
  count: number,
  counts: DiceRoll,
}

export class DiceSelector extends Component<DiceSelectorProps, DiceSelectorState> {
  state = {
    count: this.props.count,
    counts: this.props.counts?.copy() ?? new DiceRoll(),
  };

  componentDidUpdate(prevProps: DiceSelectorProps) {
    if (this.props.counts && this.props.counts !== prevProps.counts) {
      this.setState({counts: this.props.counts});
    }
    if ((this.props.count !== this.state.count) || (this.props.counts && this.props.counts !== prevProps.counts)) {
      this.setState({
        count: this.props.count,
      });
      this.setState(({counts}) => {
        if (this.props.count >= counts.diceCount) {
          return null;
        }
        const newCounts: DiceRoll = counts.copy();
        let remainingCount = this.props.count;
        for (const die of rollResults) {
          const limitedCount = Math.min(remainingCount, newCounts.get(die));
          remainingCount -= limitedCount;
          newCounts.replace(die, limitedCount);
        }
        return {counts: newCounts};
      });
    }
  }

  render() {
    const {counts} = this.state;
    const {excludedFaces = [], size} = this.props;
    const remainingDice = this.getRemainingDice();
    return (
      <div className={"dice"}>
        {rollResults.map(die => (
          <div key={die} className={"dice-column"}>
            <Die size={size} selected={counts.get(die) === 0} disabled={excludedFaces.includes(die)} face={excludedFaces.includes(die) ? die : undefined} onClick={this.makeOnClick(die, 0)} />
            {!excludedFaces.includes(die) ? _.range(Math.min(remainingDice + counts.get(die))).map(index => (
              <Die key={index} face={die} special={die === Worm} size={size} selected={counts.get(die) >= (index + 1)} onClick={this.makeOnClick(die, index + 1)} />
            )) : null}
          </div>
        ))}
      </div>
    );
  }

  getRemainingDice(): number {
    const {count, counts} = this.state;
    return Math.max(0, count - counts.diceCount);
  }

  makeOnClick(die: RollResult, count: number) {
    return () => {
      this.setState(({counts}) => ({
        counts: counts.replacing(die, count),
      }), () => {
        this.props.onChange?.(this.state.counts, this.getRemainingDice());
      });
    }
  }
}
