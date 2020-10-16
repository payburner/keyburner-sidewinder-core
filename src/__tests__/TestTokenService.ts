import {TokenService} from "../services/TokenService";
import {AccountUtils, TokenAccount, TokenDefinition} from "@payburner/keyburner-sidewinder-model/dist/npm";

export class TestTokenService implements TokenService {

    tokens = {

    };

    accounts = {

    }

    tokenId(environment: string, token_symbol: string) {
        return environment + '/' + token_symbol;
    }

    createToken(token: TokenDefinition): Promise<TokenDefinition> {
        const self = this;
        return new Promise((resolve, reject) => {
            if (typeof self.tokens[self.tokenId(token.environment, token.token_symbol)] === 'undefined') {
                self.tokens[self.tokenId(token.environment, token.token_symbol)] = token;
                resolve(token);
            }
            else {
                reject('Token already exists.');
            }
        });
    }

    getToken(environment: string, token_symbol: string): Promise<TokenDefinition> {
        const self = this;
        return new Promise((resolve, reject) => {
            if (typeof self.tokens[self.tokenId(environment, token_symbol)] === 'undefined') {
                reject('Token not found.');
            }
            else {
                const token = JSON.parse(JSON.stringify(this.tokens[self.tokenId(environment, token_symbol)])) as TokenDefinition;
                resolve(token);
            }

        });
    }

    getTokenAccount(environment: string, token_symbol: string, address: string): Promise<TokenAccount> {
        const self = this;
        return new Promise((resolve, reject) => {
            const account = self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)];
            if (typeof account === 'undefined') {
                resolve(null);
            }
            else {
                resolve(JSON.parse(JSON.stringify(account)) as TokenAccount);
            }
        });
    }

    isAddressPermissionedOnToken(environment: string, token_symbol: string, address: string): Promise<boolean> {
        return new Promise((resolve)=>{
            resolve(false);
        });
    }

    createTokenAccount( token_account: TokenAccount): Promise<TokenAccount> {
        const self = this;
        const environment = token_account.environment;
        const address = token_account.account_owner_address;
        const token_symbol = token_account.token_symbol;
        return new Promise((resolve, reject)=>{
            if (typeof self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)] !== 'undefined') {
                reject('Account already exists.');
            }
            else {
                self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)] = token_account;
                resolve(token_account);
            }
        });
    }

    setAmounts(environment: string, address: any, token_symbol: string, total_balance: number, available_balance: number): Promise<boolean> {
        console.log('SET AMOUNTS:' + AccountUtils.calculateTokenAccountId(environment, token_symbol, address) + ' ' + total_balance + ' ' + available_balance )
        const self = this;
        return new Promise((resolve, reject)=>{
            if (typeof self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)] === 'undefined') {
                reject('Account not found');
            }
            else {
                self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)].available_balance = available_balance.toFixed(0);
                self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)].total_balance = total_balance.toFixed(0);

                resolve(true);
            }
        });
    }

    updateToken(token:TokenDefinition): Promise<TokenDefinition> {
        const self = this;
        const environment = token.environment;
        const token_symbol = token.token_symbol;
        return new Promise((resolve, reject) => {
            if (typeof self.tokens[self.tokenId( environment, token_symbol)] === 'undefined') {
                reject('Token not found.');
            }
            else {
                this.tokens[self.tokenId( environment, token_symbol)] = token;
                resolve(this.tokens[self.tokenId( environment, token_symbol)] as TokenDefinition);
            }

        });
    }

    freezeTokenAccount(environment: string, token_symbol: string, address: string): Promise<TokenAccount> {
        const self = this;
        return new Promise((resolve, reject)=>{
            if (typeof self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)] === 'undefined') {
                reject('Account not found');
            }
            else {
                self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)].frozen = true;
                resolve(self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)]);
            }
        });
    }

    unFreezeTokenAccount(environment: string, token_symbol: string, address: string): Promise<TokenAccount> {
        const self = this;
        return new Promise((resolve, reject)=>{
            if (typeof self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)] === 'undefined') {
                reject('Account not found');
            }
            else {
                self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)].frozen = false;
                resolve(self.accounts[AccountUtils.calculateTokenAccountId(environment, token_symbol, address)]);
            }
        });
    }

}