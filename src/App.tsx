import React, {Component} from "react";
import "./styles.scss";
import * as worms from "./worms";
import {RemoteSearch, SearchInstance} from "./RemoteSearch";
import {Button} from "semantic-ui-react";
import {CacheControls, InitialStateModal, RChest, REvaluation, SearchControls} from "./components";

const remoteSearch = RemoteSearch.default();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppProps {
}
interface AppState {
  initialUnrolledState: worms.UnrolledState,
  progress: number,
  evaluation: worms.Evaluation,
  searching: boolean,
  searchFinished: boolean,
  cacheStats: worms.EvaluationCacheStats,
}

export default class App extends Component<AppProps, AppState> {
  state = {
    initialUnrolledState: worms.UnrolledState.initial(),
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

  componentDidMount() {
    this.onReset();
  }

  componentWillUnmount() {
    this.searchInstance.removeSearch();
  }

  render() {
    const {
      initialUnrolledState, progress, evaluation, searching, searchFinished, cacheStats,
    } = this.state;
    return (
      <div className="App">
        <h2>Search</h2>
        <label>
          Initial state:
          <RChest chest={initialUnrolledState.chest} remainingDice={initialUnrolledState.remainingDiceCount} />
        </label>
        <InitialStateModal trigger={<Button>Change</Button>} onChangeInitialState={this.onChangeInitialState} />
        <SearchControls
          progress={progress}
          searching={searching}
          searchFinished={searchFinished}
          onSearchStep={this.onSearchStep}
          onSearchToggle={this.onSearchToggle}
          onSearchRestart={this.onSearchRestart}
        />
        <CacheControls cacheStats={cacheStats} searchInstance={this.searchInstance} />
        <br/>
        <REvaluation evaluation={evaluation} />
      </div>
    );
  }

  onChangeInitialState = (initialUnrolledState: worms.UnrolledState) => {
    this.setState({initialUnrolledState});
    this.searchInstance.setSearchUnrolledState(initialUnrolledState);
  };

  onReset = () => {
    const {initialUnrolledState} = this.state;
    this.searchInstance.setSearchUnrolledState(initialUnrolledState);
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

  onSearchRestart = () => {
    this.setState({searching: false, searchFinished: false});
    this.searchInstance.setSearchUnrolledState(this.state.initialUnrolledState);
  };

  startSearch() {
    this.searchInstance.startSearch();
  }

  stopSearch() {
    this.searchInstance.stopSearch();
  }
}
