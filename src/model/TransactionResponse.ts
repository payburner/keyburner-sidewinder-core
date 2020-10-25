import {ServiceResponse} from "./ServiceResponse";

export interface TransactionResponse {
    serviceResponse: ServiceResponse;
    transactionItems: Array<any>;
}