'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { usePrivy } from '@privy-io/react-auth';
import { ADDRESSES, erc20Abi } from '@/config/contracts';

// ── Types ──────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'success' | 'error';
  txHash?: string;
}

// ── Helpers ────────────────────────────────────────
function shortAddr(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// ── Mock balances for non-send commands ────────────
const MOCK_BALANCES = {
  pusd: 1_247.83,
  usdc: 3_580.50,
  yield: 59.42,
};

function randomTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

// ── Command parser ─────────────────────────────────
interface ParsedCommand {
  type: 'send' | 'balance' | 'claim' | 'help' | 'mint' | 'unknown';
  token?: string;
  amount?: number;
  to?: string;
  raw: string;
}

function parseCommand(input: string): ParsedCommand {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  if (lower === 'help' || lower === '/help' || lower.includes('what can you do')) {
    return { type: 'help', raw };
  }

  if (lower.includes('balance') || lower.includes('saldo') || lower === 'bal') {
    return { type: 'balance', raw };
  }

  if (lower.includes('claim') || lower.includes('harvest')) {
    return { type: 'claim', raw };
  }

  if (lower.includes('mint') || lower.includes('faucet')) {
    const amountMatch = lower.match(/(\d+(?:\.\d+)?)/);
    return { type: 'mint', amount: amountMatch ? parseFloat(amountMatch[1]) : 1000, raw };
  }

  // Send: "send 100 pusd to 0x..." or "kirim 10 pusd ke 0x..."
  const sendRegex = /(?:send|transfer|kirim)\s+(\d+(?:\.\d+)?)\s*(pusd|usdc|p usd)?\s*(?:to|ke|→)\s*(0x[a-fA-F0-9]+)/i;
  const sendMatch = raw.match(sendRegex);
  if (sendMatch) {
    return {
      type: 'send',
      amount: parseFloat(sendMatch[1]),
      token: (sendMatch[2] || 'pusd').replace(/\s/g, '').toLowerCase(),
      to: sendMatch[3],
      raw,
    };
  }

  // Simpler: "send pusd to 0x..."
  const sendSimple = /(?:send|transfer|kirim)\s*(pusd|usdc)?\s*(?:to|ke|→)\s*(0x[a-fA-F0-9]+)/i;
  const sendSimpleMatch = raw.match(sendSimple);
  if (sendSimpleMatch) {
    return {
      type: 'send',
      token: (sendSimpleMatch[1] || 'pusd').toLowerCase(),
      to: sendSimpleMatch[2],
      raw,
    };
  }

  return { type: 'unknown', raw };
}

// ── Mock response for non-send commands ────────────
async function processMockCommand(cmd: ParsedCommand): Promise<{ content: string; status: 'success' | 'error'; txHash?: string }> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

  switch (cmd.type) {
    case 'help':
      return {
        content: `🤖 **Phantmo AI Assistant**\n\nHere's what I can do:\n\n• \`send 100 pusd to 0x...\` — Transfer pUSD (real tx!)\n• \`send 50 usdc to 0x...\` — Transfer USDC (real tx!)\n• \`balance\` — Check your balances\n• \`claim\` — Claim pending yield\n• \`mint 1000\` — Mint mock USDC\n• \`help\` — Show this message`,
        status: 'success',
      };
    case 'balance':
      return {
        content: `💰 **Your Balances**\n\n• pUSD: **${MOCK_BALANCES.pusd.toLocaleString()}**\n• USDC: **${MOCK_BALANCES.usdc.toLocaleString()}**\n• Pending Yield: **$${MOCK_BALANCES.yield.toFixed(2)}**`,
        status: 'success',
      };
    case 'claim': {
      const txHash = randomTxHash();
      return {
        content: `✅ **Yield Claimed!**\n\nClaimed **$${MOCK_BALANCES.yield.toFixed(2)}** yield to your wallet.\n\n🔗 Tx: \`${shortAddr(txHash)}\``,
        status: 'success',
        txHash,
      };
    }
    case 'mint': {
      const amount = cmd.amount || 1000;
      const txHash = randomTxHash();
      return {
        content: `✅ **USDC Minted!**\n\nMinted **${amount.toLocaleString()} USDC** to your wallet.\n\n🔗 Tx: \`${shortAddr(txHash)}\``,
        status: 'success',
        txHash,
      };
    }
    default:
      return {
        content: `🤔 I didn't understand that. Try:\n\n• \`send 100 pusd to 0x...\`\n• \`balance\`\n• \`claim\`\n• \`help\``,
        status: 'error',
      };
  }
}

// ── Component ──────────────────────────────────────
export function Chatbot() {
  const { authenticated, login } = usePrivy();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: '👋 Hey! I\'m the Phantmo assistant.\n\nI can **send real pUSD/USDC transfers** on Monad Testnet!\n\nTry: `send 10 pusd to 0x6896...63C6`\n\nType **help** for all commands.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTxMsgId, setPendingTxMsgId] = useState<string | null>(null);

  // Wagmi write contract for real sends
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingSendRef = useRef<ParsedCommand | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  // Watch for tx hash (submitted)
  useEffect(() => {
    if (txHash && pendingTxMsgId) {
      const cmd = pendingSendRef.current;
      const token = (cmd?.token || 'pusd').toUpperCase();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingTxMsgId
            ? {
                ...m,
                content: `⏳ **Transaction Submitted**\n\nSending **${cmd?.amount} ${token}** to \`${shortAddr(cmd?.to || '')}\`\n\n🔗 Tx: \`${shortAddr(txHash)}\`\n\nWaiting for confirmation...`,
                status: 'pending' as const,
                txHash,
              }
            : m
        )
      );
    }
  }, [txHash, pendingTxMsgId]);

  // Watch for tx confirmed
  useEffect(() => {
    if (isConfirmed && pendingTxMsgId && txHash) {
      const cmd = pendingSendRef.current;
      const token = (cmd?.token || 'pusd').toUpperCase();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingTxMsgId
            ? {
                ...m,
                content: `✅ **Transfer Successful!**\n\nSent **${cmd?.amount} ${token}** to \`${shortAddr(cmd?.to || '')}\`\n\n🔗 Tx: \`${shortAddr(txHash)}\``,
                status: 'success' as const,
                txHash,
              }
            : m
        )
      );
      setPendingTxMsgId(null);
      pendingSendRef.current = null;
      setIsProcessing(false);
      resetWrite();
    }
  }, [isConfirmed, pendingTxMsgId, txHash, resetWrite]);

  // Watch for tx error
  useEffect(() => {
    const err = writeError || confirmError;
    if (err && pendingTxMsgId) {
      const shortMsg = (err as any)?.shortMessage || err.message || 'Transaction failed';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingTxMsgId
            ? {
                ...m,
                content: `❌ **Transaction Failed**\n\n${shortMsg}`,
                status: 'error' as const,
              }
            : m
        )
      );
      setPendingTxMsgId(null);
      pendingSendRef.current = null;
      setIsProcessing(false);
      resetWrite();
    }
  }, [writeError, confirmError, pendingTxMsgId, resetWrite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const parsed = parseCommand(trimmed);

    // ── Real send via writeContract ──
    if (parsed.type === 'send') {
      if (!authenticated) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'bot',
            content: '❌ **Wallet not connected**\n\nPlease connect your wallet first to send real transactions.',
            timestamp: new Date(),
            status: 'error',
          },
        ]);
        return;
      }

      if (!parsed.to || !isValidAddress(parsed.to)) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'bot',
            content: '❌ **Invalid address**\n\nPlease provide a valid address (0x... 40 hex chars).',
            timestamp: new Date(),
            status: 'error',
          },
        ]);
        return;
      }

      if (!parsed.amount || parsed.amount <= 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'bot',
            content: `❌ **Invalid amount**\n\nExample: \`send 10 pusd to ${parsed.to}\``,
            timestamp: new Date(),
            status: 'error',
          },
        ]);
        return;
      }

      // Show pending message
      const msgId = `bot-${Date.now()}`;
      setIsProcessing(true);
      setPendingTxMsgId(msgId);
      pendingSendRef.current = parsed;

      const token = (parsed.token || 'pusd').toUpperCase();
      setMessages((prev) => [
        ...prev,
        {
          id: msgId,
          role: 'bot',
          content: `🔄 **Initiating Transfer**\n\nSending **${parsed.amount} ${token}** to \`${shortAddr(parsed.to!)}\`\n\nPlease confirm in your wallet...`,
          timestamp: new Date(),
          status: 'pending',
        },
      ]);

      // Determine which token contract to use
      const tokenAddress = parsed.token === 'usdc' ? ADDRESSES.mockUsdc : ADDRESSES.pUsd;
      const amountWei = parseUnits(parsed.amount.toString(), 18);

      writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [parsed.to as `0x${string}`, amountWei],
      });

      return;
    }

    // ── Mock commands (balance, claim, help, etc.) ──
    setIsProcessing(true);
    const thinkingId = `bot-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: 'bot', content: '...', timestamp: new Date(), status: 'pending' },
    ]);

    const result = await processMockCommand(parsed);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === thinkingId
          ? { ...m, content: result.content, status: result.status, txHash: result.txHash }
          : m
      )
    );
    setIsProcessing(false);
  };

  // Simple markdown-ish renderer
  const renderContent = (content: string) => {
    if (content === '...') {
      return (
        <span className="chatbot-typing">
          <span className="chatbot-dot" />
          <span className="chatbot-dot" />
          <span className="chatbot-dot" />
        </span>
      );
    }

    return content.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/`(.*?)`/g, '<code>$1</code>');
      if (processed.startsWith('• ')) {
        processed = `<span style="display:flex;gap:6px"><span>•</span><span>${processed.slice(2)}</span></span>`;
      }
      return (
        <span key={i} style={{ display: 'block', minHeight: line === '' ? 8 : undefined }} dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        className="chatbot-fab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI assistant"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="chatbot-avatar">🤖</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Phantmo AI</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                  Online
                </div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-msg chatbot-msg-${msg.role}`}>
                <div className={`chatbot-bubble chatbot-bubble-${msg.role}`}>
                  {renderContent(msg.content)}
                </div>
                <div className="chatbot-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.status === 'success' && msg.txHash && (
                    <span style={{ color: 'var(--success)', marginLeft: 6 }}>✓ confirmed</span>
                  )}
                  {msg.status === 'pending' && (
                    <span style={{ color: 'var(--warning)', marginLeft: 6 }}>⏳ pending</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chatbot-input-area" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Try "send 10 pusd to 0x..." or "help"'
              className="chatbot-input"
              disabled={isProcessing}
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={!input.trim() || isProcessing}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
