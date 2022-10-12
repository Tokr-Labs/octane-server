import express from 'express'
import {Connection, Keypair, sendAndConfirmRawTransaction, Transaction} from "@solana/web3.js";
import base58 from "bs58";
import {validateInstructions, validateTransaction} from "./libraries/octane/core/index";

const connection = new Connection('https://api.devnet.solana.com/', {commitment: 'confirmed'});
const feePayer = Keypair.fromSecretKey(base58.decode("2Jw8Kf5LfUBewedaNYaSypPFyVb3MgVENuDtaK7SyAGYE5vdQZ1iWJdZKas4YayVfJK2VUZ9FSuefbnL3PhFjeMS"));
const skipPreflight = true

const app = express()

app.use(express.json())

app.get("/", async (req, res) => {
    res.json({
        status: "ok"
    })
});

app.post(`/send`, async (req, res) => {

    // Step 1: Grab the serialized transaction from the body of the request

    const serialized = req.body?.transaction;

    if (typeof serialized !== 'string') {
        res.status(400).send({status: 'error', message: 'request should contain transaction'});
        return;
    }

    // Step 2: Check that user is logged in and their IP is the request is not spam

    // Step 3: Decode the transaction from the serialized version

    let transaction: Transaction;

    try {

        transaction = Transaction.from(Buffer.from(serialized, "base64"));

    } catch (e: any) {

        res.status(400).send({status: 'error', message: `Transaction decode failed: ${e.message}`});
        return;

    }

    // Step 4: Validate the transaction with octane.

    let signature: string;

    try {

        signature = (await validateTransaction(
            connection,
            transaction, // Transaction
            feePayer, // Keypair
            2, // max signatures
            5000, // lamports per signature
        )).signature;

    } catch (e: any) {

        res.status(400).send({status: 'error', message: `Invalid Transaction: ${e.message}`});
        return;

    }

    // Step 5: Validate the instructions in the de-serialized transaction with octane.

    try {

        await validateInstructions(transaction, feePayer);

    } catch (e) {

        console.error("Bad instructions.")
        res.status(400).send({status: 'error', message: 'bad instructions'});

        return;

    }

    // Step 6 (optional): Run a simulation of the transaction.

    try {

        await connection.simulateTransaction(transaction);

    } catch (e) {

        res.status(400).send({status: 'error', message: 'simulation failed'});
        return;

    }

    // Step 7: Attach our signature to the transaction we're about to run.

    transaction.addSignature(
        feePayer.publicKey,
        Buffer.from(base58.decode(signature))
    );

    // Step 8: Send and confirm the transaction

    const txid = await sendAndConfirmRawTransaction(
        connection,
        transaction.serialize(),
        { commitment: 'confirmed', skipPreflight: skipPreflight }
    );

    res.status(200).json({status: 'ok', txid});

});

const server = app.listen(3000, () => {
    console.log("🚀 Server ready at: http://localhost:3000")
});
