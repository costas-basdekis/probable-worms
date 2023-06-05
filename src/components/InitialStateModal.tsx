import React, {Component, createRef, ReactNode, RefObject} from "react";
import * as worms from "../worms";
import {Button, Modal} from "semantic-ui-react";
import {DieSize} from "./Die";
import {StateSelector} from "./StateSelector";

interface InitialStateModalState {
  open: boolean,
  state: worms.State,
}

interface InitialStateModalProps {
  size?: DieSize,
  trigger: ReactNode,
  onStateChange: (state: worms.State) => void,
}

export class InitialStateModal extends Component<InitialStateModalProps, InitialStateModalState> {
  stateSelectorRef: RefObject<StateSelector> = createRef();

  state = {
    open: false,
    state: worms.UnrolledState.initial(),
  };

  render() {
    const {open, state} = this.state;
    const {size, trigger} = this.props;
    return (
      <Modal
        onClose={this.onClose}
        onOpen={this.onOpen}
        open={open}
        trigger={trigger}
        size={"mini"}
      >
        <Modal.Header>Change initial state</Modal.Header>
        <Modal.Content>
          <StateSelector
            ref={this.stateSelectorRef}
            initialState={state}
            onStateChange={this.onStateChange}
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
            onClick={this.onAccept}
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

  onAccept = () => {
    const {state} = this.state;
    this.props.onStateChange(state);
    this.onClose();
  };

  onStateChange = (state: worms.State) => {
    this.setState({state});
  };

  updateState(state: worms.State) {
    this.setState({state});
    this.stateSelectorRef.current?.updateState(state);
  }
}
