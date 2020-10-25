import {TransactionProcessor} from "./TransactionProcessor";
import {DecodedTransaction} from "@payburner/keyburner-core/dist/npm";
import {GlobalAddressService, ServiceResponse, TokenService} from "..";
import {
    AccountUtils,
    CreateTokenTransaction,
    TokenAccount,
    TokenDefinition,
    TransactionTypes
} from "@payburner/keyburner-sidewinder-model/dist/npm";
import {TransactionProcessorBase} from "./TransactionProcessorBase";
import {CommonErrorCodes} from "../model/CommonErrorCodes";

export class CreateTokenTransactionProcessor extends TransactionProcessorBase implements TransactionProcessor {

    constructor(globalAccountService: GlobalAddressService, tokenService: TokenService) {
        super(globalAccountService, tokenService);
    }

    doProcess(decodedTransaction: DecodedTransaction, items: Array<any>): Promise<ServiceResponse> {
        const self = this;

        return new Promise((resolve, reject) => {
            console.log('Processing create token: ' + decodedTransaction.id);

            if (typeof decodedTransaction.payload.initial_amount !== 'undefined' &&
                typeof decodedTransaction.payload.initial_amount !== 'number') {
                resolve(CommonErrorCodes.TOKEN_SETUP_MALFORMED_INITIAL_AMOUNT);
                return;
            }


            const createTokenTransaction = decodedTransaction.payload as CreateTokenTransaction;
            self.getTokenService().getToken(createTokenTransaction.environment, createTokenTransaction.token_symbol)
            .then((token) => {
                resolve(CommonErrorCodes.TOKEN_ALREADY_EXISTS);
            }).catch((error) => {

                if (typeof createTokenTransaction.maximum_transfer_amount !== 'undefined' &&
                    typeof createTokenTransaction.minimum_transfer_amount !== 'undefined' &&
                    (createTokenTransaction.minimum_transfer_amount) > (createTokenTransaction.maximum_transfer_amount)) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNTER_GREATER_THAN_MAXIMUM_TRANSFER_AMOUNT);
                    return;
                }

                if (typeof createTokenTransaction.minimum_transfer_amount !== 'undefined' && (createTokenTransaction.minimum_transfer_amount) <= 0) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO);
                    return;
                }

                if (typeof createTokenTransaction.maximum_transfer_amount !== 'undefined' && (createTokenTransaction.maximum_transfer_amount) <= 0) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_MAXIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO);
                    return;
                }

                if (typeof createTokenTransaction.initial_amount === 'undefined' && typeof createTokenTransaction.underlying_account_id === 'undefined') {
                    resolve(CommonErrorCodes.TOKEN_SETUP_NO_INITIAL_AMOUNT_AND_NO_UNDERLYING);
                    return;
                }

                if (typeof createTokenTransaction.initial_amount !== 'undefined' && typeof createTokenTransaction.underlying_account_id !== 'undefined') {
                    resolve(CommonErrorCodes.TOKEN_SETUP_INITIAL_AMOUNT_AND_UNDERLYING);
                    return;
                }
                if (typeof createTokenTransaction.initial_amount !== 'undefined' && (createTokenTransaction.initial_amount) <= 0) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_INITIAL_LESS_THAN_OR_EQUAL_TO_ZERO);
                    return;
                }

                if (createTokenTransaction.decimal_precision < 0 || createTokenTransaction.decimal_precision > 10) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_INVALID_DECIMAL_PRECISION);
                    return;
                }

                if ((createTokenTransaction.transaction_fee) < 0) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_INVALID_TRANSACTION_FEE);
                    return;
                }

                console.log('The token ' + createTokenTransaction.token_symbol + ' does not exist. Creating.');
                // -- we can create
                const token = {
                    token_uri: AccountUtils.calculateTokenId(createTokenTransaction.environment,
                        createTokenTransaction.token_symbol),
                    token_symbol: createTokenTransaction.token_symbol,
                    environment: createTokenTransaction.environment,
                    token_issuer_address: decodedTransaction.address,
                    initial_amount: this.formatInt(createTokenTransaction.initial_amount),
                    transaction_fee: this.formatInt(createTokenTransaction.transaction_fee),
                    allow_transfers_between_accounts: createTokenTransaction.allow_transfers_between_accounts,
                    is_permissioned: createTokenTransaction.is_permissioned,
                    maximum_balance: this.formatInt(createTokenTransaction.maximum_balance),
                    minimum_transfer_amount: this.formatInt(createTokenTransaction.minimum_transfer_amount),
                    maximum_transfer_amount: this.formatInt(createTokenTransaction.maximum_transfer_amount),
                    frozen: createTokenTransaction.frozen,
                    decimal_precision: this.formatInt(createTokenTransaction.decimal_precision),
                    underlying_currency: createTokenTransaction.underlying_currency,
                    underlying_account_id: createTokenTransaction.underlying_account_id,
                    underlying_currency_ratio: createTokenTransaction.underlying_currency_ratio
                } as TokenDefinition;

                items.push({
                    Put: {
                        TableName: 'sidewinder_token',
                        Item: token,
                        ConditionExpression: "attribute_not_exists(token_uri)"
                    }
                });


                let ownerAccount = {
                    token_account_id: AccountUtils.calculateTokenAccountId(token.environment,
                        token.token_symbol, decodedTransaction.address),
                    token_symbol: token.token_symbol,
                    account_owner_address: decodedTransaction.address,
                    environment: token.environment,
                    sequence: 0,
                    available_balance: createTokenTransaction.initial_amount,
                    total_balance: createTokenTransaction.initial_amount,
                    locked_balance: 0,
                    frozen: false
                } as TokenAccount;
                items.push({
                    Put: {
                        TableName: 'sidewinder_token_account',
                        Item: ownerAccount,
                        ConditionExpression: "attribute_not_exists(token_account_id)"
                    }
                });
                resolve({status:200})
            }).catch((error) => {
                resolve({status: 500, error});
            });

        });
    }

    formatInt(input: number): number {
        return typeof input !== 'undefined' ? parseInt((input).toFixed(0)) : undefined
    }

    getTransactionType(): TransactionTypes {
        return TransactionTypes.CreateToken;
    }

}