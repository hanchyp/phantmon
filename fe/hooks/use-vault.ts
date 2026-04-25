import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { ADDRESSES, erc20Abi, yieldVaultAbi } from '@/config/contracts';
import { monadTestnet } from 'viem/chains';

export function useVault() {
  const { address, isConnected } = useAccount();

  // Fetch single values
  const { data: totalDeposits = 0n, refetch: refetchTotalDeposits } = useReadContract({
    address: ADDRESSES.yieldVault,
    abi: yieldVaultAbi,
    functionName: 'totalDeposits',
    chainId: monadTestnet.id,
  });

  const { data: totalYield = 0n, refetch: refetchTotalYield } = useReadContract({
    address: ADDRESSES.yieldVault,
    abi: yieldVaultAbi,
    functionName: 'totalYield',
    chainId: monadTestnet.id,
  });

  const { data: accYieldPerShare = 0n, refetch: refetchAccYieldPerShare } = useReadContract({
    address: ADDRESSES.yieldVault,
    abi: yieldVaultAbi,
    functionName: 'accYieldPerShare',
    chainId: monadTestnet.id,
  });

  // Fetch user-specific values
  const { data: userData, refetch: refetchUserData } = useReadContracts({
    contracts: [
      {
        address: ADDRESSES.yieldVault,
        abi: yieldVaultAbi,
        functionName: 'userDeposits',
        args: [address as `0x${string}`],
      },
      {
        address: ADDRESSES.yieldVault,
        abi: yieldVaultAbi,
        functionName: 'userYieldDebt',
        args: [address as `0x${string}`],
      },
      {
        address: ADDRESSES.pUsd,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      },
      {
        address: ADDRESSES.mockUsdc,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      },
    ],
    query: {
      enabled: isConnected && !!address,
    }
  });

  const userDeposits = (userData?.[0]?.result as bigint) || 0n;
  const userYieldDebt = (userData?.[1]?.result as bigint) || 0n;
  const pUsdBalance = (userData?.[2]?.result as bigint) || 0n;
  const usdcBalance = (userData?.[3]?.result as bigint) || 0n;

  // Calculate claimable yield
  // formula: (userDeposits * accYieldPerShare / 1e18) - userYieldDebt
  const accumulated = (userDeposits * accYieldPerShare) / 10n ** 18n;
  const claimableYield = accumulated > userYieldDebt ? accumulated - userYieldDebt : 0n;

  const refetchAll = () => {
    refetchTotalDeposits();
    refetchTotalYield();
    refetchAccYieldPerShare();
    refetchUserData();
  };

  return {
    totalDeposits,
    totalYield,
    accYieldPerShare,
    userDeposits,
    userYieldDebt,
    pUsdBalance,
    usdcBalance,
    claimableYield,
    refetchAll,
  };
}
