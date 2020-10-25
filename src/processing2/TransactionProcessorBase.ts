import {GlobalAddressService, TokenService} from "..";
import {KeyBurner} from "@payburner/keyburner-core/dist/npm";

export class TransactionProcessorBase {
    constructor(globalAccountService: GlobalAddressService, tokenService: TokenService ) {
        this.keyburner = new KeyBurner();
        this.globalAccountService = globalAccountService;
        this.tokenService = tokenService;
    }

    keyburner: KeyBurner = null;
    globalAccountService: GlobalAddressService = null;
    tokenService: TokenService = null;

    getKeyBurner() {
        return this.keyburner;
    }

    getTokenService() {
        return this.tokenService;
    }

    getGlobalAccountService() {
        return this.globalAccountService;
    }
}