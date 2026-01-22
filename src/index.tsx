#!/usr/bin/env node
// Suppress GramJS logs before any imports
const isGramJSLog = (str: string) => /^\[[\d-T:.]+\] \[(INFO|WARN|ERROR|DEBUG)\]/.test(str);

const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

process.stdout.write = ((chunk: unknown, ...args: unknown[]) => {
  if (typeof chunk === "string" && isGramJSLog(chunk)) return true;
  return originalStdoutWrite(chunk, ...args);
}) as typeof process.stdout.write;

process.stderr.write = ((chunk: unknown, ...args: unknown[]) => {
  if (typeof chunk === "string" && isGramJSLog(chunk)) return true;
  return originalStderrWrite(chunk, ...args);
}) as typeof process.stderr.write;

import { render } from "ink";
import { App } from "./app";

const useMock = process.argv.includes("--mock");

render(<App useMock={useMock} />);
