import {TransactionProcessor} from "./TransactionProcessor";
import {DecodedTransaction} from "@payburner/keyburner-core/dist/npm";
import {GlobalAddressService, ServiceResponse, TokenService} from "..";
import {
    AccountUtils,
    TokenAccount,
    TransactionTypes,
    TransferTransaction
} from "@payburner/keyburner-sidewinder-model/dist/npm";
import {TransactionProcessorBase} from "./TransactionProcessorBase";
import {CommonErrorCodes} from "../model/CommonErrorCodes";

export class TransferTransactionProcessor extends TransactionProcessorBase implements TransactionProcessor {

    constructor(globalAccountService: GlobalAddressService, tokenService: TokenService) {
        super(globalAccountService, tokenService);
    }

    doProcess(decodedTransaction: DecodedTransaction, items: Array<any>): Promise<ServiceResponse> {
        const self = this;

        return new Promise((resolve, reject) => {
            console.log('Processing transfer: ' + decodedTransaction.id);
            const transferTransaction = decodedTransaction.payload as TransferTransaction;
            self.getTokenService().getToken(transferTransaction.environment, transferTransaction.token_symbol).then(async (token) => {

                let senderAccount = null;
                try {
                    senderAccount = await this.getTokenService()
                    .getTokenAccount(transferTransaction.environment, transferTransaction.token_symbol,
                        transferTransaction.sender_address);
                    console.log('Got Sender Account');
                } catch (error) {
                    // -- noop
                    console.log('Did not get Sender Account');
                }

                let receiverAccount = null;
                try {
                    receiverAccount = await this.getTokenService()
                    .getTokenAccount(transferTransaction.environment, transferTransaction.token_symbol,
                        transferTransaction.receiver_address);
                    console.log('Got Receiver Account');
                } catch (error) {
                    // -- noop
                    console.log('Did not get Receiver Account');
                }

                let isReceiverPermissioned = false;
                if (token.is_permissioned && receiverAccount === null) {
                    // -- if the owner is the sender, then we assume that we are updating the permission.
                    if (token.token_issuer_address === transferTransaction.sender_address) {
                        isReceiverPermissioned = true;
                    } else {
                        isReceiverPermissioned = await this.getTokenService()
                        .isAddressPermissionedOnToken(transferTransaction.environment,
                            transferTransaction.token_symbol, transferTransaction.receiver_address);
                    }
                }

                if (token.frozen) {
                    resolve(CommonErrorCodes.TOKEN_IS_FROZEN);
                    return;
                } else if (!token.allow_transfers_between_accounts &&
                    (token.token_issuer_address !== transferTransaction.receiver_address &&
                        token.token_issuer_address !== transferTransaction.sender_address)) {
                    resolve(CommonErrorCodes.TOKEN_NO_INTER_ACCOUNT_TRANSFERS);
                    return;
                } else if (senderAccount === null) {
                    resolve(CommonErrorCodes.TOKEN_ACCOUNT_SENDER_ACCOUNT_DOES_NOT_EXIST);
                    return;
                } else if (senderAccount !== null && senderAccount.frozen) {
                    resolve(CommonErrorCodes.TOKEN_ACCOUNT_SENDER_ACCOUNT_IS_FROZEN);
                    return;
                } else if (receiverAccount !== null && receiverAccount.frozen) {
                    resolve(CommonErrorCodes.TOKEN_ACCOUNT_RECEIVER_ACCOUNT_IS_FROZEN);
                    return;
                } else if (receiverAccount === null && token.is_permissioned && !isReceiverPermissioned) {
                    resolve(CommonErrorCodes.TOKEN_ACCOUNT_RECEIVER_ACCOUNT_NO_ACCESS_TO_TOKEN);
                    return;
                } else if (typeof token.minimum_transfer_amount !== 'undefined'
                    && (token.minimum_transfer_amount) > (transferTransaction.transfer_amount)) {
                    resolve(CommonErrorCodes.TOKEN_TRANSFER_AMOUNT_LESS_THAN_MINIMUM_TRANSFER);
                    return;
                } else if (typeof token.maximum_transfer_amount !== 'undefined'
                    && (token.maximum_transfer_amount) < (transferTransaction.transfer_amount)) {
                    resolve(CommonErrorCodes.TOKEN_TRANSFER_AMOUNT_GREATER_THAN_MAXIMUM_TRANSFER);
                    return;
                } else if (typeof token.maximum_balance !== 'undefined' && receiverAccount === null
                    && (transferTransaction.transfer_amount) > (token.maximum_balance)) {
                    // -- in this case the destination does not exist, so we need to create it.  But given that
                    // the amount of the transfer exceeds the maximum balance, by definition the destination
                    // account's balance would also exceed maximum balance, so we punt.
                    resolve(CommonErrorCodes.TOKEN_DESTINATION_ACCOUNT_EXCEED_MAXIMUM_BALANCE_NO_ACCOUNT);
                    return;
                } else if (typeof token.maximum_balance !== 'undefined'
                    && receiverAccount !== null && (receiverAccount.available_balance) +
                    (transferTransaction.transfer_amount) > (token.maximum_balance)
                    && transferTransaction.receiver_address !== token.token_issuer_address) {
                    resolve(CommonErrorCodes.TOKEN_DESTINATION_ACCOUNT_EXCEED_MAXIMUM_BALANCE);
                    return;
                } else if ((senderAccount.available_balance) < (transferTransaction.transfer_amount)
                    + (token.transaction_fee)) {
                    resolve(CommonErrorCodes.INSUFFICIENT_BALANCE);
                    return;
                }

                if (senderAccount.account_owner_address === token.token_issuer_address) {

                    items.push({
                        Update: {
                            TableName: 'sidewinder_token_account',
                            Key: {
                                token_account_id: AccountUtils.calculateTokenAccountId(transferTransaction.environment,
                                    transferTransaction.token_symbol, transferTransaction.sender_address),
                            },
                            UpdateExpression: 'SET available_balance = available_balance - :transfer_amount, total_balance = total_balance - :transfer_amount',
                            'ExpressionAttributeValues': {
                                ':transfer_amount' : transferTransaction.transfer_amount
                            }
                        }
                    });


                } else {

                    items.push({
                        Update: {
                            TableName: 'sidewinder_token_account',
                            Key: {
                                token_account_id: AccountUtils.calculateTokenAccountId(transferTransaction.environment,
                                    transferTransaction.token_symbol, transferTransaction.sender_address),
                            },
                            UpdateExpression: 'SET available_balance = available_balance - (:transfer_amount - :transaction_fee), total_balance = total_balance - (:transfer_amount - :transaction_fee)',
                            'ExpressionAttributeValues': {
                                ':transfer_amount' : transferTransaction.transfer_amount,
                                ':transaction_fee' : token.transaction_fee
                            }
                        }
                    });

                }

                if (receiverAccount !== null && receiverAccount.account_owner_address === token.token_issuer_address) {

                    items.push({
                        Update: {
                            TableName: 'sidewinder_token_account',
                            Key: {
                                token_account_id: AccountUtils.calculateTokenAccountId(transferTransaction.environment,
                                    transferTransaction.token_symbol, transferTransaction.receiver_address),
                            },
                            UpdateExpression: 'SET available_balance = available_balance + :transfer_amount + :transaction_fee, total_balance = total_balance +  + :transfer_amount + :transaction_fee',
                            'ExpressionAttributeValues': {
                                ':transfer_amount' : transferTransaction.transfer_amount,
                                ':transaction_fee' : token.transaction_fee                            }
                        }
                    });

                } else {

                    if (receiverAccount === null) {
                        receiverAccount = {
                            token_account_id: AccountUtils.calculateTokenAccountId(transferTransaction.environment,
                                transferTransaction.token_symbol, transferTransaction.receiver_address),
                            token_symbol: token.token_symbol,
                            account_owner_address: transferTransaction.receiver_address,
                            environment: token.environment,
                            sequence: 0,
                            available_balance: transferTransaction.transfer_amount,
                            total_balance: transferTransaction.transfer_amount,
                            locked_balance: 0,
                            frozen: false
                        } as TokenAccount;
                         items.push({
                            Put: {
                                TableName: 'sidewinder_token_account',
                                Item: receiverAccount,
                                ConditionExpression: "attribute_not_exists(token_account_id)"
                            }
                        });
                    }
                    else {
                        items.push({
                            Update: {
                                TableName: 'sidewinder_token_account',
                                Key: {
                                    token_account_id: AccountUtils.calculateTokenAccountId(transferTransaction.environment,
                                        transferTransaction.token_symbol, transferTransaction.receiver_address),
                                },
                                UpdateExpression: 'SET available_balance = available_balance + :transfer_amount, total_balance = total_balance + :transfer_amount',
                                'ExpressionAttributeValues': {
                                    ':transfer_amount' : transferTransaction.transfer_amount,
                                }
                            }
                        });
                    }
                }

                if (senderAccount.account_owner_address !== token.token_issuer_address && receiverAccount.account_owner_address !== token.token_issuer_address) {
                    items.push({
                        Update: {
                            TableName: 'sidewinder_token_account',
                            Key: {
                                token_account_id: AccountUtils.calculateTokenAccountId(transferTransaction.environment,
                                    transferTransaction.token_symbol, token.token_issuer_address),
                            },
                            UpdateExpression: 'SET available_balance = available_balance + :transaction_fee, total_balance = total_balance + :transaction_fee',
                            'ExpressionAttributeValues': {
                                ':transaction_fee' : token.transaction_fee
                            }
                        }
                    });
                }

                resolve({status: 200});

            }).catch((error) => {
                console.log('ERRR:' + error);
                console.log('ERRR:' + JSON.stringify(error, null, 2));
                resolve(CommonErrorCodes.TOKEN_NOT_FOUND);
            })
        });
    }

    getTransactionType(): TransactionTypes {
        return TransactionTypes.Transfer;
    }

}