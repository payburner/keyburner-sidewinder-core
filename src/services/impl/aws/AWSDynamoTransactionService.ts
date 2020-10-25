import {TransactionService} from "../../TransactionService";
import {AccountUtils} from "@payburner/keyburner-sidewinder-model/dist/npm";

import {DecodedTransaction} from "@payburner/keyburner-core/dist/npm";
export class AWSDynamoTransactionService implements TransactionService {

    constructor(docClient) {

        this.docClient = docClient;
    }

    docClient = null;

    saveDecodedTransaction(decodedTransaction: DecodedTransaction) : Promise<boolean>{
        const comp = this;
        return new Promise((resolve, reject) => {
            const dataBody = decodedTransaction
            const params = {
                TableName: 'sidewinder_transactions',
                Item: dataBody
            };
            const t0 = new Date().getTime();
            comp.docClient.put(params, function (err, data) {
                console.log('Update Time Saved Decoded Transaction: ' + (new Date().getTime()-t0))
                if (err) {
                    resolve(false)
                } else {
                    resolve(true);
                }
            });
        })
    }

    getProcessedTransaction(environment: string, id: string): Promise<DecodedTransaction> {
        const self = this;
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_transactions",
                KeyConditionExpression: "id = :id and environment = :environment",
                ExpressionAttributeValues: {
                    ":id": id,
                    ":environment": environment
                }
            };
            const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
                console.log('Query Time Get Processed Transaction: ' + (new Date().getTime()-t0))
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    reject(err);
                } else {

                    if (data.Items.length === 0) {
                        reject('Not found.')
                    }
                    else {
                        resolve(data.Items[0]);
                    }
                }
            });
        })
    }

    getProcessedTransactions(environment: string, address: string)  :Promise<Array<DecodedTransaction>> {
        const self = this;
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_transactions",
                IndexName: "address_uri-sequence-index",
                KeyConditionExpression: "address_uri = :address_uri",
                ExpressionAttributeValues: {
                    ":address_uri": AccountUtils.calculateEnvironmentAddress(environment, address)
                },
                ScanIndexForward: false
            };
            const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
                console.log('Query Time Get Processed Transaction: ' + (new Date().getTime()-t0))
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        })
    }

}