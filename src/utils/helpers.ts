// src/utils/helpers.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { Jupiter, RouteInfo } from '@jup-ag/core';
import JSBI from 'jsbi';
import axios from 'axios'

export async function getPoolAddress(tokenMint: string): Promise<string> {
  const connection = new Connection(process.env.RPC_ENDPOINT!);
  
  const jupiter = await Jupiter.load({
    connection,
    cluster: 'mainnet-beta',
  });



  const routes = await jupiter.computeRoutes({
    inputMint: new PublicKey(tokenMint),
    outputMint: new PublicKey('So11111111111111111111111111111111111111112'), // USDC
    amount: JSBI.BigInt(1000000), 
    slippageBps: 50,
  });

  return routes.routesInfos[0]?.marketInfos[0]?.amm.id || '';
}

export async function getSolPrice(): Promise<number> {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        return response.data.solana.usd;
    } catch (error) {
        console.error('Error fetching SOL price:', error);
        throw error;
    }
}