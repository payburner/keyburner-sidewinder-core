import {TransactionFactory, TransactionTypes, TokenDefinition} from "@payburner/keyburner-sidewinder-model/dist/npm";
import {TestApi} from "./TestApi";
import {CoreProcessor} from "../processing/CoreProcessor";
import {TestGlobalAddressService} from "./TestGlobalAddressService";
import {TestTokenService} from "./TestTokenService";
import {CommonErrorCodes} from "../model/CommonErrorCodes";
import assert = require("assert");
import {Api, ServiceResponse, TokenService} from "..";

test('Test Signing and Decoding', async () => {
    const api = new TestApi();
    api.newAddress();
    const factory = new TransactionFactory();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), new TestTokenService());
    const payload = factory.newCreateTokenTransaction(0, "XRP", "prod", "10", 7, true, false, false);
    const signedTransaction = api.signTokenCreateRequest(payload);
    const decodedTransaction = await coreProcessor.decodeTransaction(signedTransaction.signedTransaction);
    assert(coreProcessor.getTransactionType(decodedTransaction) === TransactionTypes.CreateToken);
    assert(decodedTransaction.verified);
});

test('Test Token Creation with Initial Amount', async () => {
    console.log('=============  TEST: Test Token Creation with Initial Amount. ==============');

    const api = new TestApi();
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    api.newAddress();
    const factory = new TransactionFactory();

    // -- this should succeed.
    const payload = factory.newCreateTokenTransaction(0, "PROD", "XRP",
        "10", 7, true, false, false);

    payload.initial_amount = "10000";
    assert(payload.environment === "PROD");

    const signedTransaction = api.signTokenCreateRequest(payload);
    let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
    assert((result.data as TokenDefinition).token_issuer_address === api.address);

    // -- this should fail because the token already exists.
    const payload2 = factory.newCreateTokenTransaction(1, "PROD", "XRP",
        "10", 7, true, false, false);
    const signedTransaction2 = api.signTokenCreateRequest(payload2);
    let result2 = await coreProcessor.processTransaction(signedTransaction2.signedTransaction);
    assert(result2.status === 400);

    const account = await tokenService.getTokenAccount("PROD", "XRP", api.address);
    assert(account.total_balance === "10000");
    assert(account.available_balance === "10000");
});

test('Test Invalid Decimal Precision', async () => {
    console.log('=============  TEST: Test Invalid Decimal Precision. ==============');
    const api = new TestApi();
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    api.newAddress();
    const factory = new TransactionFactory();

    // -- this should succeed.
    const payload = factory.newCreateTokenTransaction(0, "PROD", "XRP",
        "10", -7, true, false, false);
    payload.initial_amount = "10000";
    const signedTransaction = api.signTokenCreateRequest(payload);
    let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
    assert(result.status === 400);
    assert(result.error_code === CommonErrorCodes.TOKEN_SETUP_INVALID_DECIMAL_PRECISION.error_code);

});

test('Test Invalid Transaction Fee', async () => {
    console.log('=============  TEST: Test Invalid Transaction Free. ==============');
    const api = new TestApi();
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    api.newAddress();
    const factory = new TransactionFactory();

    {
        const payload = factory.newCreateTokenTransaction(0, "PROD", "XRP",
            "-10", 7, true, false, false);
        payload.initial_amount = "10000";
        const signedTransaction = api.signTokenCreateRequest(payload);
        let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        assert(result.status === 400);
        assert(result.error_code === CommonErrorCodes.TOKEN_SETUP_INVALID_TRANSACTION_FEE.error_code);
    }
    {
        const payload = factory.newCreateTokenTransaction(1, "PROD", "XRP",
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        const signedTransaction = api.signTokenCreateRequest(payload);
        let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        assert(result.status === 200);
    }
});

test('Test Bad Min/Max Transfer Amount', async () => {
    console.log('=============  TEST: Test Bad Min/Max Transfer Amount. ==============');
    const api = new TestApi();
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    api.newAddress();
    const factory = new TransactionFactory();

    {
        const payload = factory.newCreateTokenTransaction(0, "PROD", "XRP",
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        payload.minimum_transfer_amount = "1000";
        payload.maximum_transfer_amount = "50";
        const signedTransaction = api.signTokenCreateRequest(payload);
        let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        assert(result.status === 400);
        assert(result.error_code === CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNTER_GREATER_THAN_MAXIMUM_TRANSFER_AMOUNT.error_code);
    }

    {
        const payload = factory.newCreateTokenTransaction(1, "PROD", "XRP1",
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        payload.minimum_transfer_amount = "1000";
        payload.maximum_transfer_amount = "1000";
        const signedTransaction = api.signTokenCreateRequest(payload);
        let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        assert(result.status === 200);

    }

    {
        const payload = factory.newCreateTokenTransaction(2, "PROD", "XRP2",
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        payload.minimum_transfer_amount = "999";
        payload.maximum_transfer_amount = "1000";
        const signedTransaction = api.signTokenCreateRequest(payload);
        let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        assert(result.status === 200);

    }

    {
        const payload = factory.newCreateTokenTransaction(3, "PROD", "XRP3",
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        payload.minimum_transfer_amount = "-1000";
        const signedTransaction = api.signTokenCreateRequest(payload);
        let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        assert(result.status === 400);
        assert(result.error_code === CommonErrorCodes.TOKEN_SETUP_MINIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO.error_code);
    }
    {
        const payload = factory.newCreateTokenTransaction(4, "PROD", "XRP3",
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        payload.maximum_transfer_amount = "-50";
        const signedTransaction = api.signTokenCreateRequest(payload);
        let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        assert(result.status === 400);
        assert(result.error_code === CommonErrorCodes.TOKEN_SETUP_MAXIMUM_TRANSFER_AMOUNT_LESS_THAN_OR_EQUAL_ZERO.error_code);
    }

});

test('Test No Way to Get Funds In', async () => {
    console.log('=============  TEST: Test No Way to Get Funds In. ==============');
    const api = new TestApi();
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    api.newAddress();
    const factory = new TransactionFactory();

    // -- this should succeed.
    const payload = factory.newCreateTokenTransaction(0, "PROD", "XRP",
        "10", -7, true, false, false);
    const signedTransaction = api.signTokenCreateRequest(payload);
    let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
    assert(result.status === 400);
    assert(result.error_code === CommonErrorCodes.TOKEN_SETUP_NO_INITIAL_AMOUNT_AND_NO_UNDERLYING.error_code);

});

test('Test Token is Frozen', async () => {
    console.log('=============  TEST: Test Token is Frozen. ==============');
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    const factory = new TransactionFactory();

    const tokenOwnerApi = new TestApi();
    tokenOwnerApi.newAddress();

    const tokenReceiverApi = new TestApi();
    tokenReceiverApi.newAddress();

    const tokenThirdPartyApi = new TestApi();
    tokenThirdPartyApi.newAddress();

    // -- this should succeed.
    const payload = factory.newCreateTokenTransaction(0, "PROD", "XRP",
        "10", 7, true, false, true);
    payload.initial_amount = "10000";
    assert(payload.environment === "PROD");

    const signedTransaction = tokenOwnerApi.signTokenCreateRequest(payload);
    let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);

    assert((result.data as TokenDefinition).token_issuer_address === tokenOwnerApi.address);
    assert((result.data as TokenDefinition).frozen);

    const token_symbol = 'XRP';
    const environment = 'PROD';

    console.log('=============  SEGMENT: Transaction fails on frozen token ==============');
    try {
        await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 50, coreProcessor, tokenService, 1);
    }
    catch(error) {
        const transferResult2 = error as ServiceResponse;
        assert(transferResult2.error_code === CommonErrorCodes.TOKEN_IS_FROZEN.error_code);
    }
    console.log('=============  SEGMENT: Transaction succeeds on un-frozen token ==============');
    {
        const unfreeze = factory.newUpdateTokenTransaction(2, environment, token_symbol, "10", undefined, undefined, undefined, false );
        const signedUnfreezeTransaction = tokenOwnerApi.signTokenUpdateRequest(unfreeze);
        let unfreezeResult = await coreProcessor.processTransaction(signedUnfreezeTransaction.signedTransaction);
        assert(unfreezeResult.status === 200);
        assert(!unfreezeResult.data.frozen);
        console.log('-->');
        await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 50, coreProcessor, tokenService, 3);
        console.log('<--');
    }
    console.log('=============  SEGMENT: Freeze again ==============');

    const freeze = factory.newUpdateTokenTransaction( 4, environment, token_symbol, "10", undefined, undefined, undefined,true );
    const signedFreezeTransaction = tokenOwnerApi.signTokenUpdateRequest(freeze);
    let freezeResult = await coreProcessor.processTransaction(signedFreezeTransaction.signedTransaction);

    assert( freezeResult.status === 200);
    assert( freezeResult.data.frozen );

    console.log('=============  SEGMENT: Fail again on frozen ==============');

    try {
        await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 50, coreProcessor, tokenService, 5);
    }
    catch(error) {
        const transferResult2 = error as ServiceResponse;
        assert(transferResult2.error_code === CommonErrorCodes.TOKEN_IS_FROZEN.error_code);
    }

    console.log('=============  SEGMENT: Only issuer can freeze or unfreeze ==============');

    // -- now let's make sure that only the issuer can freeze or unfreeze.
    const badboyFreeze = factory.newUpdateTokenTransaction(0, environment, token_symbol, "10", undefined, undefined, undefined,true );
    const signedBadboyFreezeTransaction = tokenReceiverApi.signTokenUpdateRequest(badboyFreeze);
    let badboyFreezeResult = await coreProcessor.processTransaction(signedBadboyFreezeTransaction.signedTransaction);
    assert(badboyFreezeResult.status === 403);

    console.log('=============  SEGMENT: Account level freezes ==============');

    // -- now let's try freezing the third party a account.
    // -- first unfreeze the token.
    {
        const unfreeze = factory.newUpdateTokenTransaction(6, environment, token_symbol, "10", undefined, undefined, undefined,false);
        const signedUnfreezeTransaction = tokenOwnerApi.signTokenUpdateRequest(unfreeze);
        let unfreezeResult = await coreProcessor.processTransaction(signedUnfreezeTransaction.signedTransaction);
        assert(unfreezeResult.status === 200);
        assert(!unfreezeResult.data.frozen);
        await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 50, coreProcessor, tokenService, 7);
    }
    console.log('=============  SEGMENT: Freeze token account ==============');

    {
        const freeze = factory.newUpdateTokenAccountFreezeStatusTransaction(8, environment, token_symbol, tokenReceiverApi.address, true);
        const freezeTransaction = tokenOwnerApi.signTokenUpdateRequest(freeze);
        let freezeResult = await coreProcessor.processTransaction(freezeTransaction.signedTransaction);
        assert( freezeResult.status === 200);
        assert(freezeResult.data.frozen);
        try {
            await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 50, coreProcessor, tokenService, 9);
        }
        catch(error) {
            const transferResult2 = error as ServiceResponse;
            assert(transferResult2.error_code === CommonErrorCodes.TOKEN_ACCOUNT_RECEIVER_ACCOUNT_IS_FROZEN.error_code);
        }
    }
    console.log('=============  SEGMENT: Unfreeze token account ==============');

    {
        const freeze = factory.newUpdateTokenAccountFreezeStatusTransaction(10, environment, token_symbol, tokenReceiverApi.address, false);
        const freezeTransaction = tokenOwnerApi.signTokenUpdateRequest(freeze);
        let freezeResult = await coreProcessor.processTransaction(freezeTransaction.signedTransaction);
        assert( freezeResult.status === 200);
        assert(!freezeResult.data.frozen);
        await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 50, coreProcessor, tokenService, 11);

    }
});

test('Test Token is permissioned', async () => {
    console.log('=============  TEST: Test Token is permissioned. ==============');
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    const factory = new TransactionFactory();

    const tokenOwnerApi = new TestApi();
    tokenOwnerApi.newAddress();

    const tokenReceiverApi = new TestApi();
    tokenReceiverApi.newAddress();

    const thirdPartyAPi = new TestApi();
    thirdPartyAPi.newAddress();

    // -- this should succeed.
    const payload = factory.newCreateTokenTransaction(0, "PROD", "XRP", "10", 7, true, true, false);
    payload.initial_amount = "10000";
    assert(payload.environment === "PROD");

    const signedTransaction = tokenOwnerApi.signTokenCreateRequest(payload);
    let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);

    assert((result.data as TokenDefinition).token_issuer_address === tokenOwnerApi.address);
    assert((result.data as TokenDefinition).is_permissioned);

    const token_symbol = 'XRP';
    const environment = 'PROD';

    await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 100, coreProcessor, tokenService, 1);
    await doTransfer(tokenReceiverApi, tokenOwnerApi, environment, token_symbol, 50, coreProcessor, tokenService, 0);
    // -- we expect this one to fail.

    try {
        await doTransfer(tokenReceiverApi, thirdPartyAPi, environment, token_symbol, 50, coreProcessor, tokenService, 1);
        assert(false);
    }
    catch(error) {
        const transferResult2 = error as ServiceResponse;
        assert(transferResult2.error_code === CommonErrorCodes.TOKEN_ACCOUNT_RECEIVER_ACCOUNT_NO_ACCESS_TO_TOKEN.error_code);
    }
});

test('Test transfers and insufficient balance', async () => {
    console.log('=============  TEST: Test transfers and insufficient balance. ==============');
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    const factory = new TransactionFactory();

    const tokenOwnerApi = new TestApi();
    tokenOwnerApi.newAddress();

    const tokenReceiverApi = new TestApi();
    tokenReceiverApi.newAddress();

    const thirdPartyAPi = new TestApi();
    thirdPartyAPi.newAddress();

    const token_symbol = 'XRP';
    const environment = 'PROD';

    {
        // -- this should succeed.
        const payload = factory.newCreateTokenTransaction(0, environment, token_symbol,
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        const signedTransaction = tokenOwnerApi.signTokenCreateRequest(payload);
        await coreProcessor.processTransaction(signedTransaction.signedTransaction);
    }

    await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 200, coreProcessor, tokenService, 1);
    await doTransfer(tokenReceiverApi, thirdPartyAPi, environment, token_symbol, 50, coreProcessor, tokenService, 0);
    await doTransfer(tokenReceiverApi, thirdPartyAPi, environment, token_symbol, 50, coreProcessor, tokenService, 1);
    await doTransfer(tokenReceiverApi, thirdPartyAPi, environment, token_symbol, 50, coreProcessor, tokenService, 2);

    // -- we expect this one to fail.
    try {
        await doTransfer(tokenReceiverApi, thirdPartyAPi, environment, token_symbol, 50, coreProcessor, tokenService, 3);
    }
    catch(error) {
        const transferResult2 = error as ServiceResponse;
        assert(transferResult2.error_code === CommonErrorCodes.INSUFFICIENT_BALANCE.error_code);
    }
    // this one will succeed
    await doTransfer(tokenReceiverApi, thirdPartyAPi, environment, token_symbol, 10, coreProcessor, tokenService, 4);

});

test('Test allow transfers between accounts', async () => {
    console.log('=============  TEST: Test allow transfers between accounts. ==============');
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    const factory = new TransactionFactory();

    const tokenOwnerApi = new TestApi();
    tokenOwnerApi.newAddress();

    const tokenReceiverApi = new TestApi();
    tokenReceiverApi.newAddress();

    const thirdPartyAPi = new TestApi();
    thirdPartyAPi.newAddress();

    const token_symbol = 'XRP';
    const environment = 'PROD';

    {
        // -- this should succeed.
        const payload = factory.newCreateTokenTransaction(0, environment, token_symbol,
            "10", 7, false, false, false);
        payload.initial_amount = "10000";
        const signedTransaction = tokenOwnerApi.signTokenCreateRequest(payload);
        await coreProcessor.processTransaction(signedTransaction.signedTransaction);
    }

    await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 200, coreProcessor, tokenService, 1);

    // -- we expect this one to fail.
    try {
        await doTransfer(tokenReceiverApi, thirdPartyAPi, environment, token_symbol, 50, coreProcessor, tokenService, 0);
    }
    catch(error) {
        const transferResult2 = error as ServiceResponse;
        assert(transferResult2.error_code === CommonErrorCodes.TOKEN_NO_INTER_ACCOUNT_TRANSFERS.error_code);
    }
    // this one will succeed
    await doTransfer(tokenReceiverApi, tokenOwnerApi, environment, token_symbol, 10, coreProcessor, tokenService, 1);

});

test('Test sender account does not exist', async () => {
    console.log('=============  TEST: Test sender account does not exist. ==============');
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    const factory = new TransactionFactory();

    const tokenOwnerApi = new TestApi();
    tokenOwnerApi.newAddress();

    const tokenReceiverApi = new TestApi();
    tokenReceiverApi.newAddress();

    const token_symbol = 'XRP';
    const environment = 'PROD';
    console.log('============= SEGMENT: Create token ==============');
    {
        // -- this should succeed.
        const payload = factory.newCreateTokenTransaction(0, environment, token_symbol,
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        payload.maximum_balance = "200";
        const signedTransaction = tokenOwnerApi.signTokenCreateRequest(payload);
        await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        const token = await tokenService.getToken(environment, token_symbol);
        assert(token.maximum_balance === "200");
    }

    console.log('============= SEGMENT: Expect failure sender account does not exist. ==============');
    // -- we expect this one to fail.
    try {
        await doTransfer(tokenReceiverApi, tokenOwnerApi, environment, token_symbol, 300, coreProcessor, tokenService, 0);
    }
    catch(error) {
        const castError = error as ServiceResponse;
        assert(castError.error_code === CommonErrorCodes.TOKEN_ACCOUNT_SENDER_ACCOUNT_DOES_NOT_EXIST.error_code);
    }

});

test('Test transfers and maximum balance', async () => {
    console.log('=============  TEST: Test transfers and maximum balance ==============');
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    const factory = new TransactionFactory();

    const tokenOwnerApi = new TestApi();
    tokenOwnerApi.newAddress();

    const tokenReceiverApi = new TestApi();
    tokenReceiverApi.newAddress();

    const token_symbol = 'XRP';
    const environment = 'PROD';
    console.log('============= SEGMENT: Create token ==============');
    {
        // -- this should succeed.
        const payload = factory.newCreateTokenTransaction(0, environment, token_symbol,
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        payload.maximum_balance = "200";
        const signedTransaction = tokenOwnerApi.signTokenCreateRequest(payload);
        await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        const token = await tokenService.getToken(environment, token_symbol);
        assert(token.maximum_balance === "200");
    }

    console.log('============= SEGMENT: Expect failure for max balance when no receiver account exists. ==============');
    // -- we expect this one to fail.
    try {
        await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 300, coreProcessor, tokenService, 1);
    }
    catch(error) {
        const transferResult2 = error as ServiceResponse;
        assert(transferResult2.error_code === CommonErrorCodes.TOKEN_DESTINATION_ACCOUNT_EXCEED_MAXIMUM_BALANCE_NO_ACCOUNT.error_code);
    }
    
    console.log('============= SEGMENT: Do Ok Transfer ==============');
    await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 150, coreProcessor, tokenService, 2);

    console.log('============= SEGMENT: Expect failure for max balance when receiver account does exist. ==============');
    // -- we expect this one to fail.
    try {
        await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 100, coreProcessor, tokenService, 3);
    }
    catch(error) {
        const transferResult2 = error as ServiceResponse;
        assert(transferResult2.error_code === CommonErrorCodes.TOKEN_DESTINATION_ACCOUNT_EXCEED_MAXIMUM_BALANCE.error_code);
    }
    console.log('============= SEGMENT: Expect ok within balance ==============');
    // this one will succeed
    await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 10, coreProcessor, tokenService, 4);

});

test('Test minimum transfer amount', async () => {
    console.log('=============  TEST: Test transfers and maximum balance ==============');
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    const factory = new TransactionFactory();

    const tokenOwnerApi = new TestApi();
    tokenOwnerApi.newAddress();

    const tokenReceiverApi = new TestApi();
    tokenReceiverApi.newAddress();

    const token_symbol = 'XRP';
    const environment = 'PROD';
    console.log('============= SEGMENT: Create token ==============');
    {
        // -- this should succeed.
        const payload = factory.newCreateTokenTransaction(0, environment, token_symbol,
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        payload.minimum_transfer_amount = "50";
        const signedTransaction = tokenOwnerApi.signTokenCreateRequest(payload);
        await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        const token = await tokenService.getToken(environment, token_symbol);
        assert(token.minimum_transfer_amount === "50");
    }

    console.log('============= SEGMENT: Expect failure for max balance when no receiver account exists. ==============');
    // -- we expect this one to fail.
    try {
        await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 40, coreProcessor, tokenService, 1);
        assert(false);
    }
    catch(error) {
        const transferResult2 = error as ServiceResponse;
        assert(transferResult2.error_code === CommonErrorCodes.TOKEN_TRANSFER_AMOUNT_LESS_THAN_MINIMUM_TRANSFER.error_code);
    }

    await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 50, coreProcessor, tokenService, 2);
    await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 60, coreProcessor, tokenService, 3);



});

test('Test Token Account Not found on update', async () => {
    console.log('=============  TEST: Test Token Account Not found on update ==============');

    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    const factory = new TransactionFactory();

    const tokenOwnerApi = new TestApi();
    tokenOwnerApi.newAddress();

    const tokenReceiverApi = new TestApi();
    tokenReceiverApi.newAddress();

    // -- this should succeed.
    const payload = factory.newCreateTokenTransaction(0, "PROD", "XRP",
        "10", 7, true, false, false);
    payload.initial_amount = "10000";
    assert(payload.environment === "PROD");

    const signedTransaction = tokenOwnerApi.signTokenCreateRequest(payload);
    let result = await coreProcessor.processTransaction(signedTransaction.signedTransaction);
    assert((result.data as TokenDefinition).token_issuer_address === tokenOwnerApi.address);

    const token_symbol = 'XRP';
    const environment = 'PROD';

    {
        const freeze = factory.newUpdateTokenAccountFreezeStatusTransaction(1, environment, token_symbol, tokenReceiverApi.address, false);
        const freezeTransaction = tokenOwnerApi.signTokenUpdateRequest(freeze);
        let freezeResult = await coreProcessor.processTransaction(freezeTransaction.signedTransaction);
        console.log('FREEZE RESULT:' + JSON.stringify(freezeResult, null, 2));
        assert( freezeResult.status === 404);

    }
});


test('Test maximum transfer amount', async () => {
    console.log('=============  TEST: Test transfers and maximum balance ==============');
    const tokenService = new TestTokenService();
    const coreProcessor = new CoreProcessor(new TestGlobalAddressService(), tokenService);
    const factory = new TransactionFactory();

    const tokenOwnerApi = new TestApi();
    tokenOwnerApi.newAddress();

    const tokenReceiverApi = new TestApi();
    tokenReceiverApi.newAddress();

    const token_symbol = 'XRP';
    const environment = 'PROD';
    console.log('============= SEGMENT: Create token ==============');
    {
        // -- this should succeed.
        const payload = factory.newCreateTokenTransaction(0, environment, token_symbol,
            "10", 7, true, false, false);
        payload.initial_amount = "10000";
        payload.maximum_transfer_amount = "50";
        const signedTransaction = tokenOwnerApi.signTokenCreateRequest(payload);
        await coreProcessor.processTransaction(signedTransaction.signedTransaction);
        const token = await tokenService.getToken(environment, token_symbol);
        assert(token.maximum_transfer_amount === "50");
    }

    console.log('============= SEGMENT: Expect failure for max balance when no receiver account exists. ==============');
    // -- we expect this one to fail.
    try {
        await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 60, coreProcessor, tokenService, 1);
        assert(false);
    }
    catch(error) {
        const transferResult2 = error as ServiceResponse;
        assert(transferResult2.error_code === CommonErrorCodes.TOKEN_TRANSFER_AMOUNT_GREATER_THAN_MAXIMUM_TRANSFER.error_code);
    }

    await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 50, coreProcessor, tokenService, 2);
    await doTransfer(tokenOwnerApi, tokenReceiverApi, environment, token_symbol, 1, coreProcessor, tokenService, 3);
});

const doTransfer = async function( senderApi: Api, receiverApi: Api, environment: string, token_symbol: string, amount: number, coreProcessor: CoreProcessor, tokenService: TokenService, sequence: number) {
    const factory = new TransactionFactory();
    let receiversAccountPre = null;
    let preReceiverBalance = "0";
    try {
        receiversAccountPre = await tokenService.getTokenAccount(environment, token_symbol, receiverApi.getAddress());
        preReceiverBalance = receiversAccountPre.available_balance;
    }
    catch(error) {
        // ignore.
    }
    let sendersAccountPre = null
    let sendersBalancePre = "0"
    try {
         sendersAccountPre = await tokenService.getTokenAccount( environment, token_symbol, senderApi.getAddress());
         sendersBalancePre = sendersAccountPre.available_balance;
         console.log('SENDER PRE:' + JSON.stringify(sendersAccountPre, null, 2));
    }
    catch(error) {

    }
    const transferTransaction = factory.newTransferTransaction(sequence, environment, token_symbol, senderApi.getAddress(), receiverApi.getAddress(), amount.toFixed(0));
    const signedTransfer = senderApi.signTransferRequest(transferTransaction);
    let transferResult = await coreProcessor.processTransaction(signedTransfer.signedTransaction);
    console.log('TRANSFER RESULT:' + JSON.stringify(transferResult, null, 2));
    if (transferResult.status !== 200) {
        throw transferResult;
    }
    let receiversAccount = await tokenService.getTokenAccount(environment, token_symbol, receiverApi.getAddress());
    assert(receiversAccount.account_owner_address === receiverApi.getAddress());
    if (receiversAccountPre !== null) {
        assert(parseInt(receiversAccount.available_balance) === parseInt(preReceiverBalance)+amount);
    }
    else {
        assert(parseInt(receiversAccount.available_balance) === amount);
    }

    let sendersAccount = await tokenService.getTokenAccount( environment, token_symbol, senderApi.getAddress());
    console.log('SENDER POST:' + JSON.stringify(sendersAccount, null, 2));
    assert(parseInt(sendersAccount.available_balance) === (parseInt(sendersBalancePre) - amount) - 10);

}
