
import {GlobalAddressService} from "../../GlobalAddressService";

export class MemoryGlobalAddressService implements GlobalAddressService {

    addresses = {};

    sequenceKey(address: string, environment: string) {
        return environment + '/' + address;
    }

    setSequence(address: string, environment: string, sequence: number): Promise<boolean> {
        const self = this;

        return new Promise((resolve, reject) => {
            if (typeof self.addresses[this.sequenceKey(address, environment)] === 'undefined') {
                if (sequence === 0) {
                    self.addresses[this.sequenceKey(address, environment)] = 0;
                    resolve(true);
                }
                else {
                    console.log('FAIL HERE 1');
                    resolve(false);
                }
            }
            else {
                if (self.addresses[this.sequenceKey(address, environment)] === sequence-1) {
                    self.addresses[this.sequenceKey(address, environment)] = sequence;
                    resolve(true);
                }
                else {
                    console.log('FAIL HERE 2:' + JSON.stringify(self.addresses, null, 2) + ' ' + address + ' ' + sequence);
                    resolve(false);
                }
            }
        });
    }

    getSequence(address: string, environment: string): Promise<number> {
        const self = this;
        return new Promise((resolve, reject) => {
            if (typeof self.addresses[this.sequenceKey(address, environment)] === 'undefined') {
               resolve(0);
            }
            else {
                resolve(self.addresses[this.sequenceKey(address, environment)]);
            }
        });
    }
}