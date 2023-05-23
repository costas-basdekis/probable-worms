import React, {ChangeEvent, Component} from "react";
import classnames from "classnames";
import _ from "underscore";
import "./styles.scss";
import * as worms from "./worms";


type PipColumnType = "start" | "middle" | "end" | null;
interface PipsConfiguration {
  dots: [number, number, number],
  columns?: [PipColumnType, PipColumnType, PipColumnType],
}


class DiePips extends Component<{face: number}> {
  static pipsConfigurations: {[key: number]: PipsConfiguration} = {
    1: {dots: [0, 1, 0], columns: [null, "middle", null]},
    2: {dots: [1, 0, 1], columns: ["start", null, "end"]},
    3: {dots: [1, 1, 1], columns: ["start", "middle", "end"]},
    4: {dots: [2, 0, 2]},
    5: {dots: [2, 1, 2], columns: [null, "middle", null]},
    6: {dots: [3, 0, 3]},
  };

  render() {
    const {face} = this.props;
    const pipConfiguration = DiePips.pipsConfigurations[face];
    if (!pipConfiguration) {
      throw new Error(`Unable to get pip configuration for face '${face}'`);
    }
    return _.range(3).map(columnIndex => (
      <span key={columnIndex} className={classnames("column", pipConfiguration.columns?.[columnIndex])}>
        {_.range(pipConfiguration.dots[columnIndex]).map(dotIndex => <span key={dotIndex} className={"dot"} />)}
      </span>
    ));
  }
}


class Die extends Component<{face: number | string, medium?: boolean, small?: boolean, tiny?: boolean, special?: boolean}> {
  render() {
    const {face, medium = false, small = false, tiny = false, special = false} = this.props;
    return (
      <span className={classnames("die", {medium, small, tiny})}>
        <span className={classnames("face", {"letter-face": typeof face !== "number", special})}>
          {typeof face === "number" ? <DiePips face={face}/> : <span className={"letter"}>{face}</span>}
        </span>
      </span>
    );
  }
}

interface InitialCountSelectProps {
  initialChest: worms.Chest,
  roll: worms.RollResult,
  onChange: (face: worms.RollResult, count: number) => void,
}

class InitialCountSelect extends Component<InitialCountSelectProps> {
  render() {
    const {initialChest, roll} = this.props;
    return (
      <label>
        {roll}:
        <select value={initialChest.get(roll)} onChange={this.onChange}>
          {_.range(11).map(count => <option key={count} value={count}>{count}</option>)}
        </select>
      </label>
    );
  }

  onChange = ({target: {value}}: ChangeEvent<HTMLSelectElement>) => {
    this.props.onChange(this.props.roll, parseInt(value, 10));
  };
}

interface RChestProps {
  chest: worms.Chest,
  remainingDice: number,
}

class RChest extends Component<RChestProps> {
  render() {
    const {chest, remainingDice} = this.props;
    return (
      <div className={"dice"}>
        {chest.dice.map((roll, index) => (
          <Die key={index} face={roll} special={roll === worms.Worm} tiny />
        ))}
        {_.range(remainingDice).map(index => (
          <Die key={index} face={""} tiny />
        ))}
      </div>
    );
  }
}

interface REvaluationProps {
  evaluation: worms.Evaluation,
}

class REvaluation extends Component<REvaluationProps> {
  render() {
    const {evaluation} = this.props;
    const maxTotal = Math.max(0, Math.max(...evaluation.exactResultOccurrences.keys(), ...evaluation.minimumResultOccurrences.keys()));
    const totals = _.range(maxTotal + 1);
    return (
      <table>
        <thead>
          <tr>
            <th/>
            {totals.map(total => (
              <th key={total}>{total}</th>
            ))}
          </tr>
        </thead>
        <tbody>
        <tr/>
        <tr>
          <th>Exactly</th>
          {totals.map(total => (
            <td key={total}>{Math.floor((evaluation.exactResultOccurrences.get(total) || 0) * 100)}%</td>
          ))}
        </tr>
        <tr>
          <th>At least</th>
          {totals.map(total => (
            <td key={total}>{Math.floor((evaluation.minimumResultOccurrences.get(total) || 0) * 100)}%</td>
          ))}
        </tr>
        </tbody>
      </table>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppProps {
}
interface AppState {
  initialChest: worms.Chest,
  remainingDice: number,
  evaluator: worms.StateEvaluator,
  progress: number,
  evaluation: worms.Evaluation,
  searchFinished: boolean,
}

export default class App extends Component<AppProps, AppState> {
  state = {
    initialChest: worms.Chest.initial(),
    remainingDice: 8,
    evaluator: worms.StateEvaluator.fromState(worms.State.empty()),
    progress: 1,
    evaluation: worms.Evaluation.empty(),
    searchFinished: true,
  };

  render() {
    const {initialChest, remainingDice, evaluator, progress, evaluation, searchFinished} = this.state;
    return (
      <div className="App">
        <label>Initial Chest</label>
        <br/>
        {worms.rollResults.map(face => (
          <InitialCountSelect
            key={face}
            initialChest={initialChest}
            roll={face}
            onChange={this.onInitialChestCountChange}
          />
        ))}
        <label>
          Remaining:
          <select value={remainingDice} onChange={this.onRemainingDiceChange}>
            {_.range(11).map(count => <option key={count} value={count}>{count}</option>)}
          </select>
        </label>
        <RChest chest={initialChest} remainingDice={remainingDice} />
        <button onClick={this.onReset}>Reset search</button>
        <h2>Search</h2>
        <label>
          Initial state:
          <RChest chest={evaluator.state.chest} remainingDice={evaluator.state.remainingDiceCount} />
        </label>
        <label>Progress: {Math.floor(progress * 100)}%</label>
        <button onClick={this.onSearchStep} disabled={searchFinished}>Search step</button>
        <label>Evaluation:</label>
        <br/>
        <REvaluation evaluation={evaluation} />
        {/*<div className={"dice"}>*/}
        {/*  {_.range(1, 7).map(face => <Die key={face} face={face} />)}*/}
        {/*  <Die face={"W"} special />*/}
        {/*</div>*/}
        {/*<div className={"dice"}>*/}
        {/*  {_.range(1, 7).map(face => <Die key={face} face={face} medium />)}*/}
        {/*  <Die face={"W"} medium special />*/}
        {/*</div>*/}
        {/*<div className={"dice"}>*/}
        {/*  {_.range(1, 7).map(face => <Die key={face} face={face} small />)}*/}
        {/*  <Die face={"W"} small special />*/}
        {/*</div>*/}
        {/*<div className={"dice"}>*/}
        {/*  {_.range(1, 7).map(face => <Die key={face} face={face} tiny />)}*/}
        {/*  <Die face={"W"} tiny special />*/}
        {/*</div>*/}
      </div>
    );
  }

  onInitialChestCountChange = (roll: worms.RollResult, count: number) => {
    this.setState(({initialChest, remainingDice}) => {
      const newInitialChest = initialChest.replacing(roll, count);
      return {
        initialChest: newInitialChest,
        remainingDice: Math.max(0, Math.min(10, initialChest.diceCount + remainingDice - newInitialChest.diceCount)),
      };
    });
  };

  onRemainingDiceChange = ({target: {value}}: ChangeEvent<HTMLSelectElement>) => {
    this.setState({remainingDice: parseInt(value, 10)});
  };

  onReset = () => {
    this.setState(({initialChest, remainingDice}) => {
      const state = new worms.State(initialChest, remainingDice);
      const evaluator = worms.StateEvaluator.fromState(state);
      const progress = evaluator.getCompletionProgress();
      return {
        evaluator: evaluator,
        progress,
        evaluation: evaluator.compilePartialEvaluation(),
        searchFinished: evaluator.finished,
      };
    });
  };

  onSearchStep = () => {
    this.setState(({evaluator}) => {
      if (evaluator.finished) {
        return null;
      }
      evaluator.processOne();
      this.setState({
        progress: evaluator.getCompletionProgress(),
        evaluation: evaluator.compilePartialEvaluation(),
        searchFinished: evaluator.finished,
      });
    });
  };
}
