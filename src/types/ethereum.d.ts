// Minimal EIP-1193 provider surface, injected by Nimiq Pay for EVM calls.
interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
}

interface Window {
  ethereum?: Eip1193Provider
}
