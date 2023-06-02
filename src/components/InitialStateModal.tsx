import React, {ChangeEvent, Component, ReactNode} from "react";
import * as worms from "../worms";
import {Button, Header, Modal} from "semantic-ui-react";
import _ from "underscore";
import {RChest} from "./RChest";

interface InitialCountSelectProps {
  initialChest: worms.Chest,
  roll: worms.RollResult,
  onChange: (face: worms.RollResult, count: number) => void,
}

class InitialCountSelect extends Component<InitialCountSelectProps> {
  render() {
    const {initialChest, roll} = this.props;
    return (
      <label>
        {roll}:
        <select value={initialChest.get(roll)} onChange={this.onChange}>
          {_.range(11).map(count => <option key={count} value={count}>{count}</option>)}
        </select>
      </label>
    );
  }

  onChange = ({target: {value}}: ChangeEvent<HTMLSelectElement>) => {
    this.props.onChange(this.props.roll, parseInt(value, 10));
  };
}

interface InitialStateModalProps {
  trigger: ReactNode,
  onChangeInitialState: (state: worms.UnrolledState) => void,
}

interface InitialStateModalState {
  open: boolean,
  initialChest: worms.Chest,
  remainingDice: number,
}

export class InitialStateModal extends Component<InitialStateModalProps, InitialStateModalState> {
  state = {
    open: false,
    initialChest: worms.Chest.initial(),
    remainingDice: 8,
  };

  render() {
    const {open, initialChest, remainingDice} = this.state;
    const {trigger} = this.props;
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
          <Header>Initial Chest</Header>
          <br/>
          {worms.rollResults.map(face => (
            <InitialCountSelect
              key={face}
              initialChest={initialChest}
              roll={face}
              onChange={this.onInitialChestCountChange}
            />
          ))}
          <label>
            Remaining:
            <select value={remainingDice} onChange={this.onRemainingDiceChange}>
              {_.range(11).map(count => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <RChest chest={initialChest} remainingDice={remainingDice}/>
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

  onInitialChestCountChange = (roll: worms.RollResult, count: number) => {
    this.setState(({initialChest, remainingDice}) => {
      const newInitialChest = initialChest.replacing(roll, count);
      return {
        initialChest: newInitialChest,
        remainingDice: Math.max(0, Math.min(10, initialChest.diceCount + remainingDice - newInitialChest.diceCount)),
      };
    });
  };

  onRemainingDiceChange = ({target: {value}}: ChangeEvent<HTMLSelectElement>) => {
    this.setState({remainingDice: parseInt(value, 10)});
  };
}
