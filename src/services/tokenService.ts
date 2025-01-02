import { PublicKey, Connection } from '@solana/web3.js';
import { TokenState } from '../types';
import { getAssociatedBondingCurveAddress, getBondingCurveState, calculateBondingCurvePrice } from './bondingCurve';


const PUMP_PROGRAM = new PublicKey(process.env.PUMP_PROGRAM || "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
  
export class TokenService {
    private connection: Connection;
    private tokenAddress: PublicKey;
  
    constructor(rpcEndpoint: string, tokenAddress: string) {
      this.connection = new Connection(rpcEndpoint);
      this.tokenAddress = new PublicKey(tokenAddress);
    }
    
    async getTokenState(): Promise<TokenState> {
      try {
        const [bondingCurveAddress] = getAssociatedBondingCurveAddress(this.tokenAddress, PUMP_PROGRAM);
        const curveState = await getBondingCurveState(this.connection, bondingCurveAddress);
        
        const price = await calculateBondingCurvePrice(curveState);
        const tokenSupply = await this.connection.getTokenSupply(this.tokenAddress);
        const supply = Number(tokenSupply.value.amount) / Math.pow(10, tokenSupply.value.decimals);
        const marketCap = supply * price;
  
        let state: TokenState['state'] = 'unknown';
        if (marketCap > 1000000) {
          state = 'graduated';
        } else if (marketCap > 100000) {
          state = 'graduating';
        }
  
        return { marketCap, state, price };
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    }
  }