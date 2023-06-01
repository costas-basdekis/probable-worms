import React, {ChangeEvent, Component, createRef, RefObject} from "react";
import classnames from "classnames";
import _ from "underscore";
import "./styles.scss";
import * as worms from "./worms";
import {RemoteSearch, SearchInstance} from "./RemoteSearch";
import {LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip} from 'recharts';
import {createSelector} from "reselect";

type PipColumnType = "start" | "middle" | "end" | null;
interface PipsConfiguration {
  dots: [number, number, number],
  columns?: [PipColumnType, PipColumnType, PipColumnType],
}

const remoteSearch = RemoteSearch.default();

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
        {!chest.diceCount && !remainingDice ? (
          "No Dice Aside"
        ) : null}
      </div>
    );
  }
}

interface REvaluationProps {
  evaluation: worms.Evaluation,
}
class REvaluation extends Component<REvaluationProps> {
  maxTotalSelector = createSelector(
    ({evaluation}: REvaluationProps) => evaluation,
    (evaluation): number => {
      return Math.max(
        0,
        Math.max(
          ...evaluation.exactResultOccurrences.keys(),
          ...evaluation.minimumResultOccurrences.keys(),
        ),
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

  exactRoundedPercentagesEntriesSelector = createSelector(
    ({evaluation}: REvaluationProps) => evaluation,
    this.totalsSelector,
    (evaluation, totals): [number, number][] => {
      return totals.map(
        total => [total, Math.floor((evaluation.exactResultOccurrences.get(total) || 0) * 100)])
    },
  );

  get exactRoundedPercentagesEntries(): [number, number][] {
    return this.exactRoundedPercentagesEntriesSelector(this.props);
  }

  atLeastRoundedPercentagesEntriesSelector = createSelector(
    ({evaluation}: REvaluationProps) => evaluation,
    this.totalsSelector,
    (evaluation, totals): [number, number][] => {
      return totals.map(
        total => [total, total === 0 ? 100 : Math.floor((evaluation.minimumResultOccurrences.get(total) || 0) * 100)])
    },
  );

  get atLeastRoundedPercentagesEntries(): [number, number][] {
    return this.atLeastRoundedPercentagesEntriesSelector(this.props);
  }

  render() {
    const {evaluation} = this.props;
    const {maxTotal, totals, exactRoundedPercentagesEntries, atLeastRoundedPercentagesEntries} = this;
    return <>
      <REvaluationTable
        evaluation={evaluation}
        maxTotal={maxTotal}
        totals={totals}
        exactRoundedPercentagesEntries={exactRoundedPercentagesEntries}
        atLeastRoundedPercentagesEntries={atLeastRoundedPercentagesEntries}
      />
      <REvaluationChart
        evaluation={evaluation}
        maxTotal={maxTotal}
        totals={totals}
        exactRoundedPercentagesEntries={exactRoundedPercentagesEntries}
        atLeastRoundedPercentagesEntries={atLeastRoundedPercentagesEntries}
      />
    </>;
  }
}

interface REvaluationTableProps {
  evaluation: worms.Evaluation,
  maxTotal: number,
  totals: number[],
  exactRoundedPercentagesEntries: [number, number][],
  atLeastRoundedPercentagesEntries: [number, number][],
}

class REvaluationTable extends Component<REvaluationTableProps> {
  render() {
    const {totals, exactRoundedPercentagesEntries, atLeastRoundedPercentagesEntries} = this.props;
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
          {exactRoundedPercentagesEntries.map(([total, percentage]) => (
            <td key={total}>{percentage}%</td>
          ))}
        </tr>
        <tr>
          <th>At least</th>
          {atLeastRoundedPercentagesEntries.map(([total, percentage]) => (
            <td key={total}>{percentage}%</td>
          ))}
        </tr>
        </tbody>
      </table>
    );
  }
}

interface REvaluationChartProps {
  evaluation: worms.Evaluation,
  maxTotal: number,
  totals: number[],
  exactRoundedPercentagesEntries: [number, number][],
  atLeastRoundedPercentagesEntries: [number, number][],
}

class REvaluationChart extends Component<REvaluationChartProps> {
  chartDataSelector = createSelector(
    ({totals}: REvaluationChartProps) => totals,
    ({exactRoundedPercentagesEntries}: REvaluationChartProps) => exactRoundedPercentagesEntries,
    ({atLeastRoundedPercentagesEntries}: REvaluationChartProps) => atLeastRoundedPercentagesEntries,
    (totals, exactRoundedPercentagesEntries, atLeastRoundedPercentagesEntries): {total: number, exactly: number, atLeast: number}[] => {
      return totals.map(total => ({
        total,
        exactly: exactRoundedPercentagesEntries[total][1],
        atLeast: atLeastRoundedPercentagesEntries[total][1],
      }));
    },
  );

  get chartData(): {total: number, exactly: number, atLeast: number}[] {
    return this.chartDataSelector(this.props);
  }

  render() {
    const {chartData} = this;
    return (
      <LineChart width={600} height={300} data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <Line type={"monotone"} dataKey={"exactly"} stroke={"#8884d8"} isAnimationActive={false} />
        <Line type={"monotone"} dataKey={"atLeast"} stroke={"#d88884"} isAnimationActive={false} />
        <CartesianGrid stroke={"#ccc"} strokeDasharray={"5 5"} />
        <XAxis dataKey={"total"} />
        <YAxis />
        <Tooltip />
      </LineChart>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppProps {
}
interface AppState {
  initialChest: worms.Chest,
  remainingDice: number,
  initialUnrolledState: worms.UnrolledState,
  progress: number,
  evaluation: worms.Evaluation,
  searching: boolean,
  searchFinished: boolean,
  cacheStats: worms.EvaluationCacheStats,
}

export default class App extends Component<AppProps, AppState> {
  loadCacheFileRef: RefObject<HTMLInputElement> = createRef();

  state = {
    initialChest: worms.Chest.initial(),
    remainingDice: 8,
    initialUnrolledState: worms.UnrolledState.empty(),
    progress: 1,
    evaluation: worms.Evaluation.empty(),
    searching: false,
    searchFinished: true,
    cacheStats: {hitCount: 0, missCount: 0, entryCount: 0},
  };

  onSearchResult = (
    searching: boolean, searchFinished: boolean, progress: number, evaluation: worms.Evaluation,
    cacheStats: worms.EvaluationCacheStats,
  ) => {
    this.setState({
      progress,
      evaluation: evaluation.toFixed(),
      searchFinished,
      searching,
      cacheStats,
    });
  };

  searchInstance: SearchInstance = remoteSearch.newInstance(this.onSearchResult);

  componentWillUnmount() {
    this.searchInstance.removeSearch();
  }

  render() {
    const {
      initialChest, remainingDice, initialUnrolledState, progress, evaluation, searching, searchFinished, cacheStats,
    } = this.state;
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
          <RChest chest={initialUnrolledState.chest} remainingDice={initialUnrolledState.remainingDiceCount} />
        </label>
        <label>
          Progress: {Math.floor(progress * 100)}%
          ({Math.floor(cacheStats.hitCount / ((cacheStats.hitCount + cacheStats.missCount) || 1) * 100)}%
          cache hit rate{" - "}
          {cacheStats.hitCount}/{(cacheStats.hitCount + cacheStats.missCount)} with {cacheStats.entryCount} entries)
        </label>
        {searching ? (
          searchFinished ? (
            <button disabled>Search finished</button>
          ) : (
            <button onClick={this.onSearchToggle}>Pause search</button>
          )
        ) : (
          <>
            <button onClick={this.onSearchStep} disabled={searchFinished}>Search step</button>
            <button onClick={this.onSearchToggle}>Start search</button>
          </>
        )}
        <button onClick={this.onDownloadCache}>Download cache</button>
        <label>
          <input ref={this.loadCacheFileRef} type={"file"} />
          <button onClick={this.onLoadCache}>Load cache</button>
          <button onClick={this.onClearCache}>Clear cache</button>
        </label>
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
      const initialUnrolledState = new worms.UnrolledState(initialChest, remainingDice);
      const evaluator = worms.UnrolledStateEvaluator.fromUnrolledStateLazy(initialUnrolledState, true);
      const progress = evaluator.getCompletionProgress();
      this.searchInstance.setSearchUnrolledState(initialUnrolledState);
      return {
        initialUnrolledState,
        progress,
        evaluation: evaluator.compilePartialEvaluation(),
        searchFinished: evaluator.finished,
      };
    });
  };

  onSearchStep = () => {
    this.searchInstance.stepSearch();
  };

  onSearchToggle = () => {
    if (this.state.searching) {
      this.stopSearch();
    } else if (!this.state.searchFinished) {
      this.startSearch();
    }
  };

  onDownloadCache = () => {
    this.searchInstance.downloadEvaluationCache();
  };

  onLoadCache = async () => {
    if (!this.loadCacheFileRef?.current?.files?.length) {
      alert("No file selected");
      return;
    }
    const file = this.loadCacheFileRef.current.files[0];
    const content = await file.text();
    this.searchInstance.loadEvaluationCache(content);
  };

  onClearCache = () => {
    this.searchInstance.clearEvaluationCache();
  };

  startSearch() {
    this.searchInstance.startSearch();
  }

  stopSearch() {
    this.searchInstance.stopSearch();
  }
}
