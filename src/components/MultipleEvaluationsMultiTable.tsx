import React, {Component} from "react";
import {Table} from "semantic-ui-react";
import classNames from "classnames";
import * as worms from "../worms";
import {ChartDataEntry} from "./MultipleEvaluations";
import {RChest} from "./RChest";
import {EvaluationAndPickedRoll} from "../App";
import {ChartLineName} from "./MultipleEvaluationsChart";

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
    const pickedCountByRoll = new Map(evaluationsAndPickedRolls?.map(({pickedRoll, pickedCount}) => [pickedRoll, pickedCount]));
    const chartDataByTotal = new Map(chartData.map(chartDataItem => [chartDataItem.total, chartDataItem]));
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
          {visibleChartLines.includes("exactly") ? <>
            <Table.Row className={"table-row-exactly"}>
              <Table.Cell rowSpan={visibleRolls.length}>Exactly</Table.Cell>
              {visibleRolls.slice(0, 1).map(roll => (
                <Table.Cell key={roll} style={{"--percentage": "0%"}}>
                  <RChest
                    chest={worms.Chest.fromDiceRoll(new worms.DiceRoll([[roll, pickedCountByRoll.get(roll) ?? 1]]))}
                    remainingDice={0}
                    size={"tiny"}
                  />
                </Table.Cell>
              ))}
              {visibleRolls.slice(0, 1).map(roll => exactRoundedPercentagesEntriesByPickedRolls.get(roll)!.filter(([total]) => total > 0).map(([total, percentage]) => (
                <Table.Cell key={total} style={{"--percentage": `${percentage}%`}} data-value={`${total}:${percentage}:${chartDataByTotal.get(total)?.[`exactlyWith${roll}`]}`} className={classNames({grey: chartDataByTotal.get(total)?.[`exactlyWith${roll}`] !== chartDataByTotal.get(total)?.exactlyMaxValue})}>{percentage}%</Table.Cell>
              )))}
            </Table.Row>
            {visibleRolls.slice(1).map(roll => (
              <Table.Row className={"table-row-exactly"} key={roll}>
                <Table.Cell key={roll} className={"ignored"} style={{"--percentage": "0%"}}>
                  <RChest
                    chest={worms.Chest.fromDiceRoll(new worms.DiceRoll([[roll, pickedCountByRoll.get(roll) ?? 1]]))}
                    remainingDice={0}
                    size={"tiny"}
                  />
                </Table.Cell>
                {exactRoundedPercentagesEntriesByPickedRolls.get(roll)!.filter(([total]) => total > 0).map(([total, percentage]) => (
                  <Table.Cell key={total} style={{"--percentage": `${percentage}%`}} data-value={`${total}:${percentage}:${chartDataByTotal.get(total)?.[`exactlyWith${roll}`]}`} className={classNames({grey: chartDataByTotal.get(total)?.[`exactlyWith${roll}`] !== chartDataByTotal.get(total)?.exactlyMaxValue})}>{percentage}%</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </> : null}
          {visibleChartLines.includes("at-least") ? <>
            <Table.Row className={"table-row-at-least"}>
              <Table.Cell rowSpan={visibleRolls.length}>At Least</Table.Cell>
              {visibleRolls.slice(0, 1).map(roll => (
                <Table.Cell key={roll} style={{"--percentage": "0%"}}>
                  <RChest
                    chest={worms.Chest.fromDiceRoll(new worms.DiceRoll([[roll, pickedCountByRoll.get(roll) ?? 1]]))}
                    remainingDice={0}
                    size={"tiny"}
                  />
                </Table.Cell>
              ))}
              {visibleRolls.slice(0, 1).map(roll => atLeastRoundedPercentagesEntriesByPickedRolls.get(roll)!.filter(([total]) => total > 0).map(([total, percentage]) => (
                <Table.Cell key={total} style={{"--percentage": `${percentage}%`}} className={classNames({grey: chartDataByTotal.get(total)?.[`atLeastWith${roll}`] !== chartDataByTotal.get(total)?.atLeastMaxValue})}>{percentage}%</Table.Cell>
              )))}
            </Table.Row>
            {visibleRolls.slice(1).map(roll => (
              <Table.Row className={"table-row-at-least"} key={roll}>
                <Table.Cell key={roll} className={"ignored"} style={{"--percentage": "0%"}}>
                  <RChest
                    chest={worms.Chest.fromDiceRoll(new worms.DiceRoll([[roll, pickedCountByRoll.get(roll) ?? 1]]))}
                    remainingDice={0}
                    size={"tiny"}
                  />
                </Table.Cell>
                {atLeastRoundedPercentagesEntriesByPickedRolls.get(roll)!.filter(([total]) => total > 0).map(([total, percentage]) => (
                  <Table.Cell key={total} style={{"--percentage": `${percentage}%`}} className={classNames({grey: chartDataByTotal.get(total)?.[`atLeastWith${roll}`] !== chartDataByTotal.get(total)?.atLeastMaxValue})}>{percentage}%</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </> : null}
          {visibleChartLines.includes("expected-value-of-at-least") ? <>
            <Table.Row className={"table-row-expected-value-of-at-least"}>
              <Table.Cell rowSpan={visibleRolls.length}>At Least</Table.Cell>
              {visibleRolls.slice(0, 1).map(roll => (
                <Table.Cell key={roll} style={{"--percentage": "0%"}}>
                  <RChest
                    chest={worms.Chest.fromDiceRoll(new worms.DiceRoll([[roll, pickedCountByRoll.get(roll) ?? 1]]))}
                    remainingDice={0}
                    size={"tiny"}
                  />
                </Table.Cell>
              ))}
              {visibleRolls.slice(0, 1).map(roll => expectedValueOfAtLeastRoundedEntriesByPickedRolls.get(roll)!.filter(([total]) => total > 0).map(([total, percentage]) => (
                <Table.Cell key={total} style={{"--percentage": `${percentage}%`}} className={classNames({grey: chartDataByTotal.get(total)?.[`expectedValueOfAtLeastWith${roll}`] !== chartDataByTotal.get(total)?.expectedValueOfAtLeastMaxValue})}>{percentage}%</Table.Cell>
              )))}
            </Table.Row>
            {visibleRolls.slice(1).map(roll => (
              <Table.Row className={"table-row-expected-value-of-at-least"} key={roll}>
                <Table.Cell key={roll} className={"ignored"} style={{"--percentage": "0%"}}>
                  <RChest
                    chest={worms.Chest.fromDiceRoll(new worms.DiceRoll([[roll, pickedCountByRoll.get(roll) ?? 1]]))}
                    remainingDice={0}
                    size={"tiny"}
                  />
                </Table.Cell>
                {expectedValueOfAtLeastRoundedEntriesByPickedRolls.get(roll)!.filter(([total]) => total > 0).map(([total, expectedValue]) => (
                  <Table.Cell key={total} style={{"--percentage": `${expectedValue / maxValue * 100}%`}} className={classNames({grey: chartDataByTotal.get(total)?.[`expectedValueOfAtLeastWith${roll}`] !== chartDataByTotal.get(total)?.expectedValueOfAtLeastMaxValue})}>{expectedValue}%</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </> : null}
        </Table.Body>
      </Table>
    );
  }
}
