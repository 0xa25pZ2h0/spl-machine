import {
    Connection,
    ComputeBudgetProgram,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import {
    AuthorityType,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createInitializeMintInstruction,
    createMintToInstruction,
    createSetAuthorityInstruction,
    getAssociatedTokenAddressSync,
    getMinimumBalanceForRentExemptMint
} from '@solana/spl-token';
import { keypairIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fromWeb3JsPublicKey, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata';

import secret from './public/secret.json' assert { type: "json" };
import config from './public/token-config.json' assert { type: "json" };


async function createToken() {
    // Set up keys
    const payer = Keypair.fromSecretKey(Uint8Array.from(secret.PAYER_PRIVATE_KEY));
    const token = Keypair.generate();

    // Create connection and umi instance
    const connection = new Connection(secret.RPC_URL);
    const umi = createUmi(secret.RPC_URL);
    umi.use(keypairIdentity(payer));

    // Instruction to create a new account
    const mintMinBalance = await getMinimumBalanceForRentExemptMint(connection);
    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: token.publicKey,
        programId: TOKEN_PROGRAM_ID,
        space: MINT_SIZE,
        lamports: mintMinBalance
    });

    // Instruction to initialize mint
    const initializeMintInstruction = createInitializeMintInstruction(
        token.publicKey,
        config.DECIMALS,
        payer.publicKey,
        null
    );

    // Instruction to create token account
    const associatedTokenAddress = getAssociatedTokenAddressSync(token.publicKey, payer.publicKey);
    const createAssociatedAccountInstruction = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        associatedTokenAddress,
        payer.publicKey,
        token.publicKey
    );

    // Instruction to mint tokens
    const mintToInstruction = createMintToInstruction(
        token.publicKey,
        associatedTokenAddress,
        payer.publicKey,
        BigInt(config.SUPPLY) * 10n ** BigInt(config.DECIMALS)
    );

    // Find metadata program PDA
    const MPL_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    const [metadataProgramPDA, _] = PublicKey.findProgramAddressSync([Buffer.from('metadata'), MPL_PROGRAM_ID.toBuffer(), token.publicKey.toBuffer()], MPL_PROGRAM_ID);

    // Instruction to create metadata account
    const metadataAccountV3InstructionAccounts = {
        metadata: fromWeb3JsPublicKey(metadataProgramPDA),
        mint: fromWeb3JsPublicKey(token.publicKey),
        mintAuthority: fromWeb3JsPublicKey(payer.publicKey),
        payer: fromWeb3JsPublicKey(payer.publicKey),
    }
    const metadataAccountV3InstructionDataArgs = {
        data: {
            name: config.NAME,
            symbol: config.SYMBOL,
            uri: config.URI,
            sellerFeeBasisPoints: 0,
            uses: null,
            creators: null,
            collection: null
        },
        isMutable: true,
        collectionDetails: null
    }
    const createMetadataAccountBuilder = createMetadataAccountV3(umi, { ...metadataAccountV3InstructionAccounts, ...metadataAccountV3InstructionDataArgs });
    const createMetadataAccountInstruction = createMetadataAccountBuilder.getInstructions()[0];

    // Format metadata account instruction keys
    createMetadataAccountInstruction.keys = createMetadataAccountInstruction.keys.map(key => {
        const formattedKey = { ...key };
        formattedKey.pubkey = toWeb3JsPublicKey(key.pubkey);
        return formattedKey;
    });

    // Instruction to revoke mint authority
    const revokeMintAuthorityInstruction = createSetAuthorityInstruction(
        token.publicKey,
        payer.publicKey,
        AuthorityType.MintTokens,
        null
    );

    // Create transaction and set fee
    const transaction = new Transaction();
    const priorityFee = config.PRIORITY_FEE;
    const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee });
    transaction.add(priorityFeeInstruction);

    // Add instructions
    transaction.add(
        createAccountInstruction,
        initializeMintInstruction,
        createAssociatedAccountInstruction,
        mintToInstruction,
        createMetadataAccountInstruction,
        revokeMintAuthorityInstruction
    );

    // Send transaction
    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, token]
    );

    console.log(`Token address: ${token.publicKey.toBase58()}`);
    console.log(`Transaction signature: ${signature}`);
}

createToken();
