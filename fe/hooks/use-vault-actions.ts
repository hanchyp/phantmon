import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ADDRESSES, erc20Abi, yieldVaultAbi } from '@/config/contracts';
import { useEffect, useState } from 'react';

export function useVaultActions(onSuccess?: () => void) {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isApproving, setIsApproving] = useState(false);

  const {
    writeContract,
    isPending: isWritePending,
    error: writeError,
    data: hash,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (hash) {
      setTxHash(hash);
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirmed && onSuccess) {
      onSuccess();
      setIsApproving(false);
    }
  }, [isConfirmed, onSuccess]);

  const approveAndDeposit = async (amountWei: bigint) => {
    setIsApproving(true);
    writeContract({
      address: ADDRESSES.mockUsdc,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ADDRESSES.yieldVault, amountWei],
    });
  };

  const deposit = async (amountWei: bigint) => {
    writeContract({
      address: ADDRESSES.yieldVault,
      abi: yieldVaultAbi,
      functionName: 'deposit',
      args: [amountWei],
    });
  };

  const withdraw = async (amountWei: bigint) => {
    writeContract({
      address: ADDRESSES.yieldVault,
      abi: yieldVaultAbi,
      functionName: 'withdraw',
      args: [amountWei],
    });
  };

  const claimYield = async () => {
    writeContract({
      address: ADDRESSES.yieldVault,
      abi: yieldVaultAbi,
      functionName: 'claimYield',
    });
  };

  const mintMockUSDC = async (to: `0x${string}`, amountWei: bigint) => {
    writeContract({
      address: ADDRESSES.mockUsdc,
      abi: erc20Abi,
      functionName: 'mint',
      args: [to, amountWei],
    });
  };

  return {
    approveAndDeposit,
    deposit,
    withdraw,
    claimYield,
    mintMockUSDC,
    isPending: isWritePending || isConfirming || isApproving,
    isConfirming,
    isConfirmed,
    isApproving,
    error: writeError || confirmError,
    txHash,
    resetState: () => {
      setTxHash(undefined);
      setIsApproving(false);
    }
  };
}
