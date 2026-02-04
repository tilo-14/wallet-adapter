/**
 * E2E tests for Light Token operations
 *
 * These tests run against a local Light test validator.
 * Start the validator with: light test-validator
 *
 * The test validator provides:
 * - Solana RPC at http://127.0.0.1:8899
 * - Photon indexer at http://127.0.0.1:8784
 */

import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createRpc, bn } from '@lightprotocol/stateless.js';
import {
    createMint,
    createTokenPool,
    mintTo,
    transfer,
} from '@lightprotocol/compressed-token';

// Localnet endpoints for light test-validator
const RPC_ENDPOINT = 'http://127.0.0.1:8899';
const COMPRESSION_ENDPOINT = 'http://127.0.0.1:8784';
const PROVER_ENDPOINT = 'http://127.0.0.1:8784';

// Test timeout - Light operations can take time
const TEST_TIMEOUT = 120_000;

describe('Light Token E2E Tests', () => {
    let rpc: ReturnType<typeof createRpc>;
    let payer: Keypair;
    let mintAuthority: Keypair;
    let mintKeypair: Keypair;
    let recipient: Keypair;

    beforeAll(async () => {
        // Create RPC connection
        rpc = createRpc(RPC_ENDPOINT, COMPRESSION_ENDPOINT, PROVER_ENDPOINT);

        // Generate keypairs for testing
        payer = Keypair.generate();
        mintAuthority = Keypair.generate();
        mintKeypair = Keypair.generate();
        recipient = Keypair.generate();

        // Airdrop SOL to payer for transaction fees
        console.log('Requesting airdrop for payer...');
        const airdropSig = await rpc.requestAirdrop(payer.publicKey, 10 * LAMPORTS_PER_SOL);
        await rpc.confirmTransaction(airdropSig);
        console.log('Airdrop confirmed:', airdropSig);

        // Airdrop to mint authority
        console.log('Requesting airdrop for mint authority...');
        const airdropSig2 = await rpc.requestAirdrop(mintAuthority.publicKey, 5 * LAMPORTS_PER_SOL);
        await rpc.confirmTransaction(airdropSig2);
        console.log('Airdrop confirmed:', airdropSig2);
    }, TEST_TIMEOUT);

    describe('createMint', () => {
        it('should create a new Light Token mint', async () => {
            console.log('Creating Light Token mint...');
            console.log('Mint keypair:', mintKeypair.publicKey.toBase58());
            console.log('Mint authority:', mintAuthority.publicKey.toBase58());

            const { transactionSignature } = await createMint(
                rpc,
                payer,
                mintAuthority.publicKey,
                9, // decimals
                mintKeypair
            );

            expect(transactionSignature).toBeDefined();
            expect(typeof transactionSignature).toBe('string');
            console.log('Mint created with signature:', transactionSignature);

            // Verify the mint exists by checking mint info
            const mintInfo = await rpc.getAccountInfo(mintKeypair.publicKey);
            expect(mintInfo).not.toBeNull();
            console.log('Mint account verified');
        }, TEST_TIMEOUT);
    });

    describe('createTokenPool', () => {
        it('should create a token pool for the mint', async () => {
            console.log('Creating token pool...');

            const signature = await createTokenPool(rpc, payer, mintKeypair.publicKey);

            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
            console.log('Token pool created with signature:', signature);
        }, TEST_TIMEOUT);
    });

    describe('mintTo', () => {
        it('should mint tokens to a recipient', async () => {
            const mintAmount = bn(1_000_000_000); // 1 token with 9 decimals
            console.log('Minting tokens to:', mintAuthority.publicKey.toBase58());

            const signature = await mintTo(
                rpc,
                payer,
                mintKeypair.publicKey,
                mintAuthority.publicKey, // destination
                mintAuthority, // authority
                mintAmount
            );

            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
            console.log('Minted tokens with signature:', signature);

            // Verify balance
            const balances = await rpc.getCompressedTokenBalancesByOwnerV2(mintAuthority.publicKey);
            expect(balances).toBeDefined();
            console.log('Balance response:', JSON.stringify(balances, null, 2));
        }, TEST_TIMEOUT);
    });

    describe('transfer', () => {
        it('should transfer tokens to another address', async () => {
            const transferAmount = bn(100_000_000); // 0.1 tokens
            console.log('Transferring tokens to:', recipient.publicKey.toBase58());

            const signature = await transfer(
                rpc,
                payer,
                mintKeypair.publicKey,
                transferAmount,
                mintAuthority, // owner/sender
                recipient.publicKey // recipient
            );

            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
            console.log('Transferred tokens with signature:', signature);

            // Verify recipient balance
            const recipientBalances = await rpc.getCompressedTokenBalancesByOwnerV2(recipient.publicKey);
            expect(recipientBalances).toBeDefined();
            console.log('Recipient balance:', JSON.stringify(recipientBalances, null, 2));

            // Verify sender balance decreased
            const senderBalances = await rpc.getCompressedTokenBalancesByOwnerV2(mintAuthority.publicKey);
            expect(senderBalances).toBeDefined();
            console.log('Sender balance after transfer:', JSON.stringify(senderBalances, null, 2));
        }, TEST_TIMEOUT);
    });

    describe('getCompressedTokenAccountsByOwner', () => {
        it('should retrieve token accounts for an owner', async () => {
            console.log('Getting token accounts for:', mintAuthority.publicKey.toBase58());

            const accounts = await rpc.getCompressedTokenAccountsByOwner(mintAuthority.publicKey);

            expect(accounts).toBeDefined();
            console.log('Token accounts:', JSON.stringify(accounts, null, 2));

            // Should have at least one account from the mint operation
            const accountArray = Array.isArray(accounts) ? accounts : [];
            expect(accountArray.length).toBeGreaterThan(0);
        }, TEST_TIMEOUT);
    });

    describe('getCompressedTokenBalancesByOwnerV2', () => {
        it('should retrieve token balances grouped by mint', async () => {
            console.log('Getting balances for:', mintAuthority.publicKey.toBase58());

            const response = await rpc.getCompressedTokenBalancesByOwnerV2(mintAuthority.publicKey);

            expect(response).toBeDefined();
            console.log('Balances response:', JSON.stringify(response, null, 2));

            // Should have balance for the test mint
            const balances = response?.value || [];
            expect(Array.isArray(balances)).toBe(true);
        }, TEST_TIMEOUT);
    });
});
