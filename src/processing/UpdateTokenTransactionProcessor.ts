import {TransactionProcessor} from "./TransactionProcessor";
import {DecodedTransaction} from "@payburner/keyburner-core/dist/npm";
import {GlobalAddressService, ServiceResponse, TokenService} from "..";
import {TransactionTypes, UpdateTokenTransaction} from "@payburner/keyburner-sidewinder-model/dist/npm";
import {TransactionProcessorBase} from "./TransactionProcessorBase";
import {CommonErrorCodes} from "../model/CommonErrorCodes";

export class UpdateTokenTransactionProcessor extends TransactionProcessorBase implements TransactionProcessor {

    constructor(globalAccountService: GlobalAddressService, tokenService: TokenService) {
        super(globalAccountService, tokenService);
    }

    doProcess(decodedTransaction: DecodedTransaction): Promise<ServiceResponse> {
        const self = this;

        return new Promise((resolve, reject) => {
            console.log('Processing create token: ' + decodedTransaction.id);
            const updateTokenTransaction = decodedTransaction.payload as UpdateTokenTransaction;
            self.getTokenService().getToken(updateTokenTransaction.environment, updateTokenTransaction.token_symbol).then((token) => {

                if (typeof updateTokenTransaction.transaction_fee !== 'undefined' && parseInt(updateTokenTransaction.transaction_fee) < 0) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_INVALID_TRANSACTION_FEE);
                    return;
                }

                if (typeof updateTokenTransaction.minimum_transfer_amount !== 'undefined' && typeof updateTokenTransaction.maximum_transfer_amount !== 'undefined') {
                    if (parseInt(updateTokenTransaction.minimum_transfer_amount) > parseInt(updateTokenTransaction.maximum_transfer_amount)) {
                        resolve(CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNTER_GREATER_THAN_MAXIMUM_TRANSFER_AMOUNT);
                        return;
                    }
                    if (parseInt(updateTokenTransaction.minimum_transfer_amount) < 0) {
                        resolve(CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO);
                        return;
                    }
                    if (parseInt(updateTokenTransaction.maximum_transfer_amount) < 0) {
                        resolve(CommonErrorCodes.TOKEN_SETUP_MAXIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO);
                        return;
                    }
                } else if (typeof updateTokenTransaction.minimum_transfer_amount !== 'undefined' && typeof token.maximum_transfer_amount !== 'undefined') {
                    if (parseInt(updateTokenTransaction.minimum_transfer_amount) > parseInt(token.maximum_transfer_amount)) {
                        resolve(CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNTER_GREATER_THAN_MAXIMUM_TRANSFER_AMOUNT);
                        return;
                    }
                    if (parseInt(updateTokenTransaction.minimum_transfer_amount) < 0) {
                        resolve(CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO);
                        return;
                    }
                } else if (typeof updateTokenTransaction.maximum_transfer_amount !== 'undefined' && typeof token.minimum_transfer_amount !== 'undefined') {
                    if (parseInt(updateTokenTransaction.maximum_transfer_amount) < parseInt(token.minimum_transfer_amount)) {
                        resolve(CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNTER_GREATER_THAN_MAXIMUM_TRANSFER_AMOUNT);
                        return;
                    }
                    if (parseInt(updateTokenTransaction.maximum_transfer_amount) < 0) {
                        resolve(CommonErrorCodes.TOKEN_SETUP_MAXIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO);
                        return;
                    }
                }

                if (typeof updateTokenTransaction.maximum_balance !== 'undefined' && typeof token.maximum_balance !== 'undefined') {
                    if (parseInt(updateTokenTransaction.maximum_balance) <= parseInt(token.maximum_balance)) {
                        resolve(CommonErrorCodes.TOKEN_SETUP_MAXIMUM_BALANCE_CAN_ONLY_INCREASE);
                        return;
                    }
                }

                if (token.token_issuer_address !== decodedTransaction.address) {
                    resolve(CommonErrorCodes.TOKEN_UPDATE_NOT_AUTHORIZED);
                    return;
                }

                token.frozen = updateTokenTransaction.frozen;
                token.transaction_fee = updateTokenTransaction.transaction_fee;
                token.maximum_balance = updateTokenTransaction.maximum_balance;
                token.minimum_transfer_amount = updateTokenTransaction.minimum_transfer_amount;
                token.maximum_transfer_amount = updateTokenTransaction.maximum_transfer_amount;
                self.getTokenService().updateToken(token).then((updated) => {
                    resolve({status: 200, data: updated})
                }).catch((error) => {
                    resolve(CommonErrorCodes.SYSTEM_PROBLEM_UPDATING_TOKEN);
                });


            }).catch((error) => {
                resolve(CommonErrorCodes.TOKEN_NOT_FOUND);
            })
        });
    }

    getTransactionType(): TransactionTypes {
        return TransactionTypes.UpdateToken;
    }

}