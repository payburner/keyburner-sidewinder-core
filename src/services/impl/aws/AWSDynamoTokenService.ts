import {TokenService} from "../../TokenService";
import {AccountUtils, TokenAccount, TokenDefinition} from "@payburner/keyburner-sidewinder-model/dist/npm";

export class AWSDynamoTokenService implements TokenService {

    constructor(docClient) {

        this.docClient = docClient;
    }


    docClient = null;


    tokenId(environment, token_symbol) {
        return environment + '/' + token_symbol;
    }

    createToken(token: TokenDefinition): Promise<TokenDefinition> {
        const svc = this;
        return new Promise((resolve, reject) => {

            svc.getToken(token.environment, token.token_symbol)
            .then(
                (token) => {
                    reject('Token already exists.');
                })
            .catch((error) => {
                const dataBody = token;
                const params = {
                    TableName: 'sidewinder_token',
                    Item: dataBody
                };
                svc.docClient.put(params, function (err, data) {
                    if (err) {
                        reject('Db error: ' + err);
                    } else {
                        resolve(token);
                    }
                });
            })
        })
    }

    getToken(environment: string, token_symbol: string): Promise<TokenDefinition> {
        const self = this;

        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_token",
                KeyConditionExpression: "token_symbol = :token_symbol and environment = :environment",
                ExpressionAttributeValues: {
                    ":token_symbol": token_symbol,
                    ":environment": environment
                }
            };
            const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
                console.log('Query Time Get Token: ' + (new Date().getTime()-t0))
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    reject(err);
                } else {

                    if (data.Items.length === 0) {
                        reject('Not found.')
                    } else {
                        resolve(data.Items[0]);
                    }
                }
            });
        })
    }

    getTokenAccount(environment: string, token_symbol: string, address: string): Promise<TokenAccount> {
        const self = this;
        const token_account_id =
            AccountUtils.calculateTokenAccountId(environment, token_symbol,
                address);
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_token_account",
                KeyConditionExpression: "token_account_id = :token_account_id",
                ExpressionAttributeValues: {
                    ":token_account_id": token_account_id
                }
            };
            const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
                console.log('Query Time Get Token Account: ' + (new Date().getTime()-t0));
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    reject(err);
                } else {

                    if (data.Items.length === 0) {
                        reject('Not found.')
                    } else {
                        resolve(data.Items[0]);
                    }
                }
            });
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
        const token_account_id = AccountUtils.calculateTokenAccountId(environment, token_symbol, address);
        return new Promise((resolve, reject)=>{
            self.getTokenAccount(environment, token_symbol, address).then((tokenAccount) => {
                reject('Account already exists.');
            }).catch((error) => {
                token_account['token_account_id'] = token_account_id;
                const dataBody = token_account;
                const params = {
                    TableName: 'sidewinder_token_account',
                    Item: dataBody
                };
                const t0 = new Date().getTime();
                self.docClient.put(params, function (err, data) {
                    console.log('Update Time Create Token Account: ' + (new Date().getTime()-t0))
                    if (err) {
                        reject('Db error: ' + err);
                    } else {
                        resolve(token_account);
                    }
                });
            })
        });
    }

    setAmounts(environment: string, address: any, token_symbol: string, total_balance: number, available_balance: number): Promise<boolean> {
        console.log('SET AMOUNTS:' + AccountUtils.calculateTokenAccountId(environment, token_symbol, address) + ' ' + total_balance + ' ' + available_balance )
        const self = this;
        return new Promise((resolve, reject)=>{
            self.getTokenAccount(environment, token_symbol, address).then((tokenAccount) => {
                tokenAccount.available_balance = available_balance ;
                tokenAccount.total_balance = total_balance ;
                const params = {
                    TableName: 'sidewinder_token_account',
                    Item: tokenAccount
                };
                const t0 = new Date().getTime();
                self.docClient.put(params, function (err, data) {
                    console.log('Update Time Set Amounts: ' + (new Date().getTime()-t0))
                    if (err) {
                        reject('Db error: ' + err);
                    } else {
                        resolve(true);
                    }
                });
            }).catch((error) => {
                reject('Token Account Not Found')
            })
        });
    }

    updateToken(token:TokenDefinition): Promise<TokenDefinition> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.getToken(token.environment, token.token_symbol).then((resolvedToken)=> {
                const dataBody = token;
                const params = {
                    TableName: 'sidewinder_token',
                    Item: dataBody
                };
                self.docClient.put(params, function (err, data) {
                    if (err) {
                        console.log("Dynamo DB Error", err);
                        reject('Db error: ' + err);
                    } else {
                        console.log("Dynamo DB Success", data);
                        resolve(token);
                    }
                });
            }).catch((error) => {
                reject('Token does not exist.');
            })
        })
    }

    freezeTokenAccount(environment: string, token_symbol: string, address: string): Promise<TokenAccount> {
        const self = this;
        return new Promise((resolve, reject)=>{
            self.getTokenAccount(environment, token_symbol, address).then((tokenAccount) => {
                tokenAccount.frozen = true;
                const params = {
                    TableName: 'sidewinder_token_account',
                    Item: tokenAccount
                };
                self.docClient.put(params, function (err, data) {
                    if (err) {
                        reject('Db error: ' + err);
                    } else {
                        resolve(tokenAccount);
                    }
                });
            }).catch((error) => {
                reject('Token Account Not Found')
            })
        });
    }

    unFreezeTokenAccount(environment: string, token_symbol: string, address: string): Promise<TokenAccount> {
        const self = this;
        return new Promise((resolve, reject)=>{
            self.getTokenAccount(environment, token_symbol, address).then((tokenAccount) => {
                tokenAccount.frozen = false;
                const params = {
                    TableName: 'sidewinder_token_account',
                    Item: tokenAccount
                };
                self.docClient.put(params, function (err, data) {
                    if (err) {
                        reject('Db error: ' + err);
                    } else {
                        console.log("Dynamo DB Success", data);
                        resolve(tokenAccount);
                    }
                });
            }).catch((error) => {
                reject('Token Account Not Found')
            })
        });
    }

}