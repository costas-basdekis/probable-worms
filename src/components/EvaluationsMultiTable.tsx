import React, {Component} from "react";
import {Table} from "semantic-ui-react";
import classNames from "classnames";
import * as worms from "../worms";
import {RChest} from "./RChest";
import {ChartLineName} from "./MultipleEvaluationsChart";
import {createSelector} from "reselect";

interface EvaluationsMultiTableRowChestCellProps {
  chest: worms.Chest,
}

class EvaluationsMultiTableRowChestCell extends Component<EvaluationsMultiTableRowChestCellProps> {
  render() {
    const {chest} = this.props;
    return (
      <Table.Cell className={"ignored"}>
        <RChest
          chest={chest}
          remainingDice={0}
          size={"tiny"}
        />
      </Table.Cell>
    );
  }
}

interface EvaluationsMultiTableRowValueCellProps {
  percentage: number,
  bestPercentage: number,
  maxValue: number | null,
}

class EvaluationsMultiTableRowValueCell extends Component<EvaluationsMultiTableRowValueCellProps> {
  render() {
    const {percentage, bestPercentage, maxValue} = this.props;
    return (
      <Table.Cell
        style={{"--percentage": `${maxValue === null ? percentage : percentage / maxValue * 100}%`}}
        className={classNames({grey: bestPercentage !== percentage})}
      >
        {percentage}{maxValue === null ? "%" : ""}
      </Table.Cell>
    );
  }
}

interface EvaluationsMultiTableRowProps {
  chartLine: ChartLineName,
  chests: worms.Chest[],
  entriesByChest: Map<worms.Chest, [number, number][]>,
  bestValueByTotal: Map<number, number>,
  visibleChartLines?: ChartLineName[],
  maxValue: number | null,
}

class EvaluationsMultiTableRow extends Component<EvaluationsMultiTableRowProps> {
  labelMap: {[key in ChartLineName]: string} = {
    "exactly": "Exactly",
    "at-least": "At Least",
    "expected-value-of-at-least": "EV of At Least",
  };

  render() {
    const {chartLine, chests, entriesByChest, bestValueByTotal, visibleChartLines, maxValue} = this.props;
    if (!(visibleChartLines?.includes(chartLine) ?? true)) {
      return null
    }

    const rowClassName = `table-row-${chartLine}`;
    return <>
      <Table.Row className={rowClassName}>
        <Table.Cell rowSpan={chests.length}>{this.labelMap[chartLine]}</Table.Cell>
        {chests.slice(0, 1).map(chest => (
          <EvaluationsMultiTableRowChestCell key={chest.key} chest={chest} />
        ))}
        {chests.slice(0, 1).map(chest => entriesByChest.get(chest)!.filter(([total]) => total > 0).map(([total, percentage]) => (
          <EvaluationsMultiTableRowValueCell
            key={total}
            percentage={percentage}
            bestPercentage={bestValueByTotal.get(total) ?? 0}
            maxValue={maxValue}
          />
        )))}
      </Table.Row>
      {chests.slice(1).map(chest => (
        <Table.Row className={rowClassName} key={chest.key}>
          <EvaluationsMultiTableRowChestCell chest={chest} />
          {entriesByChest.get(chest)!.filter(([total]) => total > 0).map(([total, percentage]) => (
            <EvaluationsMultiTableRowValueCell
              key={total}
              percentage={percentage}
              bestPercentage={bestValueByTotal.get(total) ?? 0}
              maxValue={maxValue}
            />
          ))}
        </Table.Row>
      ))}
    </>;
  }
}

interface EvaluationsMultiTableProps {
  diceCount: number,
  totals: number[],
  chests: worms.Chest[],
  exactRoundedPercentagesEntriesByChest: Map<worms.Chest, [number, number][]>,
  atLeastRoundedPercentagesEntriesByChest: Map<worms.Chest, [number, number][]>,
  expectedValueOfAtLeastRoundedEntriesByChest: Map<worms.Chest, [number, number][]>,
  visibleChartLines?: ChartLineName[],
}

export class EvaluationsMultiTable extends Component<EvaluationsMultiTableProps> {
  bestExactRoundedPercentagesByTotalSelector = createSelector(
    ({exactRoundedPercentagesEntriesByChest}: EvaluationsMultiTableProps) => exactRoundedPercentagesEntriesByChest,
    this.getBestValues.bind(this),
  );

  get bestExactRoundedPercentagesByTotal() {
    return this.bestExactRoundedPercentagesByTotalSelector(this.props);
  }

  bestAtLeastRoundedPercentagesByTotalSelector = createSelector(
    ({atLeastRoundedPercentagesEntriesByChest}: EvaluationsMultiTableProps) => atLeastRoundedPercentagesEntriesByChest,
    this.getBestValues.bind(this),
  );

  get bestAtLeastRoundedPercentagesByTotal() {
    return this.bestAtLeastRoundedPercentagesByTotalSelector(this.props);
  }

  bestExpectedValueOfAtLeastRoundedByTotalSelector = createSelector(
    ({expectedValueOfAtLeastRoundedEntriesByChest}: EvaluationsMultiTableProps) => expectedValueOfAtLeastRoundedEntriesByChest,
    this.getBestValues.bind(this),
  );

  get bestExpectedValueOfAtLeastRoundedByTotal() {
    return this.bestExpectedValueOfAtLeastRoundedByTotalSelector(this.props);
  }

  render() {
    const {
      bestExactRoundedPercentagesByTotal, bestAtLeastRoundedPercentagesByTotal,
      bestExpectedValueOfAtLeastRoundedByTotal,
    } = this;
    const {
      diceCount, totals, chests, exactRoundedPercentagesEntriesByChest, atLeastRoundedPercentagesEntriesByChest,
      expectedValueOfAtLeastRoundedEntriesByChest, visibleChartLines,
    } = this.props;
    const maxValue = diceCount * 5;
    return (
      <Table definition collapsing unstackable size={"small"}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell collapsing colSpan={2} />
            {totals.map(total => (
              <Table.HeaderCell className={classNames("graded", {low: total < 21, high: total > 25})} collapsing key={total}>{total}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <EvaluationsMultiTableRow
            chartLine={"exactly"}
            chests={chests}
            entriesByChest={exactRoundedPercentagesEntriesByChest}
            bestValueByTotal={bestExactRoundedPercentagesByTotal}
            visibleChartLines={visibleChartLines}
            maxValue={null}
          />
          <EvaluationsMultiTableRow
            chartLine={"at-least"}
            chests={chests}
            entriesByChest={atLeastRoundedPercentagesEntriesByChest}
            bestValueByTotal={bestAtLeastRoundedPercentagesByTotal}
            visibleChartLines={visibleChartLines}
            maxValue={null}
          />
          <EvaluationsMultiTableRow
            chartLine={"expected-value-of-at-least"}
            chests={chests}
            entriesByChest={expectedValueOfAtLeastRoundedEntriesByChest}
            bestValueByTotal={bestExpectedValueOfAtLeastRoundedByTotal}
            visibleChartLines={visibleChartLines}
            maxValue={maxValue}
          />
        </Table.Body>
      </Table>
    );
  }

  getBestValues(entriesByChest: Map<worms.Chest, [number, number][]>): Map<number, number> {
    const bestValues = new Map();
    for (const [, entries] of entriesByChest.entries()) {
      for (const [total, percentage] of entries) {
        bestValues.set(total, Math.max(bestValues.get(total) ?? 0, percentage));
      }
    }
    return bestValues;
  }
}
