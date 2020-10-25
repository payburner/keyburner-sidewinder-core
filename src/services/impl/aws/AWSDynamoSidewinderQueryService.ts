
export class AWSDynamoSidewinderQueryService {

    constructor(docClient) {
        this.docClient = docClient;
    }

    docClient = null;

    getAllEnvironments(address: string): Promise<any> {
        const self = this;
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_sequence",
                IndexName: 'address-environment-index',
                KeyConditionExpression: "address = :address",
                ExpressionAttributeValues: {
                    ":address": address
                },
                ScanIndexForward: true
            };
            const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
                console.log('Query Time Get Sequence: ' + (new Date().getTime()-t0))
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    resolve({status:500, error: err});
                } else {
                    resolve({status:200, data:data})
                }
            });
        })
    }

    getAllTokenAccounts(address: string): Promise<any> {
        const self = this;

        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_token_account",
                IndexName: 'account_owner_address-token_symbol-index',
                KeyConditionExpression: "account_owner_address = :account_owner_address",
                ExpressionAttributeValues: {
                    ":account_owner_address": address
                },
                ScanIndexForward: true

            };
            const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
                console.log('Query Time Get Token Accounts: ' + (new Date().getTime()-t0));
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    resolve({status:500, error: err});
                } else {
                    resolve({status:200, data:data});
                }
            });
        });
    }

}