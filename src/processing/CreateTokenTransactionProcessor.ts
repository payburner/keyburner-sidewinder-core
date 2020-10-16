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

    doProcess(decodedTransaction: DecodedTransaction): Promise<ServiceResponse> {
        const self = this;

        return new Promise((resolve, reject) => {
            console.log('Processing create token: ' + decodedTransaction.id);
            const createTokenTransaction = decodedTransaction.payload as CreateTokenTransaction;
            self.getTokenService().getToken(createTokenTransaction.environment, createTokenTransaction.token_symbol)
            .then((token) => {
                resolve(CommonErrorCodes.TOKEN_ALREADY_EXISTS);
            }).catch((error) => {

                if (typeof createTokenTransaction.maximum_transfer_amount !== 'undefined' &&
                    typeof createTokenTransaction.minimum_transfer_amount !== 'undefined' &&
                    parseInt(createTokenTransaction.minimum_transfer_amount) > parseInt(createTokenTransaction.maximum_transfer_amount)) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNTER_GREATER_THAN_MAXIMUM_TRANSFER_AMOUNT);
                    return;
                }

                if (typeof createTokenTransaction.minimum_transfer_amount !== 'undefined' && parseInt(createTokenTransaction.minimum_transfer_amount) <= 0) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO);
                    return;
                }

                if (typeof createTokenTransaction.maximum_transfer_amount !== 'undefined' && parseInt(createTokenTransaction.maximum_transfer_amount) <= 0) {
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
                if (typeof createTokenTransaction.initial_amount !== 'undefined' && parseInt(createTokenTransaction.initial_amount) <= 0) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_INITIAL_LESS_THAN_OR_EQUAL_TO_ZERO);
                    return;
                }

                if (createTokenTransaction.decimal_precision < 0 || createTokenTransaction.decimal_precision > 10) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_INVALID_DECIMAL_PRECISION);
                    return;
                }

                if (parseInt(createTokenTransaction.transaction_fee) < 0) {
                    resolve(CommonErrorCodes.TOKEN_SETUP_INVALID_TRANSACTION_FEE);
                    return;
                }

                console.log('The token ' + createTokenTransaction.token_symbol + ' does not exist. Creating.');
                // -- we can create
                const token = {
                    token_symbol: createTokenTransaction.token_symbol,
                    environment: createTokenTransaction.environment,
                    token_issuer_address: decodedTransaction.address,
                    initial_amount: parseInt(createTokenTransaction.initial_amount).toFixed(0),
                    transaction_fee: parseInt(createTokenTransaction.transaction_fee).toFixed(0),
                    allow_transfers_between_accounts: createTokenTransaction.allow_transfers_between_accounts,
                    is_permissioned: createTokenTransaction.is_permissioned,
                    maximum_balance: parseInt(createTokenTransaction.maximum_balance).toFixed(0),
                    minimum_transfer_amount: parseInt(createTokenTransaction.minimum_transfer_amount).toFixed(0),
                    maximum_transfer_amount: parseInt(createTokenTransaction.maximum_transfer_amount).toFixed(0),
                    frozen: createTokenTransaction.frozen,
                    decimal_precision: parseInt(createTokenTransaction.decimal_precision.toFixed(0)),
                    underlying_currency: createTokenTransaction.underlying_currency,
                    underlying_account_id: createTokenTransaction.underlying_account_id,
                    underlying_currency_ratio: createTokenTransaction.underlying_currency_ratio
                } as TokenDefinition;

                self.getTokenService().createToken(token).then(async (createResponse) => {

                    let ownerAccount = {
                        token_account_id: AccountUtils.calculateTokenAccountId(token.environment,
                            token.token_symbol, decodedTransaction.address),
                        token_symbol: token.token_symbol,
                        account_owner_address: decodedTransaction.address,
                        environment: token.environment,
                        sequence: 0,
                        available_balance: createTokenTransaction.initial_amount,
                        total_balance: createTokenTransaction.initial_amount,
                        locked_balance: "0",
                        frozen: false
                    } as TokenAccount;
                    try {
                        await this.getTokenService().createTokenAccount(ownerAccount);
                        resolve({status: 200, data: createResponse})
                    } catch (error) {
                        resolve({status: 500, error: 'Problem creating receiver account.'});
                        return;
                    }


                }).catch((error) => {
                    resolve({status: 500, error});
                });
            })
        });
    }

    getTransactionType(): TransactionTypes {
        return TransactionTypes.CreateToken;
    }

}