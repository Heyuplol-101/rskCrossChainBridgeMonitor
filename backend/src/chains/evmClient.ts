import { JsonRpcProvider, Contract, getAddress } from "ethers";
import { ChainClient, BalanceResult } from "./types";
import powpegAbi from "../abis/powpeg.json";

const erc20Abi = [
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// Strongly-typed minimal contract interfaces for the methods we use.
// We don't extend ethers.Contract to avoid index signature conflicts; instead
// we cast Contract instances to these minimal shapes where needed.
interface Erc20Contract {
  balanceOf(account: string): Promise<{ toString(): string }>;
  totalSupply(): Promise<{ toString(): string }>;
  decimals(): Promise<unknown>;
  symbol(): Promise<unknown>;
}

interface PowpegContract {
  getFederationAddress(): Promise<unknown>;
}

interface FederationBridgeContract {
  getFederation(): Promise<unknown>;
}

interface GenericMethodContract {
  // For dynamic method invocation in callContractMethod
  [key: string]: ((...args: unknown[]) => Promise<unknown>) | unknown;
}

export class EvmChainClient implements ChainClient {
  private provider: JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  private normalizeAddress(address: string): string {
    return getAddress(address.toLowerCase());
  }

  async getNativeBalance(address: string): Promise<BalanceResult> {
    const balance = await this.provider.getBalance(address);
    return { balance: BigInt(balance.toString()), raw: balance };
  }

  async getTokenBalance(
    holder: string,
    tokenAddress: string
  ): Promise<BalanceResult> {
    // Normalize addresses to checksummed format
    const normalizedToken = this.normalizeAddress(tokenAddress);
    const normalizedHolder = this.normalizeAddress(holder);
    const contract = new Contract(
      normalizedToken,
      erc20Abi,
      this.provider
    ) as unknown as Erc20Contract;
    const balance = await contract.balanceOf(normalizedHolder);
    return { balance: BigInt(balance.toString()), raw: balance };
  }

  async getTokenTotalSupply(tokenAddress: string): Promise<BalanceResult> {
    const normalizedToken = this.normalizeAddress(tokenAddress);
    const contract = new Contract(
      normalizedToken,
      erc20Abi,
      this.provider
    ) as unknown as Erc20Contract;
    const supply = await contract.totalSupply();
    return { balance: BigInt(supply.toString()), raw: supply };
  }

  async getTokenDecimals(tokenAddress: string): Promise<number> {
    const normalizedToken = this.normalizeAddress(tokenAddress);
    const contract = new Contract(
      normalizedToken,
      erc20Abi,
      this.provider
    ) as unknown as Erc20Contract;
    const decimals = await contract.decimals();
    return Number(decimals);
  }

  async getTokenSymbol(tokenAddress: string): Promise<string | null> {
    const normalizedToken = this.normalizeAddress(tokenAddress);
    const contract = new Contract(
      normalizedToken,
      erc20Abi,
      this.provider
    ) as unknown as Erc20Contract;
    const symbol = await contract.symbol();
    return symbol as string;
  }

  async verifyTokenContract(
    tokenAddress: string
  ): Promise<{ decimals: number; symbol: string; totalSupply: bigint } | null> {
    const normalizedToken = this.normalizeAddress(tokenAddress);
    const contract = new Contract(
      normalizedToken,
      erc20Abi,
      this.provider
    ) as unknown as Erc20Contract;

    const [decimals, symbol, totalSupply] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.totalSupply(),
    ]);

    return {
      decimals: Number(decimals),
      symbol: symbol as string,
      totalSupply: BigInt(totalSupply.toString()),
    };
  }

  /**
   * Call a contract method and return the result.
   * Useful for calling getFederationAddress() on bridge contracts.
   */
  async callContractMethod<T = string>(
    contractAddress: string,
    abi: string[],
    methodName: string,
    params: unknown[] = []
  ): Promise<T> {
    const normalizedAddress = this.normalizeAddress(contractAddress);
    const contract = new Contract(
      normalizedAddress,
      abi,
      this.provider
    ) as unknown as GenericMethodContract;
    const fn = contract[methodName];
    if (typeof fn !== "function") {
      throw new Error(`Method ${methodName} not found on contract ${normalizedAddress}`);
    }
    const result = await fn(...params);
    return result as T;
  }

  /**
   * Get the federation Bitcoin address from PowPeg precompiled contract.
   * This address is dynamic and changes on federation updates.
   *
   * Two different bridges on Rootstock:
   * 1. PowPeg (BTC ↔ RBTC) - Precompiled at 0x0000000000000000000000000000000001000006
   *    - Has getFederationAddress() -> returns Bitcoin address (string)
   * 2. Token Bridge (ERC20) - At 0x9D11937e2179dC5270Aa86A3f8143232d6Da0E69
   *    - Has getFederation() -> returns Federation contract address (address)
   */
  async getFederationAddress(bridgeContractAddress: string): Promise<string> {
    try {
      const normalizedBridge = this.normalizeAddress(bridgeContractAddress);
      const POWPEG_ADDRESS = "0x0000000000000000000000000000000001000006";

      // Check if this is PowPeg precompiled contract
      if (normalizedBridge.toLowerCase() === POWPEG_ADDRESS.toLowerCase()) {
        // PowPeg: Call getFederationAddress() directly - returns Bitcoin address
        const powpegContract = new Contract(
          POWPEG_ADDRESS,
          powpegAbi,
          this.provider
        ) as unknown as PowpegContract;
        const bitcoinAddress = await powpegContract.getFederationAddress();
        console.log(`[EvmChainClient] PowPeg Bitcoin address: ${bitcoinAddress}`);
        return bitcoinAddress as string;
      } else {
        // Token Bridge: Get Federation contract address first
        const federationAbi = ["function getFederation() view returns (address)"];
        const bridgeContract = new Contract(
          normalizedBridge,
          federationAbi,
          this.provider
        ) as unknown as FederationBridgeContract;
        const federationContractAddress = await bridgeContract.getFederation();
        console.log(
          `[EvmChainClient] Token Bridge Federation address: ${federationContractAddress}`
        );
        return federationContractAddress as string;
      }
    } catch (err: any) {
      throw new Error(`getFederationAddress() failed: ${err.message}`);
    }
  }
}

