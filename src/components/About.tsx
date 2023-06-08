import React, {Component} from "react";
import {Button, Header, Modal, Segment} from "semantic-ui-react";

export class About extends Component {
  render() {
    return (
      <Modal trigger={<Button icon={"info"} color={"blue"}>About</Button>}>
        <Segment>
          <Header as={"h2"}>About</Header>
          <p>
            Developed by <a href={"https://github.com/costas-basdekis/"}>Costas Basdekis</a>, the project's source{" "}
            code can be found on <a href={"github.com/costas-basdekis/probable-worms"}>Github</a>.
          </p>
          <Header as={"h3"}>Credits</Header>
          <p>
            Worm favicon by{" "}
            <a href={"https://www.flaticon.com/free-icons/worm"} title={"worm icons"}>
              Worm icons created by Freepik - Flaticon
            </a>
          </p>
        </Segment>
      </Modal>
    );
  }
}
