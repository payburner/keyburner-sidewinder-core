
export class AWSTransactionalWriteService {

    constructor(docClient) {

        this.docClient = docClient;
    }

    docClient = null;

    write(input: Array<any>) : Promise<boolean>{
        const comp = this;
        return new Promise((resolve, reject) => {
            console.log('Transact Request:' + JSON.stringify(input, null, 2));
            comp.docClient.transactWrite({ TransactItems: input }, function (err, data) {
                if (err) {
                    console.log('AWS Transactional Write Error:' + err);
                    console.log('AWS Transactional Write Error:' + JSON.stringify(err, null, 2));
                    resolve(false)
                } else {
                    resolve(true);
                }
            });
        });
    }

}