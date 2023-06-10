import React, {Component} from "react";
import {createSelector} from "reselect";
import _ from "underscore";
import {ChartLineName, MultipleEvaluationsChart} from "./MultipleEvaluationsChart";
import * as worms from "../worms";
import {MultipleEvaluationsTable, TargetType} from "./MultipleEvaluationsTable";
import {EvaluationAndPickedRoll} from "../App";
import {MultipleEvaluationsMultiTable} from "./MultipleEvaluationsMultiTable";
import { Segment } from "semantic-ui-react";

interface MultipleEvaluationsProps {
  evaluation: worms.Evaluation,
  preRollEvaluation: worms.Evaluation,
  preRollTotal: number,
  rolledState: worms.RolledState,
  evaluationsAndPickedRolls: EvaluationAndPickedRoll[] | null,
  onSetUnrolledState?: (unrolledState: worms.UnrolledState) => void,
  targetType: TargetType,
  targetValue: number,
}

interface MultipleEvaluationsState{
  visibleRollPicks: worms.RollResult[],
  visibleChartLines: ChartLineName[],
  showOnlyMaxValues: boolean,
}

export interface ChartDataEntry {
  total: number,
  exactlyWith1: number, exactlyWith2: number, exactlyWith3: number, exactlyWith4: number, exactlyWith5: number, exactlyWithW: number, exactlyMaxValue: number, exactlyMaxFaces: string,
  atLeastWith1: number, atLeastWith2: number, atLeastWith3: number, atLeastWith4: number, atLeastWith5: number, atLeastWithW: number, atLeastMaxValue: number, atLeastMaxFaces: string,
  expectedValueOfAtLeastWith1: number, expectedValueOfAtLeastWith2: number, expectedValueOfAtLeastWith3: number, expectedValueOfAtLeastWith4: number, expectedValueOfAtLeastWith5: number, expectedValueOfAtLeastWithW: number, expectedValueOfAtLeastMaxValue: number, expectedValueOfAtLeastMaxFaces: string,
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
      if (!evaluationsAndPickedRolls) {
        return new Map();
      }
      return new Map(evaluationsAndPickedRolls.map(({evaluation, pickedRoll}) => [pickedRoll, evaluation]));
    },
  );

  get evaluationsByPickedRoll(): Map<worms.RollResult, worms.Evaluation> {
    return this.evaluationsByPickedRollSelector(this.props);
  }

  maxTotalSelector = createSelector(
    ({evaluationsAndPickedRolls}: MultipleEvaluationsProps) => evaluationsAndPickedRolls,
    (evaluationsAndPickedRolls): number => {
      if (!evaluationsAndPickedRolls) {
        return 0;
      }
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
      return _.range(1, maxTotal + 1);
    },
  );

  get totals(): number[] {
    return this.totalsSelector(this.props);
  }

  exactRoundedPercentagesEntriesByPickedRollsSelector = createSelector(
    ({evaluationsAndPickedRolls}: MultipleEvaluationsProps) => evaluationsAndPickedRolls,
    this.totalsSelector,
    (evaluationsAndPickedRolls, totals): Map<worms.RollResult, [number, number][]> => {
      if (!evaluationsAndPickedRolls) {
        return new Map();
      }
      return new Map(evaluationsAndPickedRolls.map(({evaluation, pickedRoll}) => [
        pickedRoll,
        ([0, ...totals]).map(total => [total, Math.floor((evaluation.exactResultOccurrences.get(total) || 0) * 100)]),
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
      if (!evaluationsAndPickedRolls) {
        return new Map();
      }
      return new Map(evaluationsAndPickedRolls.map(({evaluation, pickedRoll}) => [
        pickedRoll,
        ([0, ...totals]).map(total => [total, Math.floor((evaluation.minimumResultOccurrences.get(total) || 0) * 100)]),
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
      if (!evaluationsAndPickedRolls) {
        return new Map();
      }
      return new Map(evaluationsAndPickedRolls.map(({evaluation, pickedRoll}) => [
        pickedRoll,
        ([0, ...totals]).map(total => [total, Math.floor(evaluation.expectedValueOfAtLeast.get(total) || 0)]),
      ]));
    },
  );

  get expectedValueOfAtLeastRoundedEntriesByPickedRolls(): Map<worms.RollResult, [number, number][]> {
    return this.expectedValueOfAtLeastRoundedEntriesByPickedRollsSelector(this.props);
  }

  visibleRollsSelector = createSelector(
    this.evaluationsByPickedRollSelector,
    (_1: MultipleEvaluationsProps, {visibleRollPicks}: MultipleEvaluationsState) => visibleRollPicks,
    (evaluationsByPickedRoll, visibleRollPicks) => {
      return Array.from(evaluationsByPickedRoll.keys()).filter(roll => visibleRollPicks?.includes(roll) ?? true);
    }
  )

  get visibleRolls() {
    return this.visibleRollsSelector(this.props, this.state);
  }

  chartDataSelector = createSelector(
    this.visibleRollsSelector,
    this.totalsSelector,
    this.exactRoundedPercentagesEntriesByPickedRollsSelector,
    this.atLeastRoundedPercentagesEntriesByPickedRollsSelector,
    this.expectedValueOfAtLeastRoundedEntriesByPickedRollsSelector,
    (
      visibleRolls, totals, exactRoundedPercentagesEntriesByPickedRolls, atLeastRoundedPercentagesEntriesByPickedRolls,
      expectedValueOfAtLeastRoundedEntriesByPickedRolls,
    ): ChartDataEntry[] => {
      return totals.map(total => {
        const exactlyEntries: [string, number][] = visibleRolls.map(roll => [`exactlyWith${roll}`, exactRoundedPercentagesEntriesByPickedRolls.get(roll)?.[total]?.[1] ?? 0]);
        const atLeastEntries: [string, number][] = visibleRolls.map(roll => [`atLeastWith${roll}`, atLeastRoundedPercentagesEntriesByPickedRolls.get(roll)?.[total]?.[1] ?? 0]);
        const expectedValueOfAtLeastEntries: [string, number][] = visibleRolls.map(roll => [`expectedValueOfAtLeastWith${roll}`, expectedValueOfAtLeastRoundedEntriesByPickedRolls.get(roll)?.[total]?.[1] ?? 0]);
        const exactlyMaxValue = Math.max(...exactlyEntries.map(([, value]) => value));
        const atLeastMaxValue = Math.max(...atLeastEntries.map(([, value]) => value));
        const expectedValueOfAtLeastMaxValue = Math.max(...expectedValueOfAtLeastEntries.map(([, value]) => value));
        return ({
          total,
          ...Object.fromEntries(exactlyEntries),
          exactlyMaxValue,
          exactlyMaxFaces: exactlyEntries.filter(([, value]) => value === exactlyMaxValue).map(([label]) => label[label.length - 1]).join(","),
          ...Object.fromEntries(atLeastEntries),
          atLeastMaxValue,
          atLeastMaxFaces: atLeastEntries.filter(([, value]) => value === atLeastMaxValue).map(([label]) => label[label.length - 1]).join(","),
          ...Object.fromEntries(expectedValueOfAtLeastEntries),
          expectedValueOfAtLeastMaxValue,
          expectedValueOfAtLeastMaxFaces: expectedValueOfAtLeastEntries.filter(([, value]) => value === expectedValueOfAtLeastMaxValue).map(([label]) => label[label.length - 1]).join(","),
        } as ChartDataEntry);
      });
    },
  );

  get chartData(): ChartDataEntry[] {
    return this.chartDataSelector(this.props, this.state);
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
      expectedValueOfAtLeastRoundedEntriesByPickedRolls, visibleRolls, chartData,
    } = this;
    const {visibleRollPicks, visibleChartLines, showOnlyMaxValues} = this.state;
    const {evaluation, preRollEvaluation, preRollTotal, rolledState, evaluationsAndPickedRolls, targetType, targetValue} = this.props;
    return <>
      <MultipleEvaluationsTable
        evaluation={evaluation}
        preRollEvaluation={preRollEvaluation}
        preRollTotal={preRollTotal}
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
      {evaluationsAndPickedRolls ? <>
        <MultipleEvaluationsChart
          evaluationsByPickedRoll={evaluationsByPickedRoll}
          diceCount={rolledState.totalDiceCount}
          maxTotal={maxTotal}
          totals={totals}
          exactRoundedPercentagesEntriesByPickedRolls={exactRoundedPercentagesEntriesByPickedRolls}
          atLeastRoundedPercentagesEntriesByPickedRolls={atLeastRoundedPercentagesEntriesByPickedRolls}
          expectedValueOfAtLeastRoundedEntriesByPickedRolls={expectedValueOfAtLeastRoundedEntriesByPickedRolls}
          visibleRolls={visibleRolls}
          chartData={chartData}
          visibleRollPicks={visibleRollPicks}
          visibleChartLines={visibleChartLines}
          showOnlyMaxValues={showOnlyMaxValues}
        />
        <Segment style={{width: "100%", overflowX: "scroll"}}>
          <MultipleEvaluationsMultiTable
            diceCount={rolledState.totalDiceCount}
            totals={totals}
            evaluationsAndPickedRolls={evaluationsAndPickedRolls}
            exactRoundedPercentagesEntriesByPickedRolls={exactRoundedPercentagesEntriesByPickedRolls}
            atLeastRoundedPercentagesEntriesByPickedRolls={atLeastRoundedPercentagesEntriesByPickedRolls}
            expectedValueOfAtLeastRoundedEntriesByPickedRolls={expectedValueOfAtLeastRoundedEntriesByPickedRolls}
            chartData={chartData}
            visibleRolls={visibleRolls}
            visibleChartLines={visibleChartLines}
          />
        </Segment>
      </> : null}
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
