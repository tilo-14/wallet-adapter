import type { PublicKey } from '@solana/web3.js';
import type { Rpc } from '@lightprotocol/stateless.js';
import type BN from 'bn.js';

/**
 * Represents a Light Token balance for a specific mint
 */
export interface LightTokenBalance {
    /** The mint address of the token */
    mint: PublicKey;
    /** The balance amount as a BN (big number) */
    balance: BN;
    /** The token decimals */
    decimals: number;
}

/**
 * Represents a Light Token account (Light-ATA)
 */
export interface LightTokenAccount {
    /** The mint address */
    mint: PublicKey;
    /** The owner of this token account */
    owner: PublicKey;
    /** The token balance */
    amount: BN;
    /** The delegate (if any) */
    delegate: PublicKey | null;
    /** The delegated amount */
    delegatedAmount: BN;
    /** Whether the account is frozen */
    isFrozen: boolean;
}

/**
 * Options for creating a Light mint
 */
export interface CreateMintOptions {
    /** The mint authority public key */
    authority: PublicKey;
    /** Optional freeze authority */
    freezeAuthority?: PublicKey | null;
    /** Number of decimals (default: 9) */
    decimals?: number;
}

/**
 * Options for creating a Light-ATA (Associated Token Account)
 */
export interface CreateAtaOptions {
    /** The mint address */
    mint: PublicKey;
    /** The owner of the new ATA */
    owner: PublicKey;
}

/**
 * Options for minting Light tokens
 */
export interface MintToOptions {
    /** The mint address */
    mint: PublicKey;
    /** The destination address (Light-ATA or owner) */
    destination: PublicKey;
    /** The amount to mint */
    amount: bigint | number;
}

/**
 * Options for transferring Light tokens
 */
export interface TransferOptions {
    /** The mint address */
    mint: PublicKey;
    /** The recipient address */
    recipient: PublicKey;
    /** The amount to transfer */
    amount: bigint | number;
}

/**
 * Result of a Light Token mint creation
 */
export interface CreateMintResult {
    /** The mint public key */
    mint: PublicKey;
    /** The transaction signature */
    signature: string;
}

/**
 * Result of a Light Token operation
 */
export interface LightTokenOperationResult {
    /** The transaction signature */
    signature: string;
}

/**
 * State of the Light Connection context
 */
export interface LightConnectionContextState {
    /** The Light Protocol RPC client */
    rpc: Rpc;
}

/**
 * State of the Light Token context
 */
export interface LightTokenContextState {
    /**
     * Get all Light Token balances for the connected wallet
     * @returns Array of token balances
     */
    getBalances: () => Promise<LightTokenBalance[]>;

    /**
     * Get Light Token accounts for the connected wallet
     * @param mint - Optional mint to filter by
     * @returns Array of token accounts
     */
    getTokenAccounts: (mint?: PublicKey) => Promise<LightTokenAccount[]>;

    /**
     * Create a new Light mint
     * @param options - Mint creation options
     * @returns The created mint info
     */
    createMint: (options: CreateMintOptions) => Promise<CreateMintResult>;

    /**
     * Create a Light-ATA (Associated Token Account)
     * @param options - ATA creation options
     * @returns The operation result
     */
    createAta: (options: CreateAtaOptions) => Promise<LightTokenOperationResult>;

    /**
     * Get the Light-ATA address for a mint and owner
     * @param mint - The mint address
     * @param owner - The owner address
     * @returns The Light-ATA address
     */
    getAtaAddress: (mint: PublicKey, owner: PublicKey) => PublicKey;

    /**
     * Mint Light tokens to a destination
     * @param options - Mint options
     * @returns The operation result
     */
    mintTo: (options: MintToOptions) => Promise<LightTokenOperationResult>;

    /**
     * Transfer Light tokens to a recipient
     * @param options - Transfer options
     * @returns The operation result
     */
    transfer: (options: TransferOptions) => Promise<LightTokenOperationResult>;
}

/**
 * Props for the LightConnectionProvider component
 */
export interface LightConnectionProviderProps {
    /** React children */
    children: React.ReactNode;
    /**
     * The RPC endpoint URL. Must be a Photon-enabled endpoint
     * (e.g., Helius: https://mainnet.helius-rpc.com?api-key=YOUR_KEY)
     */
    endpoint: string;
    /**
     * Optional: Separate compression RPC endpoint
     * If not provided, uses the main endpoint
     */
    compressionEndpoint?: string;
    /**
     * Optional: Separate prover endpoint
     * If not provided, uses the main endpoint
     */
    proverEndpoint?: string;
}
