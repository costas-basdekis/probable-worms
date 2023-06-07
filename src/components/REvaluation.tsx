import React, {Component} from "react";
import {createSelector} from "reselect";
import _ from "underscore";
import {REvaluationTable} from "./REvaluationTable";
import {REvaluationChart} from "./REvaluationChart";
import * as worms from "../worms";
import {Label, Segment} from "semantic-ui-react";

interface REvaluationProps {
  evaluation: worms.Evaluation,
  total: number,
  diceCount: number,
}

export class REvaluation extends Component<REvaluationProps> {
  maxTotalSelector = createSelector(
    ({evaluation}: REvaluationProps) => evaluation,
    (evaluation): number => {
      return Math.max(
        0,
        Math.max(
          ...evaluation.exactResultOccurrences.keys(),
          ...evaluation.minimumResultOccurrences.keys(),
        ),
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

  exactRoundedPercentagesEntriesSelector = createSelector(
    ({evaluation}: REvaluationProps) => evaluation,
    this.totalsSelector,
    (evaluation, totals): [number, number][] => {
      return totals.map(
        total => [total, Math.floor((evaluation.exactResultOccurrences.get(total) || 0) * 100)])
    },
  );

  get exactRoundedPercentagesEntries(): [number, number][] {
    return this.exactRoundedPercentagesEntriesSelector(this.props);
  }

  atLeastRoundedPercentagesEntriesSelector = createSelector(
    ({evaluation}: REvaluationProps) => evaluation,
    this.totalsSelector,
    (evaluation, totals): [number, number][] => {
      return totals.map(
        total => [total, total === 0 ? 100 : Math.floor((evaluation.minimumResultOccurrences.get(total) || 0) * 100)])
    },
  );

  get atLeastRoundedPercentagesEntries(): [number, number][] {
    return this.atLeastRoundedPercentagesEntriesSelector(this.props);
  }

  expectedValueOfAtLeastRoundedEntriesSelector = createSelector(
    ({evaluation}: REvaluationProps) => evaluation,
    this.totalsSelector,
    (evaluation, totals): [number, number][] => {
      return totals.map(
        total => [total, total === 0 ? Math.floor(evaluation.expectedValue) : Math.floor(evaluation.expectedValueOfAtLeast.get(total) || 0)])
    },
  );

  get expectedValueOfAtLeastRoundedEntries(): [number, number][] {
    return this.expectedValueOfAtLeastRoundedEntriesSelector(this.props);
  }

  render() {
    const {evaluation, total, diceCount} = this.props;
    const {maxTotal, totals, exactRoundedPercentagesEntries, atLeastRoundedPercentagesEntries, expectedValueOfAtLeastRoundedEntries} = this;
    return <>
      <Segment style={{width: "100%", overflowX: "scroll"}}>
        <Label attached={"top left"} color={evaluation.expectedValue > 25 ? "olive" : evaluation.expectedValue < 21 ? "orange" : "yellow"}>
          Expected value:
          <Label.Detail><strong>{evaluation.expectedValue.toFixed(1)}</strong></Label.Detail>
        </Label>
        <Label attached={"top right"} color={total > 25 ? "olive" : total < 21 ? "orange" : "yellow"}>
          Total:
          <Label.Detail><strong>{total}</strong></Label.Detail>
        </Label>
        <REvaluationTable
          evaluation={evaluation}
          diceCount={diceCount}
          maxTotal={maxTotal}
          totals={totals}
          exactRoundedPercentagesEntries={exactRoundedPercentagesEntries}
          atLeastRoundedPercentagesEntries={atLeastRoundedPercentagesEntries}
          expectedValueOfAtLeastRoundedEntries={expectedValueOfAtLeastRoundedEntries}
        />
      </Segment>
      <REvaluationChart
        evaluation={evaluation}
        diceCount={diceCount}
        maxTotal={maxTotal}
        totals={totals}
        exactRoundedPercentagesEntries={exactRoundedPercentagesEntries}
        atLeastRoundedPercentagesEntries={atLeastRoundedPercentagesEntries}
        expectedValueOfAtLeastRoundedEntries={expectedValueOfAtLeastRoundedEntries}
      />
    </>;
  }
}
