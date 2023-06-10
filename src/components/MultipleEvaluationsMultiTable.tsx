import React, {Component} from "react";
import * as worms from "../worms";
import {ChartDataEntry} from "./MultipleEvaluations";
import {EvaluationAndPickedRoll} from "../App";
import {ChartLineName} from "./MultipleEvaluationsChart";
import {EvaluationsMultiTable} from "./EvaluationsMultiTable";
import {createSelector} from "reselect";

interface MultipleEvaluationsMultiTableProps {
  diceCount: number,
  totals: number[],
  evaluationsAndPickedRolls: EvaluationAndPickedRoll[] | null,
  exactRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  atLeastRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  expectedValueOfAtLeastRoundedEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  chartData: ChartDataEntry[],
  visibleRolls?: worms.RollResult[],
  visibleChartLines?: ChartLineName[],
}

export class MultipleEvaluationsMultiTable extends Component<MultipleEvaluationsMultiTableProps> {
  chestsByRollSelector = createSelector(
    ({evaluationsAndPickedRolls}: MultipleEvaluationsMultiTableProps) => evaluationsAndPickedRolls,
    ({visibleRolls}: MultipleEvaluationsMultiTableProps) => visibleRolls,
    (evaluationsAndPickedRolls, visibleRolls): Map<worms.RollResult, worms.Chest> => {
      if (!evaluationsAndPickedRolls) {
        return new Map();
      }
      return new Map(evaluationsAndPickedRolls
        .filter(({pickedRoll}) => visibleRolls?.includes(pickedRoll) ?? true)
        .map(({pickedRoll, pickedCount}) => [pickedRoll, worms.Chest.fromDiceRoll(new worms.DiceRoll([[pickedRoll, pickedCount]]))]));
    },
  );

  get chestsByRoll() {
    return this.chestsByRollSelector(this.props);
  }

  chestsSelector = createSelector(
    this.chestsByRollSelector,
    (chestsByRoll): worms.Chest[] => {
      return Array.from(chestsByRoll.values());
    },
  );

  get chests() {
    return this.chestsSelector(this.props);
  }

  exactRoundedPercentagesEntriesByChestSelector = createSelector(
    this.chestsByRollSelector,
    ({exactRoundedPercentagesEntriesByPickedRolls}: MultipleEvaluationsMultiTableProps) => exactRoundedPercentagesEntriesByPickedRolls,
    this.makePercentagesByChest.bind(this),
  );

  get exactRoundedPercentagesEntriesByChest() {
    return this.exactRoundedPercentagesEntriesByChestSelector(this.props);
  }

  atLeastRoundedPercentagesEntriesByChestSelector = createSelector(
    this.chestsByRollSelector,
    ({atLeastRoundedPercentagesEntriesByPickedRolls}: MultipleEvaluationsMultiTableProps) => atLeastRoundedPercentagesEntriesByPickedRolls,
    this.makePercentagesByChest.bind(this),
  );

  get atLeastRoundedPercentagesEntriesByChest() {
    return this.atLeastRoundedPercentagesEntriesByChestSelector(this.props);
  }

  expectedValueOfAtLeastRoundedEntriesByChestSelector = createSelector(
    this.chestsByRollSelector,
    ({expectedValueOfAtLeastRoundedEntriesByPickedRolls}: MultipleEvaluationsMultiTableProps) => expectedValueOfAtLeastRoundedEntriesByPickedRolls,
    this.makePercentagesByChest.bind(this),
  );

  get expectedValueOfAtLeastRoundedEntriesByChest() {
    return this.expectedValueOfAtLeastRoundedEntriesByChestSelector(this.props);
  }

  render() {
    const {
      chests, exactRoundedPercentagesEntriesByChest, atLeastRoundedPercentagesEntriesByChest,
      expectedValueOfAtLeastRoundedEntriesByChest,
    } = this;
    const {diceCount, totals, visibleChartLines} = this.props;
    return (
      <EvaluationsMultiTable
        diceCount={diceCount}
        totals={totals}
        chests={chests}
        exactRoundedPercentagesEntriesByChest={exactRoundedPercentagesEntriesByChest}
        atLeastRoundedPercentagesEntriesByChest={atLeastRoundedPercentagesEntriesByChest}
        expectedValueOfAtLeastRoundedEntriesByChest={expectedValueOfAtLeastRoundedEntriesByChest}
        visibleChartLines={visibleChartLines}
      />
    );
  }

  makePercentagesByChest(chestsByRoll: Map<worms.RollResult, worms.Chest>, percentagesByRoll: Map<worms.RollResult, [number, number][]>): Map<worms.Chest, [number, number][]> {
    return new Map(
      Array.from(chestsByRoll.entries())
        .filter(([roll]) => percentagesByRoll.has(roll))
        .map(([roll, chest]) => [chest, percentagesByRoll.get(roll)!])
    );
  }
}
