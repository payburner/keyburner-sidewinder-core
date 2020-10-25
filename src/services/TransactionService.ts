import {DecodedTransaction} from "@payburner/keyburner-core/dist/npm";

export interface TransactionService {

    saveDecodedTransaction(decodedTransaction: DecodedTransaction): Promise<boolean>;

    getProcessedTransaction(environment: string, id: string): Promise<DecodedTransaction>;

    getProcessedTransactions(environment: string, address: string): Promise<Array<DecodedTransaction>>;

}