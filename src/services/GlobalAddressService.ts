/**
 * This interface provides services from an account_id globally by environment.  To be clear,
 * when we speak of a global address, we refer to an address produced by keyburner-js as derived
 * from a unique seed.
 */
export interface GlobalAddressService {
    setSequence(address: string, environment: string, sequence: number) : Promise<boolean>;
    getSequence(address: string, environment: string) : Promise<number>;
}