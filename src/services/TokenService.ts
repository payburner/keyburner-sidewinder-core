import {TokenAccount, TokenDefinition} from "@payburner/keyburner-sidewinder-model/dist/npm";

export interface TokenService {
    getToken(environment: string, token_symbol: string) : Promise<TokenDefinition>;
    createToken(token: TokenDefinition): Promise<TokenDefinition>;
    updateToken(token: TokenDefinition) : Promise<TokenDefinition>;

    freezeTokenAccount(environment: string, token_symbol: string, address: string) : Promise<TokenAccount>;
    unFreezeTokenAccount(environment: string, token_symbol: string, address: string) : Promise<TokenAccount>;
    getTokenAccount(environment: string, token_symbol: string, address: string): Promise<TokenAccount>;
    isAddressPermissionedOnToken(environment: string, token_symbol: string, address: string): Promise<boolean>;
    createTokenAccount( token_account: TokenAccount) : Promise<TokenAccount>;
    setAmounts(environment: string, sender_address_id: any, token_symbol: string, total_balance: number, available_balance: number): Promise<boolean>;
}