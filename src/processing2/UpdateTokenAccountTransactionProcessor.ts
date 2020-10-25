import {TransactionProcessor} from "./TransactionProcessor";
import {DecodedTransaction} from "@payburner/keyburner-core/dist/npm";
import {GlobalAddressService, ServiceResponse, TokenService} from "..";
import {
    AccountUtils,
    TransactionTypes, UpdateTokenAccountTransaction
} from "@payburner/keyburner-sidewinder-model/dist/npm";
import {TransactionProcessorBase} from "./TransactionProcessorBase";
import {CommonErrorCodes} from "../model/CommonErrorCodes";

export class UpdateTokenAccountTransactionProcessor extends TransactionProcessorBase implements TransactionProcessor {

    constructor(globalAccountService: GlobalAddressService, tokenService: TokenService) {
        super(globalAccountService, tokenService);
    }

    doProcess(decodedTransaction: DecodedTransaction, items: Array<any>): Promise<ServiceResponse> {
        const self = this;

        return new Promise((resolve, reject) => {
            console.log('Processing create token: ' + decodedTransaction.id);
            const updateTokenTransaction = decodedTransaction.payload as UpdateTokenAccountTransaction;
            self.getTokenService().getToken(updateTokenTransaction.environment, updateTokenTransaction.token_symbol).then(async(token) => {
                if (token.token_issuer_address !== decodedTransaction.address) {
                    resolve(CommonErrorCodes.TOKEN_ACCOUNT_ONLY_ISSUER_CAN_FREEZE);
                    return;
                }
                if (token.token_issuer_address === updateTokenTransaction.account_owner_address) {
                    resolve(CommonErrorCodes.TOKEN_ACCOUNT_CAN_NOT_FREEZE_ISSUER);
                    return;
                }
                try {
                    const tokenAccount = await this.getTokenService().getTokenAccount(updateTokenTransaction.environment, updateTokenTransaction.token_symbol, updateTokenTransaction.account_owner_address);
                    if (tokenAccount === null) {
                        resolve(CommonErrorCodes.TOKEN_ACCOUNT_NOT_FOUND);
                        return;
                    }
                    items.push({
                        Update: {
                            TableName: 'sidewinder_token_account',
                            Key: {
                                account_uri: AccountUtils.calculateTokenAccountId(updateTokenTransaction.environment,
                                    updateTokenTransaction.token_symbol, updateTokenTransaction.account_owner_address),
                            },
                            UpdateExpression: 'SET frozen = :frozen',
                            ExpressionAttributeValues: {
                                ':frozen': updateTokenTransaction.frozen
                            }
                        }
                    });
                    resolve({status:200})
                }
                catch(error) {
                    resolve(CommonErrorCodes.TOKEN_ACCOUNT_NOT_FOUND);
                }

            }).catch((error) => {
                resolve(CommonErrorCodes.TOKEN_NOT_FOUND);
            })
        });
    }

    getTransactionType(): TransactionTypes {
        return TransactionTypes.UpdateTokenAccount;
    }

}