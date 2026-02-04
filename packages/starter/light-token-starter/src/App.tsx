import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LightConnectionProvider, useLightToken } from '@solana/wallet-adapter-react-light';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { PublicKey } from '@solana/web3.js';
import type { FC, ReactNode } from 'react';
import React, { useCallback, useMemo, useState } from 'react';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * Light Token Starter Example
 *
 * This example demonstrates how to use the Light Token wallet adapter hooks
 * to interact with Light Protocol's compressed tokens on Solana.
 *
 * Light tokens are 200x cheaper than SPL tokens and don't require rent.
 */
export const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};

/**
 * Context wrapper providing wallet and Light connection
 */
const Context: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;

    // Use a Helius endpoint for Light Protocol support (Photon-enabled)
    // Replace with your own API key in production
    const endpoint = useMemo(() => {
        // For devnet, you can use Helius devnet endpoint
        // Get your API key at https://helius.dev
        return `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || 'YOUR_API_KEY'}`;
    }, []);

    const wallets = useMemo(
        () => [
            /**
             * Wallets that implement either of these standards will be available automatically.
             *
             *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
             *     (https://github.com/solana-mobile/mobile-wallet-adapter)
             *   - Solana Wallet Standard
             *     (https://github.com/solana-labs/wallet-standard)
             *
             * For testing, we include the UnsafeBurnerWalletAdapter.
             */
            new UnsafeBurnerWalletAdapter(),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {/* LightConnectionProvider wraps children with Light Protocol RPC */}
                    <LightConnectionProvider endpoint={endpoint}>
                        {children}
                    </LightConnectionProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

/**
 * Main content component demonstrating Light Token operations
 */
const Content: FC = () => {
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Light Token Example</h1>
            <p style={{ marginBottom: '20px', color: '#666' }}>
                This example demonstrates Light Protocol's compressed tokens -
                200x cheaper than SPL tokens with no rent required.
            </p>

            <div style={{ marginBottom: '20px' }}>
                <WalletMultiButton />
            </div>

            <LightTokenDemo />
        </div>
    );
};

/**
 * Demo component showing Light Token functionality
 */
const LightTokenDemo: FC = () => {
    const { getBalances, getTokenAccounts, transfer } = useLightToken();
    const [balances, setBalances] = useState<Array<{ mint: string; balance: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transferStatus, setTransferStatus] = useState<string | null>(null);

    // Fetch Light Token balances
    const handleGetBalances = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getBalances();
            setBalances(
                result.map((b) => ({
                    mint: b.mint.toBase58(),
                    balance: b.balance.toString(),
                }))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch balances');
        } finally {
            setLoading(false);
        }
    }, [getBalances]);

    // Transfer Light Tokens
    const handleTransfer = useCallback(async () => {
        setLoading(true);
        setError(null);
        setTransferStatus(null);

        try {
            // Example transfer - replace with actual values
            const result = await transfer({
                mint: new PublicKey('11111111111111111111111111111111'), // Replace with actual mint
                recipient: new PublicKey('11111111111111111111111111111111'), // Replace with recipient
                amount: 1000000, // Amount in smallest units
            });
            setTransferStatus(`Transfer successful! Signature: ${result.signature}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Transfer failed');
        } finally {
            setLoading(false);
        }
    }, [transfer]);

    return (
        <div style={{ marginTop: '20px' }}>
            <h2>Light Token Operations</h2>

            {/* Get Balances */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Token Balances</h3>
                <button
                    onClick={handleGetBalances}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Loading...' : 'Fetch Light Token Balances'}
                </button>

                {balances.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                        <h4>Your Light Tokens:</h4>
                        <ul>
                            {balances.map((b, i) => (
                                <li key={i}>
                                    <strong>Mint:</strong> {b.mint.slice(0, 8)}...
                                    <br />
                                    <strong>Balance:</strong> {b.balance}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {balances.length === 0 && !loading && !error && (
                    <p style={{ color: '#666', marginTop: '10px' }}>
                        No Light tokens found. Create some using the Light CLI or SDK.
                    </p>
                )}
            </div>

            {/* Transfer */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Transfer Light Tokens</h3>
                <button
                    onClick={handleTransfer}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Processing...' : 'Transfer (Demo)'}
                </button>
                <p style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
                    Note: Update the mint and recipient addresses in the code to test transfers.
                </p>
            </div>

            {/* Status Messages */}
            {error && (
                <div
                    style={{
                        padding: '10px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        marginTop: '10px',
                    }}
                >
                    Error: {error}
                </div>
            )}

            {transferStatus && (
                <div
                    style={{
                        padding: '10px',
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '4px',
                        marginTop: '10px',
                        wordBreak: 'break-all',
                    }}
                >
                    {transferStatus}
                </div>
            )}

            {/* Documentation */}
            <div
                style={{
                    marginTop: '30px',
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                }}
            >
                <h3>Available Hooks</h3>
                <ul>
                    <li>
                        <code>useLightConnection()</code> - Access the Light Protocol RPC client
                    </li>
                    <li>
                        <code>useLightToken()</code> - Light Token operations:
                        <ul>
                            <li>
                                <code>getBalances()</code> - Get all Light token balances
                            </li>
                            <li>
                                <code>getTokenAccounts(mint?)</code> - Get token accounts
                            </li>
                            <li>
                                <code>createMint(options)</code> - Create a new Light mint
                            </li>
                            <li>
                                <code>createAta(options)</code> - Create a Light-ATA
                            </li>
                            <li>
                                <code>getAtaAddress(mint, owner)</code> - Get Light-ATA address
                            </li>
                            <li>
                                <code>mintTo(options)</code> - Mint Light tokens
                            </li>
                            <li>
                                <code>transfer(options)</code> - Transfer Light tokens
                            </li>
                        </ul>
                    </li>
                </ul>

                <h3 style={{ marginTop: '15px' }}>Resources</h3>
                <ul>
                    <li>
                        <a href="https://www.zkcompression.com/light-token/quickstart" target="_blank" rel="noreferrer">
                            Light Token Quickstart
                        </a>
                    </li>
                    <li>
                        <a href="https://www.zkcompression.com" target="_blank" rel="noreferrer">
                            ZK Compression Documentation
                        </a>
                    </li>
                    <li>
                        <a href="https://helius.dev" target="_blank" rel="noreferrer">
                            Helius RPC (Photon-enabled endpoints)
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};
