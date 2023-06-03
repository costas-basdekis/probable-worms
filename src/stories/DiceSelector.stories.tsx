// noinspection JSUnusedGlobalSymbols

import type {Meta, StoryObj} from '@storybook/react';

import {DiceSelector} from "../components";

export default {
  title: 'Components/DiceSelector',
  component: DiceSelector,
} as Meta<typeof DiceSelector>;

type Story = StoryObj<typeof DiceSelector>;

export const Tiny: Story = {
  args: {
    count: 8,
    size: "tiny",
  },
};

export const Small: Story = {
  args: {
    count: 8,
    size: "small",
  },
};

export const Medium: Story = {
  args: {
    count: 8,
    size: "medium",
  },
};
