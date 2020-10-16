import {DecodedTransaction} from "@payburner/keyburner-core/dist/npm";
import {ServiceResponse} from "..";
import {TransactionTypes} from "@payburner/keyburner-sidewinder-model/dist/npm/transactions/TransactionTypes";

export interface TransactionProcessor {
    doProcess(decodedTransaction: DecodedTransaction) : Promise<ServiceResponse>;
    getTransactionType() : TransactionTypes;
}