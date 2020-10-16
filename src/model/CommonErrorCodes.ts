import {ServiceResponse} from "./ServiceResponse";

export class CommonErrorCodes {

    // --- System errors
    static readonly SYSTEM_PROBLEM_CREATING_RECEIVER_ACCOUNT = {
        status: 500, error_code: 10, error: 'Problem creating receiver account.'
    } as ServiceResponse;
    static readonly SYSTEM_PROBLEM_SETTING_SENDER_BALANCE = {
        status: 500, error_code: 20, error: 'Problem Setting the sender balance.'
    } as ServiceResponse;
    static readonly SYSTEM_PROBLEM_SETTING_RECEIVER_BALANCE = {
        status: 500, error_code: 30, error: 'Problem Setting the receiver balance.'
    } as ServiceResponse;

    // -- token update errors.
    static readonly SYSTEM_PROBLEM_UPDATING_TOKEN = {
        status: 500, error_code: 500, error: 'Problem updating the token..'
    } as ServiceResponse;
    static readonly TOKEN_UPDATE_NOT_AUTHORIZED = {
        status: 403, error_code: 510, error: 'The signing address does not have rights to update the token.'
    } as ServiceResponse;
    static readonly TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNTER_GREATER_THAN_MAXIMUM_TRANSFER_AMOUNT = {
        status: 400, error_code: 520, error: 'The minimum transfer amount cannot be greater than the maximum transfer amount.'
    } as ServiceResponse;
    static readonly TOKEN_SETUP_NO_INITIAL_AMOUNT_AND_NO_UNDERLYING = {
        status: 400, error_code: 530, error: 'There is no way to get tokens created.  No initial amount and no underlying account specified.'
    } as ServiceResponse;
    static readonly TOKEN_SETUP_INVALID_DECIMAL_PRECISION = {
        status: 400, error_code: 540, error: 'The decimal precision must be a positive integer, no greater than 10'
    } as ServiceResponse;
    static readonly TOKEN_ALREADY_EXISTS = {
        status: 400, error_code: 550, error: 'A token with that symbol already exists.'
    } as ServiceResponse;
    static readonly TOKEN_SETUP_INVALID_TRANSACTION_FEE = {
        status: 400, error_code: 560, error: 'The transaction fee must be greater than zero.'
    } as ServiceResponse;
    static readonly TOKEN_ACCOUNT_CAN_NOT_FREEZE_ISSUER = {
        status: 403, error_code: 570, error: 'You can not freeze the issuer account.'
    } as ServiceResponse;
    static readonly TOKEN_ACCOUNT_ONLY_ISSUER_CAN_FREEZE = {
        status: 403, error_code: 580, error: 'Only the issuer can freeze an account.'
    } as ServiceResponse;
    static readonly TOKEN_ACCOUNT_NOT_FOUND = {
        status: 404, error_code: 590, error: 'The token account was not found.'
    } as ServiceResponse;
    static readonly TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO = {
        status: 400, error_code: 600, error: 'The minimum transfer amount cannot be less than or equal to zero'
    } as ServiceResponse;

    static readonly TOKEN_SETUP_MAXIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO = {
        status: 400, error_code: 610, error: 'The maximum transfer amount cannot be less than or equal to zero'
    } as ServiceResponse;
    static readonly TOKEN_SETUP_MAXIMUM_BALANCE_CAN_ONLY_INCREASE = {
        status: 400, error_code: 620, error: 'The maximum balance can only increase.'
    } as ServiceResponse;
    static readonly TOKEN_SETUP_INITIAL_AMOUNT_AND_UNDERLYING = {
        status: 400, error_code: 630, error: 'Ambiguous. Both initial amount and underlying account specified.'
    } as ServiceResponse;
    static readonly TOKEN_SETUP_INITIAL_LESS_THAN_OR_EQUAL_TO_ZERO = {
        status: 400, error_code: 640, error: 'The initial amount is less than or equals to zero.'
    } as ServiceResponse;

    // -- token update errors.
    static readonly SYSTEM_PROBLEM_UPDATING_TOKEN_ACCOUNT = {
        status: 500, error_code: 700, error: 'Problem updating the token account...'
    } as ServiceResponse;

    // --- Low level user protocol errors.
    static readonly UNKNOWN_TRANSACTION_TYPE = {
        status: 400, error_code: 100, error: 'The transfer would result in the sender account having a negative balance.'
    } as ServiceResponse;

    static readonly INVALID_SEQUENCE = {
        status: 400, error_code: 110, error: 'The sequence you provided is invalid.'
    } as ServiceResponse;

    static readonly TRANSACTION_INVALID = {
        status: 400, error_code: 120, error: 'The transaction is invalid.'
    } as ServiceResponse;

    static readonly TOKEN_ACCOUNT_SENDER_ACCOUNT_DOES_NOT_EXIST = {
        status: 404, error_code: 130, error: 'The sender account does not exist.'
    } as ServiceResponse;


    // -- Errors arising from violations of to token configuration
    static readonly INSUFFICIENT_BALANCE = {
        status: 400, error_code: 1000, error: 'The transfer would result in the sender account having a negative balance.'
    } as ServiceResponse;
    static readonly TOKEN_NOT_FOUND = {
        status: 404, error_code: 1010, error: 'A token with the symbol provided does not exist in the environment.'
    } as ServiceResponse;
    static readonly TOKEN_IS_FROZEN = {
        status: 403, error_code: 1020, error: 'The token is frozen.  No transactions my take place.'
    } as ServiceResponse;
    static readonly TOKEN_NO_INTER_ACCOUNT_TRANSFERS = {
        status: 403, error_code: 1030, error: 'The token is forbids inter-account transfer, and this transfer does not include the issuer.'
    } as ServiceResponse;
    static readonly TOKEN_TRANSFER_AMOUNT_LESS_THAN_MINIMUM_TRANSFER = {
        status: 400, error_code: 1040, error: 'The transfer_amount is less than the minimum transfer amount on the token.'
    } as ServiceResponse;
    static readonly TOKEN_TRANSFER_AMOUNT_GREATER_THAN_MAXIMUM_TRANSFER = {
        status: 400, error_code: 1050, error: 'The transfer_amount is greater than the maximum transfer amount on the token.'
    } as ServiceResponse;
    static readonly TOKEN_DESTINATION_ACCOUNT_EXCEED_MAXIMUM_BALANCE = {
        status: 403, error_code: 1060, error: 'The transfer would result in the destination account exceeding the maximum balance of the token.'
    } as ServiceResponse;
    static readonly TOKEN_DESTINATION_ACCOUNT_EXCEED_MAXIMUM_BALANCE_NO_ACCOUNT = {
        status: 403, error_code: 1070, error: 'The transfer would result in the destination account exceeding the maximum balance of the token.'
    } as ServiceResponse;
    static readonly TOKEN_ACCOUNT_RECEIVER_ACCOUNT_NO_ACCESS_TO_TOKEN = {
        status: 403, error_code: 1080, error: 'The receiver account is does not have access to this token.'
    } as ServiceResponse;


        // -- Errors arising from violations of token account configuration.
    static readonly TOKEN_ACCOUNT_SENDER_ACCOUNT_IS_FROZEN = {
        status: 403, error_code: 2000, error: 'The sender account is frozen.'
    } as ServiceResponse;
    static readonly TOKEN_ACCOUNT_RECEIVER_ACCOUNT_IS_FROZEN = {
        status: 403, error_code: 2010, error: 'The receiver account is frozen.'
    } as ServiceResponse;







}