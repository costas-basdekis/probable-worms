// noinspection JSUnusedGlobalSymbols

import type {Meta, StoryObj} from '@storybook/react';

import {DieSize, InitialStateSelector} from "../components";
import React, {useState} from "react";
import * as worms from "../worms";
import {Chest, DiceRoll} from "../worms";

export default {
  title: 'Components/InitialStateSelector',
  component: InitialStateSelector,
} as Meta<typeof InitialStateSelector>;

type Story = StoryObj<{size: DieSize}>;

const render = ({size}: {size: DieSize}) => {
  const [initialChest, setInitialChest] = useState(worms.Chest.initial());
  const [diceCount, setDiceCount] = useState(8);
  const [remainingDice, setRemainingDice] = useState(8);
  const onDiceChange = (diceCounts: DiceRoll, remainingDice: number) => {
    setInitialChest(Chest.fromDiceRoll(diceCounts));
    setRemainingDice(remainingDice);
  };
  const onDiceCountChange = (diceCount :number) => {
    setDiceCount(diceCount);
  };
  return (
    <InitialStateSelector
      initialChest={initialChest}
      diceCount={diceCount}
      remainingDice={remainingDice}
      onDiceChange={onDiceChange}
      onDiceCountChange={onDiceCountChange}
      size={size}
    />
  );
};

export const Tiny: Story = {
  render,
  args: {
    size: "tiny",
  },
};

export const Small: Story = {
  render,
  args: {
    size: "small",
  },
};

export const Medium: Story = {
  render,
  args: {
    size: "medium",
  },
};
