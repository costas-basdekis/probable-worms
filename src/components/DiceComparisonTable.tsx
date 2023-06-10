import React, {Component} from "react";
import {Icon, Segment, Table} from "semantic-ui-react";
import _ from "underscore";
import {Die} from "./Die";
import classNames from "classnames";
import * as worms from "../worms";
import {Metric} from "./DiceComparison";
import {DiceComparisonEvaluations} from "../RemoteSearch";

interface DiceComparisonTableProps {
  unrolledState: worms.UnrolledState,
  diceComparisonEvaluations: {firstEvaluations: DiceComparisonEvaluations, secondEvaluations: DiceComparisonEvaluations} | null,
  firstDie: worms.RollResult,
  secondDie: worms.RollResult,
  metric: Metric,
  targetValue: number,
  calculating: boolean,
}

export class DiceComparisonTable extends Component<DiceComparisonTableProps> {
  render() {
    const {unrolledState, diceComparisonEvaluations, firstDie, secondDie, metric, targetValue, calculating} = this.props;
    return (
      <Segment style={{width: "100%", overflowX: "scroll"}}>
        <Table definition collapsing unstackable size={"small"}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              {_.range(1, unrolledState.remainingDiceCount).map(firstDiceCount => {
                const firstEvaluation = diceComparisonEvaluations?.firstEvaluations?.get(firstDiceCount);
                const firstValue = this.getValue(firstEvaluation, metric, targetValue);
                return (
                  <Table.HeaderCell key={firstDiceCount} className={"comparison first"}>
                    <div className={"dice"}>
                      <Die face={firstDie} size={"tiny"} /> x{firstDiceCount}{" "}
                      {calculating ? <Icon loading name='redo' /> : firstValue !== undefined ? (
                        ["exactly", "atLeast"].includes(metric) ? `${Math.round(firstValue * 100)}%` : (Math.round(firstValue * 10) / 10)
                      ) : null}
                    </div>
                  </Table.HeaderCell>
                );
              })}
            </Table.Row>
            {_.range(1, unrolledState.remainingDiceCount).map(secondDiceCount => {
              const secondEvaluation = diceComparisonEvaluations?.secondEvaluations?.get(secondDiceCount);
              const secondValue = this.getValue(secondEvaluation, metric, targetValue);
              return (
                <Table.Row key={secondDiceCount}>
                  <Table.Cell className={"comparison second"}>
                    <div className={"dice"}>
                      <Die face={secondDie} size={"tiny"} /> x{secondDiceCount}{" "}
                      {calculating ? <Icon loading name='redo' /> : secondValue !== undefined ? (
                        ["exactly", "atLeast"].includes(metric) ? `${Math.round(secondValue * 100)}%` : (Math.round(secondValue * 10) / 10)
                      ) : null}
                    </div>
                  </Table.Cell>
                  {_.range(1, unrolledState.remainingDiceCount).map(firstDiceCount => {
                    const isValidCombination = (
                      ((firstDiceCount + secondDiceCount) > 0)
                      && ((firstDiceCount + secondDiceCount) <= unrolledState.remainingDiceCount)
                    );
                    if (!isValidCombination) {
                      return (
                        <Table.Cell key={`${firstDiceCount}v${secondDiceCount}`} />
                      );
                    }
                    if (calculating) {
                      return (
                        <Table.Cell key={`${firstDiceCount}v${secondDiceCount}`}>
                          <Icon loading name='redo' />
                        </Table.Cell>
                      );
                    }
                    const firstEvaluation = diceComparisonEvaluations?.firstEvaluations?.get(firstDiceCount);
                    const firstValue = this.getValue(firstEvaluation, metric, targetValue);
                    const firstIsBest = (firstValue !== undefined) && (secondValue === undefined || firstValue >= secondValue);
                    const secondIsBest = (secondValue !== undefined) && (firstValue === undefined || secondValue >= firstValue);
                    const difference = (firstValue ?? 0)  - (secondValue ?? 0);
                    return (
                      <Table.Cell key={`${firstDiceCount}v${secondDiceCount}`} className={classNames("comparison", {first: firstIsBest && !secondIsBest, second: secondIsBest && !firstIsBest, equal: firstIsBest && secondIsBest})}>
                        {
                          !isValidCombination
                            ? ""
                            : (firstValue !== undefined || secondValue !== undefined)
                              ? (
                                <div className={"dice"}>
                                  {firstIsBest ? <>
                                    <Die face={firstDie} size={"tiny"} />
                                    {secondIsBest ? null : <>
                                      +{["exactly", "atLeast"].includes(metric) ? `${Math.round(difference * 100)}%` : (Math.round(difference * 10) / 10)}
                                    </>}
                                  </>: null}
                                  {secondIsBest ? <>
                                    <Die face={secondDie} size={"tiny"} />
                                    {firstIsBest ? null : <>
                                      {["exactly", "atLeast"].includes(metric) ? `${Math.round(difference * 100)}%` : (Math.round(difference * 10) / 10)}
                                    </>}
                                  </>: null}
                                </div>
                              ) : "N/A"}
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              );
            })}
          </Table.Header>
        </Table>
      </Segment>
    );
  }

  getValue(evaluation: worms.Evaluation | undefined, metric: Metric, targetValue: number): number | undefined {
    switch (metric) {
      case "exactly":
        return evaluation?.exactResultOccurrences?.get(targetValue);
      case "atLeast":
        return evaluation?.minimumResultOccurrences?.get(targetValue);
      case "evOfAtLeast":
        return evaluation?.expectedValueOfAtLeast?.get(targetValue);
      case "expectedValue":
        return evaluation?.expectedValue;
    }
    return undefined;
  }
}
