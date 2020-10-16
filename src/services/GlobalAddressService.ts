/**
 * This interface provides services from an account_id globally.  To be clear,
 * when we speak of a global address, we refer to an address produced by keyburner-js as derived
 * from a unique seed.
 */
export interface GlobalAddressService {

    setSequence(account_id: string, sequence: number) : Promise<boolean>;
}