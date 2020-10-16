import {SignedTransaction} from "@payburner/keyburner-core/dist/npm";
import {
    CreateTokenTransaction, TransferTransaction, UpdateTokenAccountTransaction, UpdateTokenTransaction
} from "@payburner/keyburner-sidewinder-model/dist/npm";


export interface Api {
    getAddress(): string;
    newAddress();
    initializeAddress(seed: any);
    signTokenCreateRequest(createTokenRequest: CreateTokenTransaction): SignedTransaction;
    signTokenUpdateRequest(createTokenRequest: UpdateTokenTransaction): SignedTransaction;
    signTokenUpdateTokenAccountRequest(createTokenRequest: UpdateTokenAccountTransaction): SignedTransaction;
    signTransferRequest(createTokenRequest: TransferTransaction): SignedTransaction;
}