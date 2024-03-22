import {
    Keypair
} from '@solana/web3.js';

function walletGen() {
    const wallet = Keypair.generate();
    console.log('Public key:', wallet.publicKey.toBase58());
    console.log('Private key:', wallet.secretKey);
}

walletGen();
