import { createRpc } from '@lightprotocol/stateless.js';
import type { Rpc } from '@lightprotocol/stateless.js';
import React, { type FC, useMemo } from 'react';
import { LightConnectionContext } from './useLightConnection.js';
import type { LightConnectionProviderProps } from './types.js';

/**
 * Provider component for the Light Protocol RPC connection.
 *
 * This provider creates and manages a Light Protocol RPC client that extends
 * the standard Solana Connection with compression-specific methods for
 * interacting with Light tokens and compressed accounts.
 *
 * @remarks
 * The endpoint must be a Photon-enabled RPC endpoint. Helius provides
 * combined Solana + Photon indexer endpoints that work out of the box.
 *
 * @example
 * Basic usage with Helius endpoint:
 * ```tsx
 * import { LightConnectionProvider } from '@solana/wallet-adapter-react-light';
 *
 * function App() {
 *     return (
 *         <LightConnectionProvider endpoint="https://mainnet.helius-rpc.com?api-key=YOUR_KEY">
 *             <YourApp />
 *         </LightConnectionProvider>
 *     );
 * }
 * ```
 *
 * @example
 * With separate endpoints for different services:
 * ```tsx
 * <LightConnectionProvider
 *     endpoint="https://api.mainnet-beta.solana.com"
 *     compressionEndpoint="https://mainnet.helius-rpc.com?api-key=YOUR_KEY"
 *     proverEndpoint="https://prover.helius-rpc.com?api-key=YOUR_KEY"
 * >
 *     <YourApp />
 * </LightConnectionProvider>
 * ```
 */
export const LightConnectionProvider: FC<LightConnectionProviderProps> = ({
    children,
    endpoint,
    compressionEndpoint,
    proverEndpoint,
}) => {
    /**
     * Create the Light Protocol RPC client.
     *
     * The createRpc function accepts three endpoints:
     * 1. Solana RPC endpoint - for standard Solana RPC calls
     * 2. Compression RPC endpoint - for Photon indexer calls (getCompressedTokenAccountsByOwner, etc.)
     * 3. Prover endpoint - for validity proof generation
     *
     * If separate endpoints aren't provided, the main endpoint is used for all three.
     */
    const rpc: Rpc = useMemo(
        () =>
            createRpc(
                endpoint,
                compressionEndpoint ?? endpoint,
                proverEndpoint ?? endpoint
            ),
        [endpoint, compressionEndpoint, proverEndpoint]
    );

    const contextValue = useMemo(() => ({ rpc }), [rpc]);

    return (
        <LightConnectionContext.Provider value={contextValue}>
            {children}
        </LightConnectionContext.Provider>
    );
};
