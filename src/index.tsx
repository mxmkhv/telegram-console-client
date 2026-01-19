#!/usr/bin/env node
import { render } from "ink";
import { App } from "./app";

const useMock = process.argv.includes("--mock");

render(<App useMock={useMock} />);
