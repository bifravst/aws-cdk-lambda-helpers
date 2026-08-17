# AWS CDK Lambda Helpers [![npm version](https://img.shields.io/npm/v/@bifravst/aws-cdk-lambda-helpers.svg)](https://www.npmjs.com/package/@bifravst/aws-cdk-lambda-helpers)

[![Test and Release](https://github.com/bifravst/aws-cdk-lambda-helpers/actions/workflows/test-and-release.yaml/badge.svg)](https://github.com/bifravst/aws-cdk-lambda-helpers/actions/workflows/test-and-release.yaml)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![@commitlint/config-conventional](https://img.shields.io/badge/%40commitlint-config--conventional-brightgreen)](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier/)
[![ESLint: TypeScript](https://img.shields.io/badge/ESLint-TypeScript-blue.svg)](https://github.com/typescript-eslint/typescript-eslint)

Helper functions which simplify working with TypeScript lambdas for AWS CDK.

## Installation

    npm i --save-dev --save-exact @bifravst/aws-cdk-lambda-helpers

## Usage

See [the end-to-end test stack](./cdk/e2e.ts).

## `updateLambdaCode()` helper

[`updateLambdaCode()`](./src/updateLambdaCode.ts) is a helper that will update
the function code of a lambda directly without a CloudFormation deployment,
which is many times faster. This is useful during development.

See [this example](./cdk/update-lambdas.ts) on how to use it.

## Example migrations to `@bifravst/aws-cdk-lambda-helpers`

- [world.thingy.rocks backend](https://github.com/NordicPlayground/thingy-rocks-cloud-aws-js/commit/3ca6e267917db4d8cb09ca63ed54384c0e23f163)

## Node & NPM

This project requires Node.js `>=24.19.0 <25` and npm `>=12.0.2 <13` (enforced
via `check-node-version` on `npm install` and `npm ci`).

The check is skipped during `npm publish` and `npm pack`, because
`semantic-release` bundles its own npm (`@semantic-release/npm` depends on
`npm@^11.6.2`) and runs the publish with that version rather than the one
installed in CI.

## TypeScript 6 and 7

This repo
[runs TypeScript 6 and 7 side by side](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0),
[so that eslint works](https://github.com/typescript-eslint/typescript-eslint/issues/10940#issuecomment-4922812181).
