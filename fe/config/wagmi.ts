import { createConfig } from '@privy-io/wagmi';
import { monadTestnet } from 'viem/chains';
import { http } from 'wagmi';

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
});
