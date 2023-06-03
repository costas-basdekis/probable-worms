import React, {ChangeEvent, Component, ReactNode} from "react";
import * as worms from "../worms";
import {Button, Header, Modal} from "semantic-ui-react";
import _ from "underscore";
import {RChest} from "./RChest";
import {DiceSelector} from "./DiceSelector";
import {Chest, DiceRoll} from "../worms";
import {DieSize} from "./Die";

interface InitialStateSelectorProps {
  size?: DieSize,
  initialChest: worms.Chest;
  diceCount: number;
  remainingDice: number;
  onDiceChange?: (roll: DiceRoll, remainingDice: number) => void,
  onDiceCountChange?: (diceCount: number) => void,
}

export class InitialStateSelector extends Component<InitialStateSelectorProps> {
  render() {
    const {size, initialChest, diceCount, remainingDice} = this.props;
    return <>
      <Header>Initial Chest</Header>
      <br/>
      <DiceSelector counts={initialChest.diceCounts} count={diceCount} size={size} onChange={this.props.onDiceChange} />
      <label>
        Dice count:
        <select value={diceCount} onChange={this.onDiceCountChange}>
          {_.range(11).map(count => <option key={count} value={count}>{count}</option>)}
        </select>
      </label>
      <RChest chest={initialChest} remainingDice={remainingDice} size={size} />
    </>;
  }

  onDiceCountChange = ({target: {value}}: ChangeEvent<HTMLSelectElement>) => {
    this.props.onDiceCountChange?.(parseInt(value, 10));
  };
}

interface InitialStateModalState {
  open: boolean,
  initialChest: worms.Chest,
  diceCount: number,
  remainingDice: number,
}

interface InitialStateModalProps {
  size?: DieSize,
  trigger: ReactNode,
  onChangeInitialState: (state: worms.UnrolledState) => void,
}

export class InitialStateModal extends Component<InitialStateModalProps, InitialStateModalState> {
  state = {
    open: false,
    initialChest: worms.Chest.initial(),
    diceCount: 8,
    remainingDice: 8,
  };

  render() {
    const {open, initialChest, diceCount, remainingDice} = this.state;
    const {size, trigger} = this.props;
    return (
      <Modal
        onClose={this.onClose}
        onOpen={this.onOpen}
        open={open}
        trigger={trigger}
        size={"tiny"}
      >
        <Modal.Header>Change initial state</Modal.Header>
        <Modal.Content>
          <InitialStateSelector
            initialChest={initialChest}
            diceCount={diceCount}
            remainingDice={remainingDice}
            onDiceChange={this.onDiceChange}
            onDiceCountChange={this.onDiceCountChange}
            size={size}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button color='black' onClick={this.onClose}>
            Cancel
          </Button>
          <Button
            content={"Update"}
            // labelPosition={"right"}
            // icon={"checkmark"}
            onClick={this.onChangeInitialState}
            positive
          />
        </Modal.Actions>
      </Modal>
    )
  }

  onOpen = () => {
    this.setState({open: true});
  };

  onClose = () => {
    this.setState({open: false});
  };

  onChangeInitialState = () => {
    const {initialChest, remainingDice} = this.state;
    this.props.onChangeInitialState(new worms.UnrolledState(initialChest, remainingDice));
    this.onClose();
  };

  onDiceChange = (diceCounts: DiceRoll, remainingDice: number) => {
    this.setState({
      initialChest: Chest.fromDiceRoll(diceCounts),
      remainingDice,
    });
  };

  onDiceCountChange = (diceCount :number) => {
    this.setState({diceCount});
  };
}
