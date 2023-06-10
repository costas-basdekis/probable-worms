import React, {ChangeEvent, Component, ReactNode} from "react";
import {Card, Container, Icon, Segment, Table} from "semantic-ui-react";
import * as worms from "../worms";
import {Die} from "./Die";
import {RChest} from "./RChest";
import _ from "underscore";
import {createSelector} from "reselect";
import {DiceComparisonEvaluations, DiceComparisonEvaluationsInfo} from "../RemoteSearch";
import classNames from "classnames";

interface DiceComparisonProps {
  unrolledState: worms.UnrolledState,
  requestDiceComparison: (unrolledState: worms.UnrolledState, firstDie: worms.RollResult, secondDie: worms.RollResult) => void,
}

const metrics = ["exactly", "atLeast", "evOfAtLeast", "expectedValue"] as const;
type Metric = typeof metrics[number];
const metricLabelMap: {[key in Metric]: string} = {
  exactly: "Exactly",
  atLeast: "At least",
  evOfAtLeast: "EV of at least",
  expectedValue: "Expected Value",
};

interface DiceComparisonState {
  firstDie: worms.RollResult,
  secondDie: worms.RollResult,
  metric: Metric,
  targetValue: number,
  diceComparisonEvaluationsInfo: DiceComparisonEvaluationsInfo | null,
  calculating: boolean,
}

export class DiceComparison extends Component<DiceComparisonProps, DiceComparisonState> {
  state: DiceComparisonState = {
    firstDie: 4,
    secondDie: worms.Worm,
    metric: "atLeast",
    targetValue: 21,
    diceComparisonEvaluationsInfo: null,
    calculating: false,
  };

  setDiceComparisonEvaluationsInfo = (diceComparisonEvaluationsInfo: DiceComparisonEvaluationsInfo) => {
    const {unrolledState} = this.props;
    const {firstDie, secondDie} = this.state;
    if (diceComparisonEvaluationsInfo.unrolledState.equals(unrolledState) && diceComparisonEvaluationsInfo.firstDie === firstDie && diceComparisonEvaluationsInfo.secondDie === secondDie) {
      this.setState({diceComparisonEvaluationsInfo, calculating: false});
    }
  };

  diceComparisonEvaluationsSelector = createSelector(
    ({requestDiceComparison}: DiceComparisonProps) => requestDiceComparison,
    ({unrolledState}: DiceComparisonProps) => unrolledState,
    (_1: DiceComparisonProps, {firstDie}: DiceComparisonState) => firstDie,
    (_1: DiceComparisonProps, {secondDie}: DiceComparisonState) => secondDie,
    (_1: DiceComparisonProps, {diceComparisonEvaluationsInfo}: DiceComparisonState) => diceComparisonEvaluationsInfo,
    (requestDiceComparison, unrolledState, firstDie, secondDie, diceComparisonEvaluationsInfo): {firstEvaluations: DiceComparisonEvaluations, secondEvaluations: DiceComparisonEvaluations} | null => {
      if (diceComparisonEvaluationsInfo?.firstDie === firstDie && diceComparisonEvaluationsInfo?.secondDie === secondDie) {
        return {
          firstEvaluations: diceComparisonEvaluationsInfo.firstEvaluations,
          secondEvaluations: diceComparisonEvaluationsInfo.secondEvaluations,
        };
      }
      window.setTimeout(() => {
        if (unrolledState.chest.canAdd(firstDie) && unrolledState.chest.canAdd(secondDie)) {
          requestDiceComparison(unrolledState, firstDie, secondDie);
          this.setState({calculating: true});
        } else {
          this.setState({calculating: false});
        }
      }, 0);
      return null;
    },
  );

  get diceComparisonEvaluations() {
    return this.diceComparisonEvaluationsSelector(this.props, this.state);
  }

  targetValueOptionsSelector = createSelector(
    ({unrolledState}: DiceComparisonProps) => unrolledState,
    (unrolledState): ReactNode => {
      return _.range(1, unrolledState.totalDiceCount * 5 + 1).map(total => (
        <option key={total} value={total}>{total}</option>
      ));
    },
  );

  get targetValueOptions() {
    return this.targetValueOptionsSelector(this.props);
  }

  metricOptions = metrics.map(metric => (
    <option key={metric} value={metric}>{metricLabelMap[metric]}</option>
  ));

  render() {
    const {diceComparisonEvaluations} = this;
    const {unrolledState} = this.props;
    const {firstDie, secondDie, metric, targetValue, calculating} = this.state;
    return <>
      <Container>
        <Card centered>
          <Card.Content>
            <RChest chest={unrolledState.chest} remainingDice={unrolledState.remainingDiceCount} />
            <br/>
            <label>
              First die:{" "}
              <select value={firstDie} onChange={this.onFirstDieChange}>
                {worms.rollResults.map(roll => (
                  <option key={roll} value={roll} disabled={roll === secondDie || !unrolledState.chest.canAdd(roll)}>{roll}</option>
                ))}
              </select>
            </label>
            {" "}
            <label>
              Second die:{" "}
              <select value={secondDie} onChange={this.onSecondDieChange}>
                {worms.rollResults.map(roll => (
                  <option key={roll} value={roll} disabled={roll === firstDie || !unrolledState.chest.canAdd(roll)}>{roll}</option>
                ))}
              </select>
            </label>
            <br/>
            <label>
              Metric:{" "}
              <select value={metric} onChange={this.onMetricChange}>{this.metricOptions}</select>
              {metric !== "expectedValue" ? (
                <select value={targetValue} onChange={this.onTargetValueChange}>{this.targetValueOptions}</select>
              ) : null}
            </label>
          </Card.Content>
        </Card>
      </Container>
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
    </>;
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

  onFirstDieChange = (ev: ChangeEvent<HTMLSelectElement>) => {
    const firstDie = this.parseDie(ev.target.value);
    if (!firstDie) {
      return;
    }
    this.setState({firstDie});
  };

  onSecondDieChange = (ev: ChangeEvent<HTMLSelectElement>) => {
    const secondDie = this.parseDie(ev.target.value);
    if (!secondDie) {
      return;
    }
    this.setState({secondDie});
  };

  parseDie(value: string): worms.RollResult | null {
    if (value === worms.Worm) {
      return worms.Worm;
    }
    const parsedDie = parseInt(value, 10) as worms.RollResult;
    if (!worms.rollResults.includes(parsedDie)) {
      return null;
    }
    return parsedDie;
  }

  onMetricChange = (ev: ChangeEvent<HTMLSelectElement>) => {
    this.setState({metric: ev.target.value as Metric});
  };

  onTargetValueChange = (ev: ChangeEvent<HTMLSelectElement>) => {
    this.setState({targetValue: parseInt(ev.target.value, 10)});
  };
}
