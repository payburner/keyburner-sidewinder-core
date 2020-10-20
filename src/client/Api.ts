import {KeyBurner, KeyPair, SignedTransaction} from "@payburner/keyburner-core/dist/npm";
import {
    CreateTokenTransaction,
    TransferTransaction,
    UpdateTokenAccountTransaction,
    UpdateTokenTransaction
} from "@payburner/keyburner-sidewinder-model/dist/npm";


export class Api {
    constructor() {
        this.keyburner = new KeyBurner();
    }

    keyburner: KeyBurner = null;
    keyPair: KeyPair = null;
    address = null;


    newAddress() {
        const seed = this.keyburner.generateSeed();
        this.keyPair = this.keyburner.deriveKeyPair(seed);
        this.address = this.keyburner.deriveAddress(this.keyPair);
    }

    initializeAddress(seed: any) {
        this.keyPair = this.keyburner.deriveKeyPair(seed);
        this.address = this.keyburner.deriveAddress(this.keyPair);
    }

    signTokenCreateRequest(createTokenRequest: CreateTokenTransaction): SignedTransaction {
        return this.keyburner.signTransaction(createTokenRequest, this.keyPair);
    }

    signTransferRequest(createTokenRequest: TransferTransaction): SignedTransaction {
        return this.keyburner.signTransaction(createTokenRequest, this.keyPair);
    }

    getAddress(): string {
        return this.address;
    }

    signTokenUpdateRequest(updateTokenRequest: UpdateTokenTransaction): SignedTransaction {
        return this.keyburner.signTransaction(updateTokenRequest, this.keyPair);
    }

    signTokenUpdateTokenAccountRequest(updateTokenAccountTransaction: UpdateTokenAccountTransaction): SignedTransaction {
        return this.keyburner.signTransaction(updateTokenAccountTransaction, this.keyPair);
    }
}