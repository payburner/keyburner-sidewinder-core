
import {GlobalAddressService} from "../../GlobalAddressService";

export class AWSDynamoGlobalAddressService implements GlobalAddressService {

    constructor(docClient) {
        this.docClient = docClient;
    }

    docClient = null;

    sequenceKey(address: string, environment: string) {
        return environment + '/' + address;
    }

    setSequence(address: string, environment: string, sequence: number): Promise<boolean> {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.getSequence(address, environment).then((existingSequence) => {
                if (existingSequence === 0 && sequence === 0) {
                    resolve( true );
                    return;
                }
                else if (sequence != existingSequence+1) {
                    resolve( false );
                    return;
                }
                const dataBody = {
                    address: address,
                    environment: environment,
                    sequence: sequence
                }
                const params = {
                    TableName: 'sidewinder_sequence',
                    Item: dataBody
                };
                const t0 = new Date().getTime();
                self.docClient.put(params, function (err, data) {
                    console.log('Update Time Set Sequence: ' + (new Date().getTime()-t0))
                    if (err) {
                        resolve(false)
                    } else {
                        resolve(true);
                    }
                });
            });
        })

    }

    getSequence(address: string, environment: string): Promise<number> {
        const self = this;
        return new Promise((resolve, reject) => {
            const params = {
                TableName: "sidewinder_sequence",
                IndexName: 'address-environment-index',
                KeyConditionExpression: "address = :address and environment = :environment",
                ExpressionAttributeValues: {
                    ":address": address,
                    ":environment": environment
                }
            };
            const t0 = new Date().getTime();
            self.docClient.query(params, function (err, data) {
                console.log('Query Time Get Sequence: ' + (new Date().getTime()-t0))
                if (err) {
                    console.error("Unable to query. Error:",
                        JSON.stringify(err, null, 2));
                    reject(err);
                } else {
                    if (data.Items.length === 0) {
                        resolve(0);
                    }
                    else {
                        resolve(data.Items[0].sequence);
                    }
                }
            });
        })
    }
}