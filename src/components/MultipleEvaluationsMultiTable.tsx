import React, {Component} from "react";
import {Table} from "semantic-ui-react";
import classNames from "classnames";
import * as worms from "../worms";
import {ChartDataEntry} from "./MultipleEvaluations";
import {RChest} from "./RChest";
import {EvaluationAndPickedRoll} from "../App";
import {ChartLineName} from "./MultipleEvaluationsChart";

interface MultipleEvaluationsMultiTableRowChestCellProps {
  roll: worms.RollResult,
  pickedCountByRoll: Map<worms.RollResult, number>,
}

class MultipleEvaluationsMultiTableRowChestCell extends Component<MultipleEvaluationsMultiTableRowChestCellProps> {
  render() {
    const {roll, pickedCountByRoll} = this.props;
    return (
      <Table.Cell className={"ignored"}>
        <RChest
          chest={worms.Chest.fromDiceRoll(new worms.DiceRoll([[roll, pickedCountByRoll.get(roll) ?? 1]]))}
          remainingDice={0}
          size={"tiny"}
        />
      </Table.Cell>
    );
  }
}

interface MultipleEvaluationsMultiTableRowValueCellProps {
  chartLine: ChartLineName,
  total: number,
  percentage: number,
  roll: worms.RollResult,
  chartDataByTotal: Map<number, ChartDataEntry>,
  maxValue: number | null,
}

class MultipleEvaluationsMultiTableRowValueCell extends Component<MultipleEvaluationsMultiTableRowValueCellProps> {
  dataKeyMap: {[key in ChartLineName]: "exactly" | "atLeast" | "expectedValueOfAtLeast"} = {
    "exactly": "exactly",
    "at-least": "atLeast",
    "expected-value-of-at-least": "expectedValueOfAtLeast",
  };

  render() {
    const {chartLine, total, percentage, roll, chartDataByTotal, maxValue} = this.props;
    const chartDataEntry = chartDataByTotal.get(total);
    const isBest = (
      chartDataEntry?.[`${this.dataKeyMap[chartLine]}With${roll}`]
      === chartDataEntry?.[`${this.dataKeyMap[chartLine]}MaxValue`]
    );
    return (
      <Table.Cell
        style={{"--percentage": `${maxValue === null ? percentage : percentage / maxValue * 100}%`}}
        className={classNames({grey: !isBest})}
      >
        {percentage}{maxValue === null ? "%" : ""}
      </Table.Cell>
    );
  }
}

interface MultipleEvaluationsMultiTableRowProps {
  chartLine: ChartLineName,
  evaluationsAndPickedRolls: EvaluationAndPickedRoll[] | null,
  entriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  chartData: ChartDataEntry[],
  visibleRolls: worms.RollResult[],
  visibleChartLines: ChartLineName[],
  maxValue: number | null,
}

class MultipleEvaluationsMultiTableRow extends Component<MultipleEvaluationsMultiTableRowProps> {
  labelMap: {[key in ChartLineName]: string} = {
    "exactly": "Exactly",
    "at-least": "At Least",
    "expected-value-of-at-least": "EV of At Least",
  };

  render() {
    const {chartLine, evaluationsAndPickedRolls, entriesByPickedRolls, visibleRolls, visibleChartLines, chartData, maxValue} = this.props;
    if (!visibleChartLines.includes(chartLine)) {
      return null
    }

    const pickedCountByRoll = new Map(evaluationsAndPickedRolls?.map(({pickedRoll, pickedCount}) => [pickedRoll, pickedCount]));
    const chartDataByTotal = new Map(chartData.map(chartDataItem => [chartDataItem.total, chartDataItem]));

    const rowClassName = `table-row-${chartLine}`;
    return <>
      <Table.Row className={rowClassName}>
        <Table.Cell rowSpan={visibleRolls.length}>{this.labelMap[chartLine]}</Table.Cell>
        {visibleRolls.slice(0, 1).map(roll => (
          <MultipleEvaluationsMultiTableRowChestCell key={roll} roll={roll} pickedCountByRoll={pickedCountByRoll} />
        ))}
        {visibleRolls.slice(0, 1).map(roll => entriesByPickedRolls.get(roll)!.filter(([total]) => total > 0).map(([total, percentage]) => (
          <MultipleEvaluationsMultiTableRowValueCell
            key={total}
            chartLine={chartLine}
            total={total}
            percentage={percentage}
            roll={roll}
            chartDataByTotal={chartDataByTotal}
            maxValue={maxValue}
          />
        )))}
      </Table.Row>
      {visibleRolls.slice(1).map(roll => (
        <Table.Row className={rowClassName} key={roll}>
          <MultipleEvaluationsMultiTableRowChestCell key={roll} roll={roll} pickedCountByRoll={pickedCountByRoll} />
          {entriesByPickedRolls.get(roll)!.filter(([total]) => total > 0).map(([total, percentage]) => (
            <MultipleEvaluationsMultiTableRowValueCell
              key={total}
              chartLine={chartLine}
              total={total}
              percentage={percentage}
              roll={roll}
              chartDataByTotal={chartDataByTotal}
              maxValue={maxValue}
            />
          ))}
        </Table.Row>
      ))}
    </>;
  }
}

interface MultipleEvaluationsMultiTableProps {
  diceCount: number,
  totals: number[],
  evaluationsAndPickedRolls: EvaluationAndPickedRoll[] | null,
  exactRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  atLeastRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  expectedValueOfAtLeastRoundedEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  chartData: ChartDataEntry[],
  visibleRolls: worms.RollResult[],
  visibleChartLines: ChartLineName[],
}

export class MultipleEvaluationsMultiTable extends Component<MultipleEvaluationsMultiTableProps> {
  render() {
    const {
      diceCount, totals, evaluationsAndPickedRolls, exactRoundedPercentagesEntriesByPickedRolls,
      atLeastRoundedPercentagesEntriesByPickedRolls, expectedValueOfAtLeastRoundedEntriesByPickedRolls,
      visibleRolls, visibleChartLines, chartData,
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
          <MultipleEvaluationsMultiTableRow
            chartLine={"exactly"}
            evaluationsAndPickedRolls={evaluationsAndPickedRolls}
            entriesByPickedRolls={exactRoundedPercentagesEntriesByPickedRolls}
            chartData={chartData}
            visibleRolls={visibleRolls}
            visibleChartLines={visibleChartLines}
            maxValue={null}
          />
          <MultipleEvaluationsMultiTableRow
            chartLine={"at-least"}
            evaluationsAndPickedRolls={evaluationsAndPickedRolls}
            entriesByPickedRolls={atLeastRoundedPercentagesEntriesByPickedRolls}
            chartData={chartData}
            visibleRolls={visibleRolls}
            visibleChartLines={visibleChartLines}
            maxValue={null}
          />
          <MultipleEvaluationsMultiTableRow
            chartLine={"expected-value-of-at-least"}
            evaluationsAndPickedRolls={evaluationsAndPickedRolls}
            entriesByPickedRolls={expectedValueOfAtLeastRoundedEntriesByPickedRolls}
            chartData={chartData}
            visibleRolls={visibleRolls}
            visibleChartLines={visibleChartLines}
            maxValue={maxValue}
          />
        </Table.Body>
      </Table>
    );
  }
}
