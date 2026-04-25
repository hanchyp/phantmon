import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ADDRESSES, erc20Abi, yieldVaultAbi } from '@/config/contracts';
import { useEffect, useState, useCallback, useRef } from 'react';

type PendingAction =
  | { type: 'approve'; amount: bigint }
  | { type: 'deposit'; amount: bigint }
  | { type: 'withdraw'; amount: bigint }
  | { type: 'claim' }
  | { type: 'mint-usdc'; to: `0x${string}`; amount: bigint }
  | null;

export function useVaultActions(onSuccess?: () => void) {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isApproving, setIsApproving] = useState(false);
  const pendingActionRef = useRef<PendingAction>(null);

  // Store onSuccess in a ref so it never causes useEffect re-fires
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const {
    writeContract,
    isPending: isWritePending,
    error: writeError,
    data: hash,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Track tx hash
  useEffect(() => {
    if (hash) {
      setTxHash(hash);
    }
  }, [hash]);

  // When tx confirms, handle follow-up actions
  useEffect(() => {
    if (!isConfirmed || !txHash) return;

    // Call onSuccess regardless of the action type (e.g. approve or deposit both refetch)
    onSuccessRef.current?.();
    setIsApproving(false);
    pendingActionRef.current = null;
  }, [isConfirmed, txHash]);

  const approve = (amountWei: bigint) => {
    pendingActionRef.current = { type: 'approve', amount: amountWei };
    setIsApproving(true);
    writeContract({
      address: ADDRESSES.mockUsdc,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ADDRESSES.yieldVault, amountWei],
    });
  };

  const deposit = (amountWei: bigint) => {
    pendingActionRef.current = { type: 'deposit', amount: amountWei };
    writeContract({
      address: ADDRESSES.yieldVault,
      abi: yieldVaultAbi,
      functionName: 'deposit',
      args: [amountWei],
    });
  };

  const withdraw = (amountWei: bigint) => {
    pendingActionRef.current = { type: 'withdraw', amount: amountWei };
    writeContract({
      address: ADDRESSES.yieldVault,
      abi: yieldVaultAbi,
      functionName: 'withdraw',
      args: [amountWei],
    });
  };

  const claimYield = () => {
    pendingActionRef.current = { type: 'claim' };
    writeContract({
      address: ADDRESSES.yieldVault,
      abi: yieldVaultAbi,
      functionName: 'claimYield',
    });
  };

  const mintMockUSDC = (to: `0x${string}`, amountWei: bigint) => {
    pendingActionRef.current = { type: 'mint-usdc', to, amount: amountWei };
    writeContract({
      address: ADDRESSES.mockUsdc,
      abi: erc20Abi,
      functionName: 'mint',
      args: [to, amountWei],
    });
  };

  const resetState = useCallback(() => {
    setTxHash(undefined);
    setIsApproving(false);
    pendingActionRef.current = null;
    resetWrite();
  }, [resetWrite]);

  return {
    approve,
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
    resetState,
  };
}
