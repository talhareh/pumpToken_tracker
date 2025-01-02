import { Connection, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { getSolPrice } from '../utils/helpers';

const LAMPORTS_PER_SOL = 1_000_000_000;
const TOKEN_DECIMALS = 6;
const EXPECTED_DISCRIMINATOR = Buffer.alloc(8);
EXPECTED_DISCRIMINATOR.writeBigInt64LE(BigInt('6966180631402821399'));

interface BondingCurveState {
    virtualTokenReserves: bigint;
    virtualSolReserves: bigint;
    realTokenReserves: bigint;
    realSolReserves: bigint;
    tokenTotalSupply: bigint;
    complete: boolean;
}

function parseBondingCurveState(data: Buffer): BondingCurveState {
    if (data.length < 8) throw new Error("Invalid data length");

    const state = {
        virtualTokenReserves: data.readBigInt64LE(8),
        virtualSolReserves: data.readBigInt64LE(16),
        realTokenReserves: data.readBigInt64LE(24),
        realSolReserves: data.readBigInt64LE(32),
        tokenTotalSupply: data.readBigInt64LE(40),
        complete: data.readUInt8(48) === 1
    };
    
    return state;
}

function getAssociatedBondingCurveAddress(
    mint: PublicKey,
    programId: PublicKey
): [PublicKey, number] {
    const address = PublicKey.findProgramAddressSync(
        [
            Buffer.from("bonding-curve"),
            mint.toBuffer()
        ],
        programId
    );
    
    return address;
}

async function getBondingCurveState(
    connection: Connection,
    curveAddress: PublicKey
): Promise<BondingCurveState> {
    const account = await connection.getAccountInfo(curveAddress);
    if (!account || !account.data) {
        throw new Error("Invalid curve state: No data");
    }

    const data = account.data;
    if (!data.slice(0, 8).equals(EXPECTED_DISCRIMINATOR)) {
        throw new Error("Invalid curve state discriminator");
    }

    return parseBondingCurveState(data);
}


async function calculateBondingCurvePrice(curveState: BondingCurveState): Promise<number> {
    if (curveState.virtualTokenReserves <= 0n || curveState.virtualSolReserves <= 0n) {
        throw new Error("Invalid reserve state");
    }

    const solPrice = await getSolPrice();

    const solReserves = Number(curveState.virtualSolReserves) / LAMPORTS_PER_SOL;
    const tokenReserves = Number(curveState.virtualTokenReserves) / Math.pow(10, TOKEN_DECIMALS);

    const priceInSol = solReserves / tokenReserves;

    const priceInUsd = priceInSol * solPrice;

    return priceInUsd;
}

export {
    getBondingCurveState,
    getAssociatedBondingCurveAddress,
    BondingCurveState,
    calculateBondingCurvePrice
};