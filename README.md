# SPL MACHINE
Create a new SPL token, update the token metadata, and revoke mint authority in one transcation
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
