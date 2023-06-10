import React, {ChangeEvent, Component, ReactNode} from "react";
import {Card, Container} from "semantic-ui-react";
import * as worms from "../worms";
import {RChest} from "./RChest";
import _ from "underscore";
import {createSelector} from "reselect";
import {DiceComparisonEvaluations, DiceComparisonEvaluationsInfo} from "../RemoteSearch";
import {DiceComparisonTable} from "./DiceComparisonTable";

interface DiceComparisonProps {
  unrolledState: worms.UnrolledState,
  requestDiceComparison: (unrolledState: worms.UnrolledState, firstDie: worms.RollResult, secondDie: worms.RollResult) => void,
}

const metrics = ["exactly", "atLeast", "evOfAtLeast", "expectedValue"] as const;
export type Metric = typeof metrics[number];
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
      <DiceComparisonTable
        unrolledState={unrolledState}
        diceComparisonEvaluations={diceComparisonEvaluations}
        firstDie={firstDie}
        secondDie={secondDie}
        metric={metric}
        targetValue={targetValue}
        calculating={calculating}
      />
    </>;
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
