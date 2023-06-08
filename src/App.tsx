import React, {Component, createRef, RefObject, SyntheticEvent} from "react";
import "./styles.scss";
import * as worms from "./worms";
import {CacheFetchingStatus, RemoteSearch, SearchInstance} from "./RemoteSearch";
import {Button, Card, Container, DropdownProps, Header, Image, Select} from "semantic-ui-react";
import {
  EvaluationControls,
  Help,
  InitialStateModal,
  MultipleEvaluations,
  REvaluation,
  RState,
  TargetType
} from "./components";
import _ from "underscore";

const remoteSearch = RemoteSearch.default();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppProps {
}
interface AppState {
  state: worms.State,
  progress: number,
  evaluation: worms.Evaluation,
  preRollEvaluation: worms.Evaluation,
  searching: boolean,
  searchFinished: boolean,
  dicePickEvaluations: {pickedRoll: worms.RollResult, pickedCount: number, evaluation: worms.Evaluation, total: number}[] | null,
  cacheStatusMessages: {message: string, id: number}[],
  cacheStats: worms.EvaluationCacheStats,
  targetType: TargetType,
  targetValue: number,
}

export default class App extends Component<AppProps, AppState> {
  state: AppState = {
    state: worms.UnrolledState.initial(),
    progress: 1,
    evaluation: worms.Evaluation.empty(),
    preRollEvaluation: worms.Evaluation.empty(),
    searching: false,
    searchFinished: true,
    dicePickEvaluations: null,
    cacheStatusMessages: [],
    cacheStats: {hitCount: 0, missCount: 0, entryCount: 0},
    targetType: "atLeast",
    targetValue: 21,
  };

  initialStateModalRef: RefObject<InitialStateModal> = createRef();

  onSearchResult = (
    searching: boolean, searchFinished: boolean, progress: number, evaluation: worms.Evaluation,
    preRollEvaluation: worms.Evaluation,
    dicePickEvaluations: {pickedRoll: worms.RollResult, pickedCount: number, evaluation: worms.Evaluation, total: number}[] | null,
    cacheStats: worms.EvaluationCacheStats,
  ) => {
    this.setState({
      progress,
      evaluation: evaluation.toFixed(),
      preRollEvaluation: preRollEvaluation.toFixed(),
      searchFinished,
      searching,
      dicePickEvaluations,
      cacheStats,
    });
  };

  onCacheFetchingProgress = (diceCount: number, status: CacheFetchingStatus) => {
    let message: string;
    switch (status) {
      case "fetching":
        message = "Fetching cache...";
        break;
      case "success":
        message = "Cache is ready!";
        break;
      case "failure":
        message = "Cache failed to load";
        break;
      default:
        return;
    }
    this.setState(({cacheStatusMessages}) => {
      const id = (cacheStatusMessages[cacheStatusMessages.length - 1]?.id ?? 0) + 1;
      window.setTimeout(() => {
        this.setState(({cacheStatusMessages}) => ({
          cacheStatusMessages: cacheStatusMessages.filter(message => message.id !== id),
        }));
      }, 10000);
      return {
        cacheStatusMessages: [...cacheStatusMessages, {message, id}],
      };
    });
  };

  searchInstance: SearchInstance = remoteSearch.newInstance(this.onSearchResult, this.onCacheFetchingProgress);

  componentDidMount() {
    this.onReset();
  }

  componentWillUnmount() {
    this.searchInstance.removeSearch();
  }

  render() {
    const {
      state, progress, evaluation, preRollEvaluation, searching, searchFinished, dicePickEvaluations,
      cacheStatusMessages, cacheStats, targetType, targetValue,
    } = this.state;
    const cacheStatusMessage = cacheStatusMessages[cacheStatusMessages.length - 1]?.message ?? null;
    return (
      <div className="App">
        <Header as={"h1"} textAlign={"center"}>
          <Image src={`${process.env.PUBLIC_URL}/worm512.png`} />
          Probable worms
          <Image src={`${process.env.PUBLIC_URL}/worm512.png`} />
        </Header>
        <Container textAlign={"center"}>
          <Card centered>
            <Card.Content>
              <Card.Header>
                Initial State
              </Card.Header>
              <Card.Description>
                <RState size={"tiny"} state={state} center />
              </Card.Description>
            </Card.Content>
            <Card.Content extra>
              <div>
                <InitialStateModal
                  ref={this.initialStateModalRef}
                  size={"tiny"}
                  trigger={<Button>Change</Button>}
                  onStateChange={this.onStateChange}
                />
                <Button
                  onClick={this.onRandomRollClick}
                  disabled={!state.unrolledState.remainingDiceCount}
                >
                  {state.type === "unrolled" ? "Random Roll" : "Reroll"}
                </Button>
              </div>
            </Card.Content>
            <Card.Content extra>
              <EvaluationControls
                progress={progress}
                searching={searching}
                searchFinished={searchFinished}
                onSearchStep={this.onSearchStep}
                onSearchToggle={this.onSearchToggle}
                onSearchRestart={this.onSearchRestart}
                cacheStatusMessage={cacheStatusMessage}
                cacheStats={cacheStats}
                searchInstance={this.searchInstance}
              />
            </Card.Content>
          </Card>
          <Help />
          <br/>
          <br/>
          <Container textAlign={"center"}>
            <Container>
              <Card centered>
                <Card.Content>
                  <Card.Header>Target</Card.Header>
                  <Button.Group>
                    <Button positive={targetType === "exactly"} onClick={this.onExactlyClick}>Exactly</Button>
                    <Button.Or />
                    <Button positive={targetType === "atLeast"} onClick={this.onAtLeastClick}>At Least</Button>
                  </Button.Group>
                  <Select
                    options={_.range(1, state.totalDiceCount * 5).map(total => ({text: `${total}`, value: total}))}
                    value={targetValue}
                    onChange={this.onTargetValueChange}
                  />
                </Card.Content>
              </Card>
            </Container>
            <MultipleEvaluations
              preRollEvaluation={preRollEvaluation}
              preRollTotal={state.runningTotal}
              rolledState={state as worms.RolledState}
              evaluationsAndPickedRolls={dicePickEvaluations}
              onSetUnrolledState={this.onStateChange}
              targetType={targetType}
              targetValue={targetValue}
            />
            <REvaluation evaluation={evaluation} total={state.runningTotal} diceCount={state.totalDiceCount} />
          </Container>
        </Container>
      </div>
    );
  }

  onStateChange = (state: worms.State) => {
    this.setState({state});
    this.searchInstance.setSearchState(state);
    this.initialStateModalRef.current?.updateState(state);
  };

  onRandomRollClick = () => {
    this.setState(({state}) => {
      const unrolledState = state.unrolledState;
      if (!unrolledState.remainingDiceCount) {
        return null;
      }
      return {state: unrolledState.withRandomRoll()};
    }, () => {
      const {state} = this.state;
      this.searchInstance.setSearchState(state);
      this.initialStateModalRef.current?.updateState(state);
    });
  };

  onReset = () => {
    const {state} = this.state;
    this.searchInstance.setSearchState(state);
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
    this.searchInstance.setSearchState(this.state.state);
  };

  startSearch() {
    this.searchInstance.startSearch();
  }

  stopSearch() {
    this.searchInstance.stopSearch();
  }

  onExactlyClick = () => {
    this.setState({targetType: "exactly"});
  };

  onAtLeastClick = () => {
    this.setState({targetType: "atLeast"});
  };

  onTargetValueChange = (ev: SyntheticEvent<HTMLElement, Event>, {value}: DropdownProps) => {
    this.setState({targetValue: parseInt(value as string, 10)});
  };
}
