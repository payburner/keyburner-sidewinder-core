import {DecodedTransaction, KeyBurner} from "@payburner/keyburner-core/dist/npm";
import {AccountUtils, TransactionTypes} from "@payburner/keyburner-sidewinder-model/dist/npm";
import {Transaction} from "@payburner/keyburner-sidewinder-model/dist/npm/transactions/Transaction";
import {TokenService} from "../services/TokenService";
import {GlobalAddressService} from "../services/GlobalAddressService";
import {TransactionProcessor} from "./TransactionProcessor";
import {CreateTokenTransactionProcessor} from "./CreateTokenTransactionProcessor";
import {UpdateTokenTransactionProcessor} from "./UpdateTokenTransactionProcessor";
import {UpdateTokenAccountTransactionProcessor} from "./UpdateTokenAccountTransactionProcessor";
import {TransferTransactionProcessor} from "./TransferTransactionProcessor";
import {CommonErrorCodes} from "../model/CommonErrorCodes";
import {TransactionResponse} from "../model/TransactionResponse";

export class CoreProcessor2 {
    constructor(globalAccountService: GlobalAddressService, tokenService: TokenService) {
        this.keyburner = new KeyBurner();
        this.globalAccountService = globalAccountService;
        this.transactionProcessors.push(
            new CreateTokenTransactionProcessor(globalAccountService, tokenService),
            new TransferTransactionProcessor(globalAccountService, tokenService),
            new UpdateTokenTransactionProcessor(globalAccountService, tokenService),
            new UpdateTokenAccountTransactionProcessor(globalAccountService, tokenService)
        );
    }

    transactionProcessors: Array<TransactionProcessor> = [];
    keyburner: KeyBurner = null;
    globalAccountService: GlobalAddressService = null;


    getTransactionType(decodedTransaction: DecodedTransaction): TransactionTypes {
        return (decodedTransaction.payload as Transaction).transaction_type;
    }

    decodeAndProcessTransaction(signedTransaction: string): Promise<TransactionResponse> {
        const self = this;
        return new Promise((resolve, reject) => {
            const items = [];
            const decodedTransaction = self.keyburner.decodeTransaction(signedTransaction);
            // set sequence
            // -- let's add the sequence update!  it should be stored no matter what.
            items.push({
                Put: {
                    TableName: 'sidewinder_sequence',
                    Item: {
                        address_uri : AccountUtils.calculateEnvironmentAddress(decodedTransaction.payload.environment, decodedTransaction.address),
                        environment: decodedTransaction.payload.environment,
                        address: decodedTransaction.address,
                        sequence: decodedTransaction.payload.sequence

                    },
                    ConditionExpression: "attribute_not_exists(address_uri) OR #seq = :sequence",
                    ExpressionAttributeNames:{"#seq":"sequence"},
                    ExpressionAttributeValues: {
                        ":sequence": decodedTransaction.payload.sequence-1
                    }
                }
            })

            self.processTransaction(decodedTransaction)
            .then((response) => {

                items.push({
                    Put: {
                        TableName: 'sidewinder_transactions',
                        Item: {
                            id: decodedTransaction.id,
                            address_uri: AccountUtils.calculateEnvironmentAddress( decodedTransaction.payload.environment, decodedTransaction.address),
                            environment: decodedTransaction.payload.environment,
                            raw: decodedTransaction.raw,
                            sequence: decodedTransaction.payload.sequence,
                            verified: decodedTransaction.verified,
                            address: decodedTransaction.address,
                            signingKey: decodedTransaction.signingKey,
                            signature: decodedTransaction.signature,
                            status: response.serviceResponse.status,
                            error_code: response.serviceResponse.error_code,
                            error: response.serviceResponse.error,
                            processing_stage: 'PROCESSED'
                        },
                        ConditionExpression: "attribute_not_exists(id)"
                    }
                });

                if (response.serviceResponse.status === 200) {
                    for (var idx in response.transactionItems) {
                        items.push(response.transactionItems[idx]);
                    }

                }

                resolve({
                    serviceResponse: response.serviceResponse,
                    transactionItems: items
                });
            }).catch((error) => {
                // -- here we add the rejected transaction as to keep a record of it, no matter what.
                items.push({
                    Put: {
                        TableName: 'sidewinder_transactions',
                        Item: {
                            id: decodedTransaction.id,
                            address_uri: AccountUtils.calculateEnvironmentAddress( decodedTransaction.payload.environment, decodedTransaction.address),
                            environment: decodedTransaction.payload.environment,
                            raw: decodedTransaction.raw,
                            sequence: decodedTransaction.payload.sequence,
                            verified: decodedTransaction.verified,
                            address: decodedTransaction.address,
                            signingKey: decodedTransaction.signingKey,
                            signature: decodedTransaction.signature,
                            status: CommonErrorCodes.SYSTEM_PROBLEM_UNKNOWN.status,
                            error_code: CommonErrorCodes.SYSTEM_PROBLEM_UNKNOWN.error_code,
                            error: CommonErrorCodes.SYSTEM_PROBLEM_UNKNOWN.error,
                            processing_stage: 'PROCESSED'
                        },
                        ConditionExpression: "attribute_not_exists(id)"
                    }
                });
                resolve({serviceResponse:CommonErrorCodes.SYSTEM_PROBLEM_UNKNOWN, transactionItems: items});
            });

        })
    }

    processTransaction(decodedTransaction: DecodedTransaction ): Promise<TransactionResponse> {
        const self = this;
        return new Promise((resolve, reject) => {

            if (decodedTransaction.verified) {
                const transactionType = this.getTransactionType(decodedTransaction);
                let found = false;
                self.transactionProcessors.forEach((transactionProcessor) => {
                    if (transactionProcessor.getTransactionType() === transactionType) {
                        found = true;
                        const items = [];
                        transactionProcessor.doProcess(decodedTransaction, items)
                        .then((result) => {
                            resolve({serviceResponse:result, transactionItems: items});
                        }).catch((error) => {
                            resolve({serviceResponse:CommonErrorCodes.SYSTEM_PROBLEM_UNKNOWN, transactionItems: []});
                        });
                    }
                });
                if (!found) {
                    resolve(
                    {serviceResponse: CommonErrorCodes.UNKNOWN_TRANSACTION_TYPE, transactionItems: []});
                }
            } else {
                resolve(
                    {serviceResponse: CommonErrorCodes.TRANSACTION_INVALID, transactionItems: []});
            }
        });
    }
}