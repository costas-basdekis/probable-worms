import React, {Component} from "react";
import {createSelector} from "reselect";
import _ from "underscore";
import {ChartLineName, MultipleEvaluationsChart} from "./MultipleEvaluationsChart";
import * as worms from "../worms";
import {MultipleEvaluationsTable, TargetType} from "./MultipleEvaluationsTable";

interface MultipleEvaluationsProps {
  rolledState: worms.RolledState,
  evaluationsAndPickedRolls: {evaluation: worms.Evaluation, pickedRoll: worms.RollResult, pickedCount: number}[],
  onSetUnrolledState?: (unrolledState: worms.UnrolledState) => void,
  targetType: TargetType,
  targetValue: number,
}

interface MultipleEvaluationsState{
  visibleRollPicks: worms.RollResult[],
  visibleChartLines: ChartLineName[],
  showOnlyMaxValues: boolean,
}

export class MultipleEvaluations extends Component<MultipleEvaluationsProps, MultipleEvaluationsState> {
  state: MultipleEvaluationsState = {
    visibleRollPicks: worms.rollResults,
    visibleChartLines: {
      exactly: ["exactly"] as ChartLineName[],
      atLeast: ["at-least", "expected-value-of-at-least"] as ChartLineName[],
    }[this.props.targetType] ?? ["exactly", "at-least", "expected-value-of-at-least"],
    showOnlyMaxValues: true,
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

  componentDidUpdate(prevProps: Readonly<MultipleEvaluationsProps>) {
    if (prevProps.targetType !== this.props.targetType) {
      switch (this.props.targetType) {
        case "exactly":
          this.setState({visibleChartLines: ["exactly"]});
          break;
        case "atLeast":
          this.setState({visibleChartLines: ["at-least", "expected-value-of-at-least"]});
          break;
      }
    }
  }

  render() {
    const {
      evaluationsByPickedRoll, maxTotal, totals,
      exactRoundedPercentagesEntriesByPickedRolls, atLeastRoundedPercentagesEntriesByPickedRolls,
      expectedValueOfAtLeastRoundedEntriesByPickedRolls,
    } = this;
    const {visibleRollPicks, visibleChartLines, showOnlyMaxValues} = this.state;
    const {rolledState, evaluationsAndPickedRolls, targetType, targetValue} = this.props;
    return <>
      <MultipleEvaluationsTable
        evaluationsAndPickedRolls={evaluationsAndPickedRolls}
        exactRoundedPercentagesEntriesByPickedRolls={expectedValueOfAtLeastRoundedEntriesByPickedRolls}
        atLeastRoundedPercentagesEntriesByPickedRolls={atLeastRoundedPercentagesEntriesByPickedRolls}
        expectedValueOfAtLeastRoundedEntriesByPickedRolls={expectedValueOfAtLeastRoundedEntriesByPickedRolls}
        targetType={targetType}
        targetValue={targetValue}
        rolledState={rolledState}
        onSetUnrolledState={this.props.onSetUnrolledState}
        visibleRollPicks={visibleRollPicks}
        visibleChartLines={visibleChartLines}
        showOnlyMaxValues={showOnlyMaxValues}
        onVisibleRollPicksChange={this.onVisibleRollPicksChange}
        onVisibleChartLinesChange={this.onVisibleChartLinesChange}
        onShowOnlyMaxValuesChange={this.onShowOnlyMaxValuesChange}
      />
      <MultipleEvaluationsChart
        evaluationsByPickedRoll={evaluationsByPickedRoll}
        diceCount={rolledState.totalDiceCount}
        maxTotal={maxTotal}
        totals={totals}
        exactRoundedPercentagesEntriesByPickedRolls={exactRoundedPercentagesEntriesByPickedRolls}
        atLeastRoundedPercentagesEntriesByPickedRolls={atLeastRoundedPercentagesEntriesByPickedRolls}
        expectedValueOfAtLeastRoundedEntriesByPickedRolls={expectedValueOfAtLeastRoundedEntriesByPickedRolls}
        visibleRollPicks={visibleRollPicks}
        visibleChartLines={visibleChartLines}
        showOnlyMaxValues={showOnlyMaxValues}
      />
    </>;
  }

  onVisibleRollPicksChange = (visibleRollPicks: worms.RollResult[]) => {
    this.setState({visibleRollPicks});
  }

  onVisibleChartLinesChange = (visibleChartLines: ChartLineName[]) => {
   this.setState({visibleChartLines});
  }

  onShowOnlyMaxValuesChange = (showOnlyMaxValues: boolean) => {
    this.setState({showOnlyMaxValues});
  };
}
