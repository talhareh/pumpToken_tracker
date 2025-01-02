import dotenv from 'dotenv';
import { Connection, PublicKey } from '@solana/web3.js';
import { TokenService } from './services/tokenService';
import { getBondingCurveState, getAssociatedBondingCurveAddress } from './services/bondingCurve';

dotenv.config();

const INTERVAL = 10000; 
const PUMP_PROGRAM = new PublicKey(process.env.PUMP_PROGRAM || "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

async function main() {
  if (!process.env.RPC_ENDPOINT || !process.env.TOKEN_ADDRESS) {
    throw new Error("Missing required environment variables");
  }

  const connection = new Connection(process.env.RPC_ENDPOINT);
  const tokenAddress = new PublicKey(process.env.TOKEN_ADDRESS);
  const tokenService = new TokenService(process.env.RPC_ENDPOINT, process.env.TOKEN_ADDRESS);

//  await tokenService.initialize();

  setInterval(async () => {
    try {
      // Get token state
      const tokenState = await tokenService.getTokenState();
      console.log(`\nPrice: $${tokenState.price}`);
      console.log(`Market Cap: $${tokenState.marketCap.toLocaleString()}`);

      // Get bonding curve state
      const [bondingCurveAddress] = getAssociatedBondingCurveAddress(tokenAddress, PUMP_PROGRAM);
      const curveState = await getBondingCurveState(connection, bondingCurveAddress);
      
      console.log(`Token Mint:              ${tokenAddress}`);
      console.log(`Associated Bonding Curve: ${bondingCurveAddress}`);
      console.log(`Completion Status: ${curveState.complete ? 'Completed' : 'Not Completed'}`);
      console.log('-------------------');
    } catch (error) {
      console.error('Error in main loop:', error);
    }
  }, INTERVAL);
}

main().catch(console.error);