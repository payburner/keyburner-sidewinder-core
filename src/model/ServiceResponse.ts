import {TokenAccount, TokenDefinition} from "@payburner/keyburner-sidewinder-model/dist/npm";

export interface ServiceResponse {
    status: number,
    error_code?: number;
    data?: TokenDefinition|TokenAccount,
    error?: string
}