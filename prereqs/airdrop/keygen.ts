import { Keypair } from "@solana/web3.js";
import bs58 from 'bs58';

//Generate a new keypair
let kp = Keypair.generate()

console.log(`You've generated a new Solana wallet:\n
Public:\n\t${kp.publicKey.toBase58()}
Private:\n\t${bs58.encode(kp.secretKey)}\n

To save your wallet, copy and paste the following into a JSON file:\n
[${kp.secretKey}]`);

//import fs from 'fs';
// Write the secret key to file as a JSON array
//fs.writeFileSync('dev-wallet.json', `[${kp.secretKey}]`);