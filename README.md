# SPL MACHINE
SPL machine comprises of a couple of Solana scripts that are used to interact with the Solana blockchain. It has 2 main features. The first feature is the ability to create a new SPL token, update the token metadata, and revoke mint authority in one transcation, to help everything go smoothly during network congestion. The second is to create a Raydium LP pool and snipe the token launch to extract maximum value from the token launch.
## Setup
```
$ git clone
$ cd spl-machine
$ npm install
```

### Create a new payer wallet
```bash
$ npm run wallet-gen
```

### Create token
Edit `src/public/token-config.js` and `src/public/secret.json` with the appropriate values.
```bash
$ npm run create-token
```
