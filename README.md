# Octane Server

A simple lightweight server using [Octane](https://github.com/solana-labs/octane) that re-signs transactions assigning the transaction fees to another account. This repo works in tandem to the [iOS Octane Client](https://github.com/Tokr-Labs/ios-octane-client) repo.

There is only a single endpoint `send` that takes in a serialized transaction and validates and resigns the transaction with a different fee payer than the original signer.

The Octane client library when creating this repo was not available as a npm module so it has been downloaded and included in the `src/libraries` directory.

## Requirements

- Node >= 16
- [ngrok](https://ngrok.com/) >= 3

## Running Locally

```
$ npm i
$ npm run dev
$ ngrok http 3000
```