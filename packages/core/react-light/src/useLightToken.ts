import { useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey } from '@solana/web3.js';
import { bn } from '@lightprotocol/stateless.js';
import {
    createMint as lightCreateMint,
    createTokenPool,
    mintTo as lightMintTo,
    transfer as lightTransfer,
} from '@lightprotocol/compressed-token';
import { useLightConnection } from './useLightConnection.js';
import type {
    LightTokenBalance,
    LightTokenAccount,
    CreateMintOptions,
    CreateAtaOptions,
    MintToOptions,
    TransferOptions,
    CreateMintResult,
    LightTokenOperationResult,
    LightTokenContextState,
} from './types.js';

/**
 * Hook to interact with Light tokens using the Light Token Interface API.
 *
 * This hook provides high-level methods for creating mints, minting tokens,
 * and transferring Light tokens. It automatically handles the complexity of
 * compressed accounts and validity proofs.
 *
 * @remarks
 * This hook requires both `LightConnectionProvider` and `WalletProvider` to be
 * present in the component tree. The wallet must be connected to perform
 * write operations (createMint, createAta, mintTo, transfer).
 *
 * @returns An object containing Light Token operations
 *
 * @example
 * Basic usage:
 * ```tsx
 * import { useLightToken } from '@solana/wallet-adapter-react-light';
 *
 * function TokenComponent() {
 *     const { getBalances, transfer, createMint } = useLightToken();
 *
 *     // Fetch balances
 *     const balances = await getBalances();
 *
 *     // Transfer tokens
 *     await transfer({
 *         mint: new PublicKey('...'),
 *         recipient: new PublicKey('...'),
 *         amount: 1000000000n, // 1 token with 9 decimals
 *     });
 * }
 * ```
 */
export function useLightToken(): LightTokenContextState {
    const { rpc } = useLightConnection();
    const { publicKey, signTransaction } = useWallet();

    /**
     * Get all Light Token balances for the connected wallet.
     *
     * @returns Array of token balances grouped by mint
     */
    const getBalances = useCallback(async (): Promise<LightTokenBalance[]> => {
        if (!publicKey) {
            throw new Error('Wallet not connected. Please connect your wallet first.');
        }

        const response = await rpc.getCompressedTokenBalancesByOwnerV2(publicKey);

        if (!response || !response.value) {
            return [];
        }

        // The response.value is the array of token balances
        const balances = Array.isArray(response.value) ? response.value : [];

        return balances.map((item: { mint: string; balance: string }) => ({
            mint: new PublicKey(item.mint),
            balance: bn(item.balance),
            decimals: 9, // Default decimals, could be fetched from mint info
        }));
    }, [rpc, publicKey]);

    /**
     * Get Light Token accounts for the connected wallet.
     *
     * @param mint - Optional mint address to filter by
     * @returns Array of token accounts
     */
    const getTokenAccounts = useCallback(
        async (mint?: PublicKey): Promise<LightTokenAccount[]> => {
            if (!publicKey) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
            }

            const options = mint ? { mint } : undefined;
            const response = await rpc.getCompressedTokenAccountsByOwner(publicKey, options);

            if (!response) {
                return [];
            }

            // WithCursor<ParsedTokenAccount[]> - response is array-like with cursor
            const accounts = Array.isArray(response) ? response : [];

            return accounts.map((item) => ({
                mint: new PublicKey(item.parsed.mint),
                owner: new PublicKey(item.parsed.owner),
                amount: bn(item.parsed.amount),
                delegate: item.parsed.delegate ? new PublicKey(item.parsed.delegate) : null,
                delegatedAmount: bn(item.parsed.delegatedAmount ?? '0'),
                isFrozen: item.parsed.state === 2, // 2 = frozen state
            }));
        },
        [rpc, publicKey]
    );

    /**
     * Create a new Light mint.
     *
     * @param options - Mint creation options
     * @returns The created mint public key and transaction signature
     */
    const createMint = useCallback(
        async (options: CreateMintOptions): Promise<CreateMintResult> => {
            if (!publicKey) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
            }

            const decimals = options.decimals ?? 9;
            const mintKeypair = Keypair.generate();

            // Create the Light mint using the SDK
            const { transactionSignature } = await lightCreateMint(
                rpc,
                {
                    publicKey,
                    signTransaction: signTransaction!,
                } as unknown as Keypair, // The SDK accepts a signer interface
                options.authority,
                decimals,
                mintKeypair
            );

            return {
                mint: mintKeypair.publicKey,
                signature: transactionSignature,
            };
        },
        [rpc, publicKey, signTransaction]
    );

    /**
     * Create a Light-ATA (Associated Token Account) for an owner.
     *
     * @remarks
     * Unlike SPL tokens, Light tokens don't always require explicit ATA creation.
     * The transfer function can automatically create accounts when needed.
     * This method is provided for cases where you want to pre-create the account.
     *
     * @param options - ATA creation options
     * @returns The transaction signature
     */
    const createAta = useCallback(
        async (options: CreateAtaOptions): Promise<LightTokenOperationResult> => {
            if (!publicKey) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
            }

            // For Light tokens, we create a token pool if it doesn't exist
            // and the ATA is created implicitly during the first mint/transfer
            const signature = await createTokenPool(
                rpc,
                {
                    publicKey,
                    signTransaction: signTransaction!,
                } as unknown as Keypair,
                options.mint
            );

            return { signature };
        },
        [rpc, publicKey, signTransaction]
    );

    /**
     * Get the Light-ATA address for a mint and owner.
     *
     * @remarks
     * Light Token ATAs are deterministically derived from the mint and owner.
     * This function returns the address without making any RPC calls.
     *
     * @param mint - The mint address
     * @param owner - The owner address
     * @returns The Light-ATA address
     */
    const getAtaAddress = useCallback((mint: PublicKey, owner: PublicKey): PublicKey => {
        // Light-ATA addresses are derived differently than SPL ATAs
        // For now, we return a derived address based on mint and owner
        // This matches the Light Protocol's getAssociatedTokenAddressInterface
        const [ata] = PublicKey.findProgramAddressSync(
            [owner.toBuffer(), mint.toBuffer()],
            new PublicKey('cTokenmWW8bLPjZEBAUgYy3zKxQZW6VKi7bqNFEVv3m') // Light Token Program ID
        );
        return ata;
    }, []);

    /**
     * Mint Light tokens to a destination address.
     *
     * @param options - Mint options including mint address, destination, and amount
     * @returns The transaction signature
     */
    const mintTo = useCallback(
        async (options: MintToOptions): Promise<LightTokenOperationResult> => {
            if (!publicKey) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
            }

            const amount = typeof options.amount === 'bigint'
                ? bn(options.amount.toString())
                : bn(options.amount);

            const signature = await lightMintTo(
                rpc,
                {
                    publicKey,
                    signTransaction: signTransaction!,
                } as unknown as Keypair,
                options.mint,
                options.destination,
                {
                    publicKey,
                    signTransaction: signTransaction!,
                } as unknown as Keypair, // authority
                amount
            );

            return { signature };
        },
        [rpc, publicKey, signTransaction]
    );

    /**
     * Transfer Light tokens to a recipient.
     *
     * @remarks
     * This function handles all the complexity of compressed token transfers:
     * - Fetching the sender's compressed token accounts
     * - Selecting accounts that cover the transfer amount
     * - Obtaining validity proofs from the indexer
     * - Building and signing the transaction
     *
     * @param options - Transfer options including mint, recipient, and amount
     * @returns The transaction signature
     */
    const transfer = useCallback(
        async (options: TransferOptions): Promise<LightTokenOperationResult> => {
            if (!publicKey) {
                throw new Error('Wallet not connected. Please connect your wallet first.');
            }

            const amount = typeof options.amount === 'bigint'
                ? bn(options.amount.toString())
                : bn(options.amount);

            const signature = await lightTransfer(
                rpc,
                {
                    publicKey,
                    signTransaction: signTransaction!,
                } as unknown as Keypair,
                options.mint,
                amount,
                {
                    publicKey,
                    signTransaction: signTransaction!,
                } as unknown as Keypair, // owner
                options.recipient
            );

            return { signature };
        },
        [rpc, publicKey, signTransaction]
    );

    return useMemo(
        () => ({
            getBalances,
            getTokenAccounts,
            createMint,
            createAta,
            getAtaAddress,
            mintTo,
            transfer,
        }),
        [getBalances, getTokenAccounts, createMint, createAta, getAtaAddress, mintTo, transfer]
    );
}
