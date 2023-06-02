import React, {Component} from "react";
import {createSelector} from "reselect";
import _ from "underscore";
import {REvaluationTable} from "./REvaluationTable";
import {REvaluationChart} from "./REvaluationChart";
import * as worms from "../worms";

interface REvaluationProps {
  evaluation: worms.Evaluation,
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

  render() {
    const {evaluation} = this.props;
    const {maxTotal, totals, exactRoundedPercentagesEntries, atLeastRoundedPercentagesEntries} = this;
    return <>
      <label>Expected value: <strong>{evaluation.expectedValue.toFixed(1)}</strong></label>
      <REvaluationTable
        evaluation={evaluation}
        maxTotal={maxTotal}
        totals={totals}
        exactRoundedPercentagesEntries={exactRoundedPercentagesEntries}
        atLeastRoundedPercentagesEntries={atLeastRoundedPercentagesEntries}
      />
      <REvaluationChart
        evaluation={evaluation}
        maxTotal={maxTotal}
        totals={totals}
        exactRoundedPercentagesEntries={exactRoundedPercentagesEntries}
        atLeastRoundedPercentagesEntries={atLeastRoundedPercentagesEntries}
      />
    </>;
  }
}
