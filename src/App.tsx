import React, {Component, createRef, RefObject} from "react";
import "./styles.scss";
import * as worms from "./worms";
import {CacheFetchingStatus, RemoteSearch, SearchInstance} from "./RemoteSearch";
import {Button, Card, Container, Header, Image} from "semantic-ui-react";
import {EvaluationControls, InitialStateModal, MultipleEvaluations, REvaluation, RState} from "./components";

const remoteSearch = RemoteSearch.default();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppProps {
}
interface AppState {
  state: worms.State,
  progress: number,
  evaluation: worms.Evaluation,
  searching: boolean,
  searchFinished: boolean,
  dicePickEvaluations: {pickedRoll: worms.RollResult, pickedCount: number, evaluation: worms.Evaluation}[] | null,
  cacheStatusMessages: {message: string, id: number}[],
  cacheStats: worms.EvaluationCacheStats,
}

export default class App extends Component<AppProps, AppState> {
  state: AppState = {
    state: worms.UnrolledState.initial(),
    progress: 1,
    evaluation: worms.Evaluation.empty(),
    searching: false,
    searchFinished: true,
    dicePickEvaluations: null,
    cacheStatusMessages: [],
    cacheStats: {hitCount: 0, missCount: 0, entryCount: 0},
  };

  initialStateModalRef: RefObject<InitialStateModal> = createRef();

  onSearchResult = (
    searching: boolean, searchFinished: boolean, progress: number, evaluation: worms.Evaluation,
    dicePickEvaluations: {pickedRoll: worms.RollResult, pickedCount: number, evaluation: worms.Evaluation}[] | null,
    cacheStats: worms.EvaluationCacheStats,
  ) => {
    this.setState({
      progress,
      evaluation: evaluation.toFixed(),
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
      state, progress, evaluation, searching, searchFinished, dicePickEvaluations, cacheStatusMessages, cacheStats,
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
              <Button.Group>
                <InitialStateModal
                  ref={this.initialStateModalRef}
                  size={"tiny"}
                  trigger={<Button>Change</Button>}
                  onStateChange={this.onStateChange}
                />
              </Button.Group>
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
          <Container textAlign={"center"}>
            <REvaluation evaluation={evaluation} diceCount={state.totalDiceCount} />
            {dicePickEvaluations ? <>
              <MultipleEvaluations
                rolledState={state as worms.RolledState}
                evaluationsAndPickedRolls={dicePickEvaluations}
                onSetUnrolledState={this.onStateChange}
              />
            </> : null}
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
}
