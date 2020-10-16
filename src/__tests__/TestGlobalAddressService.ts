
import {GlobalAddressService} from "../services/GlobalAddressService";

export class TestGlobalAddressService implements GlobalAddressService {

    addresses = {};


    setSequence(address: string, sequence: number): Promise<boolean> {
        const self = this;

        return new Promise((resolve, reject) => {
            if (typeof self.addresses[address] === 'undefined') {
                if (sequence === 0) {
                    self.addresses[address] = 0;
                    resolve(true);
                }
                else {
                    console.log('FAIL HERE 1');
                    resolve(false);
                }
            }
            else {
                if (self.addresses[address] === sequence-1) {
                    self.addresses[address] = sequence;
                    resolve(true);
                }
                else {
                    console.log('FAIL HERE 2:' + JSON.stringify(self.addresses, null, 2) + ' ' + address + ' ' + sequence);
                    resolve(false);
                }
            }
        });
    }
}