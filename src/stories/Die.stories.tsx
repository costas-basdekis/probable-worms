// noinspection JSUnusedGlobalSymbols

import React from "react";
import type {Meta, StoryObj} from '@storybook/react';

import {Die, DieProps} from "../components";
import {Worm} from "../worms";

export default {
  title: 'Components/Die',
  component: Die,
} as Meta<typeof Die>;

type Story = StoryObj<typeof Die>;

const render = (props: Partial<DieProps>) => {
  return (
    <div className={"dice"}>
      <Die {...props} />
      <Die face={1} {...props} />
      <Die face={2} {...props} />
      <Die face={3} {...props} />
      <Die face={4} {...props} />
      <Die face={5} {...props} />
      <Die face={Worm} special {...props} />
    </div>
  )
};

export const Tiny: Story = {
  render,
  args: {
    tiny: true,
  },
};

export const Small: Story = {
  render,
  args: {
    small: true,
  },
};

export const Medium: Story = {
  render,
  args: {
    medium: true,
  },
};
