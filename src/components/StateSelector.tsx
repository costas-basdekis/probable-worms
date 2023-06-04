import React, {ChangeEvent, Component} from "react";
import {Grid, Header} from "semantic-ui-react";
import {DiceSelector} from "./DiceSelector";
import _ from "underscore";
import {RChest} from "./RChest";
import {Chest, DiceRoll, RolledState, UnrolledState} from "../worms";
import {DieSize} from "./Die";
import {createSelector} from "reselect";

interface StateSelectorProps {
  initialState: UnrolledState | RolledState,
  onStateChange?: (state: UnrolledState | RolledState) => void,
  size?: DieSize,
}

interface StateSelectorState {
  diceCount: number,
  pickedDice: DiceRoll,
  unrolledDiceCount: number,
  rolledDice: DiceRoll,
}

export class StateSelector extends Component<StateSelectorProps, StateSelectorState> {
  state = {
    diceCount: this.props.initialState.totalDiceCount,
    pickedDice: this.props.initialState.pickedDice,
    unrolledDiceCount: this.props.initialState.totalDiceCount - this.props.initialState.pickedDice.diceCount,
    rolledDice: this.props.initialState.rolledDice ?? new DiceRoll(),
  };

  unrolledChestSelector = createSelector(
    ({pickedDice}: StateSelectorState) => pickedDice,
    (pickedDice): Chest => {
      return Chest.fromDiceRoll(pickedDice);
    },
  );

  get unrolledChest(): Chest {
    return this.unrolledChestSelector(this.state);
  }

  render () {
    const {unrolledChest} = this;
    const {size = "tiny"} = this.props;
    const {diceCount, pickedDice, unrolledDiceCount, rolledDice} = this.state;
    return (
      <Grid columns={2} divided>
        <Grid.Row>
          <Grid.Column>
            <Header>Picked dice</Header>
            <br/>
            <DiceSelector counts={pickedDice} count={diceCount} size={size} onChange={this.onPickedDiceChange}/>
            <label>
              Dice count:
              <select value={diceCount} onChange={this.onDiceCountChange}>
                {_.range(11).map(count => <option key={count} value={count}>{count}</option>)}
              </select>
            </label>
            <RChest chest={unrolledChest} remainingDice={unrolledDiceCount} size={size}/>
          </Grid.Column>
          <Grid.Column>
            <Header>Roll</Header>
            <br/>
            <DiceSelector excludedFaces={pickedDice.getFaces()} counts={rolledDice} count={unrolledDiceCount} size={size} onChange={this.onRolledDiceChange}/>
            <RChest chest={Chest.fromDiceRoll(rolledDice)} remainingDice={unrolledDiceCount - rolledDice.diceCount} size={size}/>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }

  onDiceCountChange = (ev: ChangeEvent<HTMLSelectElement>) => {
    const diceCount = parseInt(ev.target.value, 10);
    this.setState(({pickedDice, rolledDice}) => {
      const newPickedDice = pickedDice.limitToCount(diceCount);
      const unrolledDiceCount = diceCount - newPickedDice.diceCount;
      const newRolledDice = rolledDice.limitToFaces(newPickedDice.getOppositeFaces()).limitToCount(unrolledDiceCount);
      return {
        diceCount,
        pickedDice: newPickedDice,
        unrolledDiceCount,
        rolledDice: newRolledDice,
      };
    }, this.triggerOnStateChange);
  };

  onPickedDiceChange = (roll: DiceRoll, remainingDice: number) => {
    this.setState(({rolledDice}) => ({
      pickedDice: roll,
      unrolledDiceCount: remainingDice,
      rolledDice: rolledDice.limitToFaces(roll.getOppositeFaces()).limitToCount(remainingDice),
    }), this.triggerOnStateChange);
  };

  onRolledDiceChange = (roll: DiceRoll) => {
    this.setState({
      rolledDice: roll,
    }, this.triggerOnStateChange);
  };

  triggerOnStateChange = () => {
    const {unrolledChest} = this;
    const {unrolledDiceCount, rolledDice} = this.state;
    const rolledDiceCount = rolledDice.diceCount;
    if (rolledDiceCount === unrolledDiceCount || rolledDiceCount === 0) {
      const unrolledState = new UnrolledState(unrolledChest, unrolledDiceCount);
      let state: UnrolledState | RolledState;
      if (rolledDiceCount) {
        state = new RolledState(unrolledState, rolledDice);
      } else {
        state = unrolledState;
      }
      this.props.onStateChange?.(state);
    }
  }
}