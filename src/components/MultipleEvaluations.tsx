import React, {Component, FormEvent} from "react";
import {createSelector} from "reselect";
import _ from "underscore";
import {MultipleEvaluationsChart} from "./MultipleEvaluationsChart";
import * as worms from "../worms";
import {Button, Checkbox, Segment, Table} from "semantic-ui-react";
import {RChest} from "./RChest";
import {CheckboxProps} from "semantic-ui-react/dist/commonjs/modules/Checkbox/Checkbox";

interface MultipleEvaluationsProps {
  rolledState: worms.RolledState,
  evaluationsAndPickedRolls: {evaluation: worms.Evaluation, pickedRoll: worms.RollResult, pickedCount: number}[],
  onSetUnrolledState?: (unrolledState: worms.UnrolledState) => void,
}

interface MultipleEvaluationsState{
  visibleRollPicks: worms.RollResult[],
}

export class MultipleEvaluations extends Component<MultipleEvaluationsProps, MultipleEvaluationsState> {
  state = {
    visibleRollPicks: worms.rollResults,
  };

  evaluationsByPickedRollSelector = createSelector(
    ({evaluationsAndPickedRolls}: MultipleEvaluationsProps) => evaluationsAndPickedRolls,
    (evaluationsAndPickedRolls): Map<worms.RollResult, worms.Evaluation> => {
      return new Map(evaluationsAndPickedRolls.map(({evaluation, pickedRoll}) => [pickedRoll, evaluation]));
    },
  );

  get evaluationsByPickedRoll(): Map<worms.RollResult, worms.Evaluation> {
  return this.evaluationsByPickedRollSelector(this.props);
  }

  maxTotalSelector = createSelector(
    ({evaluationsAndPickedRolls}: MultipleEvaluationsProps) => evaluationsAndPickedRolls,
    (evaluationsAndPickedRolls): number => {
      return Math.max(
        0,
        ...evaluationsAndPickedRolls.map(({evaluation}) => Math.max(0, ...evaluation.exactResultOccurrences.keys())),
        ...evaluationsAndPickedRolls.map(({evaluation}) => Math.max(0, ...evaluation.minimumResultOccurrences.keys())),
      );
    },
  );

  get maxTotal(): number {
    return this.maxTotalSelector(this.props);
  }

  totalsSelector = createSelector(
    this.maxTotalSelector,
    maxTotal => {
      return _.range(maxTotal + 1);
    },
  );

  get totals(): number[] {
    return this.totalsSelector(this.props);
  }

  exactRoundedPercentagesEntriesByPickedRollsSelector = createSelector(
    ({evaluationsAndPickedRolls}: MultipleEvaluationsProps) => evaluationsAndPickedRolls,
    this.totalsSelector,
    (evaluationsAndPickedRolls, totals): Map<worms.RollResult, [number, number][]> => {
      return new Map(evaluationsAndPickedRolls.map(({evaluation, pickedRoll}) => [
        pickedRoll,
        totals.map(total => [total, Math.floor((evaluation.exactResultOccurrences.get(total) || 0) * 100)]),
      ]));
    },
  );

  get exactRoundedPercentagesEntriesByPickedRolls(): Map<worms.RollResult, [number, number][]> {
    return this.exactRoundedPercentagesEntriesByPickedRollsSelector(this.props);
  }

  atLeastRoundedPercentagesEntriesByPickedRollsSelector = createSelector(
    ({evaluationsAndPickedRolls}: MultipleEvaluationsProps) => evaluationsAndPickedRolls,
    this.totalsSelector,
    (evaluationsAndPickedRolls, totals): Map<worms.RollResult, [number, number][]> => {
      return new Map(evaluationsAndPickedRolls.map(({evaluation, pickedRoll}) => [
        pickedRoll,
        totals.map(total => [total, Math.floor((evaluation.minimumResultOccurrences.get(total) || 0) * 100)]),
      ]));
    },
  );

  get atLeastRoundedPercentagesEntriesByPickedRolls(): Map<worms.RollResult, [number, number][]> {
    return this.atLeastRoundedPercentagesEntriesByPickedRollsSelector(this.props);
  }

  expectedValueOfAtLeastRoundedEntriesByPickedRollsSelector = createSelector(
    ({evaluationsAndPickedRolls}: MultipleEvaluationsProps) => evaluationsAndPickedRolls,
    this.totalsSelector,
    (evaluationsAndPickedRolls, totals): Map<worms.RollResult, [number, number][]> => {
      return new Map(evaluationsAndPickedRolls.map(({evaluation, pickedRoll}) => [
        pickedRoll,
        totals.map(total => [total, Math.floor(evaluation.expectedValueOfAtLeast.get(total) || 0)]),
      ]));
    },
  );

  get expectedValueOfAtLeastRoundedEntriesByPickedRolls(): Map<worms.RollResult, [number, number][]> {
    return this.expectedValueOfAtLeastRoundedEntriesByPickedRollsSelector(this.props);
  }

  render() {
    const {
      evaluationsByPickedRoll, maxTotal, totals,
      exactRoundedPercentagesEntriesByPickedRolls, atLeastRoundedPercentagesEntriesByPickedRolls,
      expectedValueOfAtLeastRoundedEntriesByPickedRolls,
    } = this;
    const {visibleRollPicks} = this.state;
    const {rolledState, evaluationsAndPickedRolls} = this.props;
    return <>
      <Segment>
        <Table definition collapsing unstackable size={"small"}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell>Pick</Table.HeaderCell>
              <Table.HeaderCell>Expected Value</Table.HeaderCell>
              <Table.HeaderCell>Visible</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {evaluationsAndPickedRolls.map(({evaluation, pickedRoll, pickedCount}) => (
              <Table.Row key={pickedRoll}>
                <Table.Cell>Pick {pickedRoll}</Table.Cell>
                <Table.Cell><RChest chest={worms.Chest.fromDiceRoll(new worms.DiceRoll([[pickedRoll, pickedCount]]))} remainingDice={0} size={"tiny"} /></Table.Cell>
                <Table.Cell>{evaluation.expectedValue.toFixed(1)}</Table.Cell>
                <Table.Cell><Checkbox toggle checked={visibleRollPicks.includes(pickedRoll)} onChange={this.makeOnRollVisibleChange(pickedRoll)} /></Table.Cell>
                <Table.Cell><Button onClick={this.makeOnContinueFromHere(pickedRoll)}>Continue from here</Button></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Segment>
      <MultipleEvaluationsChart
        evaluationsByPickedRoll={evaluationsByPickedRoll}
        diceCount={rolledState.totalDiceCount}
        maxTotal={maxTotal}
        totals={totals}
        exactRoundedPercentagesEntriesByPickedRolls={exactRoundedPercentagesEntriesByPickedRolls}
        atLeastRoundedPercentagesEntriesByPickedRolls={atLeastRoundedPercentagesEntriesByPickedRolls}
        expectedValueOfAtLeastRoundedEntriesByPickedRolls={expectedValueOfAtLeastRoundedEntriesByPickedRolls}
        visibleRollPicks={visibleRollPicks}
      />
    </>;
  }

  makeOnRollVisibleChange(pickedRoll: worms.RollResult): (ev: FormEvent<HTMLInputElement>, data: CheckboxProps) => void {
    return (_ev: FormEvent<HTMLInputElement>, {checked}) => {
      this.setState(({visibleRollPicks}) => {
        if (checked && !visibleRollPicks.includes(pickedRoll)) {
          return {visibleRollPicks: [...visibleRollPicks, pickedRoll]};
        } else if (!checked && visibleRollPicks.includes) {
          return {visibleRollPicks: visibleRollPicks.filter(otherRoll => otherRoll !== pickedRoll)};
        } else {
          return null;
        }
      });
    };
  }

  makeOnContinueFromHere(pickedRoll: worms.RollResult): () => void {
    return () => {
      this.props.onSetUnrolledState?.(this.props.rolledState.pick(pickedRoll));
    };
  }
}
