import React, {Component} from "react";
import {Button, Header, Modal, Segment} from "semantic-ui-react";

export class Help extends Component {
  render() {
    return (
      <Modal trigger={<Button>What do these numbers mean?</Button>}>
        <Segment>
          <Header as={"h2"}>What's the purpose of this tool?</Header>
          <p>
            This tool is designed to aid decisions in the game{" "}
            <a href={"https://boardgamegeek.com/boardgame/15818/pickomino"}>Heckmeck™</a>, but only as far as
            deciding which dice to pick, and when to stop, not how to decide which tile to go after.
          </p>
          <p>
            You should use this for tool to decide which dice to pick after a roll, after you've set a target on what
            you want to achieve. Since there are different outcomes that matter (e.g. I want to steal a 26 vs I need to
            get at least 25 to get a tile from the rack).
          </p>
          <Header as={"h2"}>What do the numbers mean?</Header>
          <p>
            We consider 2 types of "states":
            <ul>
              <li>An "unrolled" state, before we roll the remaining dice</li>
              <li>A "rolled" state, after we've rolled the dice, but before we've made a choice</li>
            </ul>
          </p>
          <p>
            For each state we calculate some probabilities, and expected values, to be able to compare our chances of
            hitting our targets. A target could be one of the two:
            <ul>
              <li>I want to hit exactly X (to steal a tile)</li>
              <li>I want to hit at least X (to take a tile from the rack)</li>
            </ul>
          </p>
          <p>
            These are the values we calculate:
            <ul>
              <li>Expected value: what's the average score we can hit?</li>
              <li>Hit exactly X probability: what's our probability of arriving on a score exactly?</li>
              <li>Hit at least X probability: what's our probability of arriving on a minimum of a score?</li>
              <li>
                Expected value discarding outcomes beneath X: what's the average score we can hit if we disregard any
                outcomes with score beneath X?
              </li>
            </ul>
          </p>
          <Header as={"h2"}>How to use the tool</Header>
          <p>
            After you roll the dice, pick a target you want to go after. It helps you stick to a target between rolls,
            but feel free to switch goals if that increases your chances/outcomes.
          </p>
          <p>
            Look at the graphs, and compare the options based on your metric:
            <ul>
              <li>If your target is to hit exactly X, compare the "Exactly" graph lines</li>
              <li>If your target is to hit at least X, compare the "At Least" and "EV Of At Least" graph lines</li>
            </ul>
          </p>
          <Header as={"h2"}>How did you calculate these?</Header>
          <p>
            You can read the{" "}
            <a href={"https://github.com/costas-basdekis/probable-worms"}>explanation in the Github repo</a>
          </p>
        </Segment>
      </Modal>
    );
  }
}
