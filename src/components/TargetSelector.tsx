import React, {Component, SyntheticEvent} from "react";
import {Button, Card, Container, DropdownProps, Select} from "semantic-ui-react";
import _ from "underscore";
import * as worms from "../worms";
import {TargetType} from "./MultipleEvaluationsTable";

interface TargetSelectorProps {
  state: worms.State,
  targetType: TargetType,
  targetValue: number,
  onTargetTypeChange?: (targetType: TargetType) => void,
  onTargetValueChange?: (targetValue: number) => void,
}

export class TargetSelector extends Component<TargetSelectorProps> {
  render() {
    const {state, targetType, targetValue} = this.props;
    return (
      <Container>
        <Card centered>
          <Card.Content>
            <Card.Header>Target</Card.Header>
            <Button.Group>
              <Button positive={targetType === "exactly"} onClick={this.onExactlyClick}>Exactly</Button>
              <Button.Or />
              <Button positive={targetType === "atLeast"} onClick={this.onAtLeastClick}>At Least</Button>
            </Button.Group>
            <Select
              options={_.range(1, state.totalDiceCount * 5).map(total => ({text: `${total}`, value: total}))}
              value={targetValue}
              onChange={this.onTargetValueChange}
            />
          </Card.Content>
        </Card>
      </Container>
    );
  }

  onExactlyClick = () => {
    this.props.onTargetTypeChange?.("exactly");
  };

  onAtLeastClick = () => {
    this.props.onTargetTypeChange?.("atLeast");
  };

  onTargetValueChange = (ev: SyntheticEvent<HTMLElement, Event>, {value}: DropdownProps) => {
    this.props.onTargetValueChange?.(parseInt(value as string, 10));
  };
}
