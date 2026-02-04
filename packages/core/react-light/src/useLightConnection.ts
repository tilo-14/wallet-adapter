import type { Rpc } from '@lightprotocol/stateless.js';
import { createContext, useContext } from 'react';
import type { LightConnectionContextState } from './types.js';

/**
 * Default context state with error-throwing stubs
 */
const DEFAULT_CONTEXT: LightConnectionContextState = {
    get rpc(): Rpc {
        throw new Error(
            'You have tried to access "rpc" on a LightConnectionContext without providing one. ' +
                'Make sure to render a LightConnectionProvider as an ancestor of the component that uses useLightConnection.'
        );
    },
};

/**
 * React context for the Light Protocol RPC connection
 */
export const LightConnectionContext = createContext<LightConnectionContextState>(DEFAULT_CONTEXT);

/**
 * Hook to access the Light Protocol RPC connection
 *
 * @returns The Light Connection context state containing the RPC client
 *
 * @example
 * ```tsx
 * import { useLightConnection } from '@solana/wallet-adapter-react-light';
 *
 * function MyComponent() {
 *     const { rpc } = useLightConnection();
 *
 *     // Use rpc to make Light Protocol RPC calls
 *     const balances = await rpc.getCompressedTokenBalancesByOwnerV2(owner);
 * }
 * ```
 */
export function useLightConnection(): LightConnectionContextState {
    const context = useContext(LightConnectionContext);
    if (!context.rpc) {
        throw new Error(
            'useLightConnection must be used within a LightConnectionProvider. ' +
                'Wrap your app with <LightConnectionProvider endpoint="...">.'
        );
    }
    return context;
}
