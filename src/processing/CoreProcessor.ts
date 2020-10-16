import {DecodedTransaction, KeyBurner} from "@payburner/keyburner-core/dist/npm";
import {
    TransactionTypes
} from "@payburner/keyburner-sidewinder-model/dist/npm";
import {Transaction} from "@payburner/keyburner-sidewinder-model/dist/npm/transactions/Transaction";
import {TokenService} from "../services/TokenService";
import {ServiceResponse} from "../model/ServiceResponse";
import {GlobalAddressService} from "../services/GlobalAddressService";
import {TransactionProcessor} from "./TransactionProcessor";
import {CreateTokenTransactionProcessor} from "./CreateTokenTransactionProcessor";
import {UpdateTokenTransactionProcessor} from "./UpdateTokenTransactionProcessor";
import {UpdateTokenAccountTransactionProcessor} from "./UpdateTokenAccountTransactionProcessor";
import {TransferTransactionProcessor} from "./TransferTransactionProcessor";
import {CommonErrorCodes} from "../model/CommonErrorCodes";

export class CoreProcessor {
    constructor(globalAccountService: GlobalAddressService, tokenService: TokenService ) {
        this.keyburner = new KeyBurner();
        this.globalAccountService = globalAccountService;
        this.transactionProcessors.push(
            new CreateTokenTransactionProcessor(globalAccountService, tokenService),
            new TransferTransactionProcessor(globalAccountService, tokenService),
            new UpdateTokenTransactionProcessor(globalAccountService, tokenService),
            new UpdateTokenAccountTransactionProcessor(globalAccountService, tokenService)
        );
    }

    transactionProcessors : Array<TransactionProcessor> = [];
    keyburner: KeyBurner = null;
    globalAccountService: GlobalAddressService = null;

    decodeTransaction(signedTransaction: string): Promise<DecodedTransaction> {
        const self = this;
        return new Promise((resolve, reject) => {
            const decodedTransaction = self.keyburner.decodeTransaction(signedTransaction);
            self.globalAccountService.setSequence(decodedTransaction.address, decodedTransaction.payload.environment, decodedTransaction.payload.sequence).then(
                (result) => {
                    if (result) {
                        resolve(decodedTransaction);
                    }
                    else {
                        reject('Invalid sequence.');
                    }
                }
            ).catch((error) => {
                reject('Invalid sequence.');
            })
        })
    }

    getTransactionType(decodedTransaction: DecodedTransaction): TransactionTypes {
        return (decodedTransaction.payload as Transaction).transaction_type;
    }

    processTransaction(signedTransaction: string) : Promise<ServiceResponse> {
        const self = this;
        return new Promise((resolve, reject) => {
            this.decodeTransaction(signedTransaction).then((decodedTransaction) => {
                if (decodedTransaction.verified) {
                    const transactionType = this.getTransactionType(decodedTransaction);
                    let found = false;
                    self.transactionProcessors.forEach((transactionProcessor) => {
                        if (transactionProcessor.getTransactionType() === transactionType) {
                            found = true;
                            transactionProcessor.doProcess(decodedTransaction)
                            .then((result) => {
                                resolve(result);
                            }).catch((error) => {
                                resolve(error);
                            });
                        }
                    });
                    if (!found) {
                        resolve(CommonErrorCodes.UNKNOWN_TRANSACTION_TYPE);
                    }
                } else {
                    resolve(CommonErrorCodes.TRANSACTION_INVALID);
                }
            }).catch((error) => {
                resolve(CommonErrorCodes.INVALID_SEQUENCE);
            });
        });
    }
}