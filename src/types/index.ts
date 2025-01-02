export interface TokenState {
    marketCap: number;
    state: 'graduating' | 'graduated' | 'unknown';
    price: number;
  }