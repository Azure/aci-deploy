import { HttpOperationResponse, OperationArguments, OperationSpec, RequestOptionsBase, RequestPrepareOptions, ServiceClient, ServiceClientCredentials, ServiceClientOptions, WebResource } from "@azure/ms-rest-js";
import { LROPoller } from "./lroPoller";
import { LROPollState } from "./lroPollStrategy";
/**
 * Options to be provided while creating the client.
 */
export interface AzureServiceClientOptions extends ServiceClientOptions {
    /**
     * @property {string} [options.acceptLanguage] - Gets or sets the preferred language for the response. Default value is: "en-US".
     */
    acceptLanguage?: string;
    /**
     * @property {number} [options.longRunningOperationRetryTimeout] - Gets or sets the retry timeout in seconds for
     * Long Running Operations. Default value is 30.
     */
    longRunningOperationRetryTimeout?: number;
}
/**
 * @class
 * Initializes a new instance of the AzureServiceClient class.
 * @constructor
 *
 * @param {msRest.ServiceClientCredentilas} credentials - ApplicationTokenCredentials or
 * UserTokenCredentials object used for authentication.
 * @param {AzureServiceClientOptions} options - The parameter options used by AzureServiceClient
 */
export declare class AzureServiceClient extends ServiceClient {
    acceptLanguage: string;
    /**
     * The retry timeout in seconds for Long Running Operations. Default value is 30.
     */
    longRunningOperationRetryTimeout?: number;
    constructor(credentials: ServiceClientCredentials, options?: AzureServiceClientOptions);
    /**
     * Send the initial request of a LRO (long running operation) and get back an
     * LROPoller that provides methods for polling the LRO and checking if the LRO is finished.
     * @param operationArguments The arguments to the operation.
     * @param operationSpec The specification for the operation.
     * @param options Additional options to be sent while making the request.
     * @returns The LROPoller object that provides methods for interacting with the LRO.
     */
    sendLRORequest(operationArguments: OperationArguments, operationSpec: OperationSpec, options?: RequestOptionsBase): Promise<LROPoller>;
    /**
     * Provides a mechanism to make a request that will poll and provide the final result.
     * @param {msRest.RequestPrepareOptions|msRest.WebResource} request - The request object
     * @param {AzureRequestOptionsBase} [options] Additional options to be sent while making the request
     * @returns {Promise<msRest.HttpOperationResponse>} The HttpOperationResponse containing the final polling request, response and the responseBody.
     */
    sendLongRunningRequest(request: RequestPrepareOptions | WebResource, options?: RequestOptionsBase): Promise<HttpOperationResponse>;
    /**
     * Send the initial request of a LRO (long running operation) and get back an
     * HttpLongRunningOperationResponse that provides methods for polling the LRO and checking if the
     * LRO is finished.
     * @param {msRest.RequestPrepareOptions|msRest.WebResource} request - The request object
     * @param {AzureRequestOptionsBase} [options] Additional options to be sent while making the request
     * @returns {Promise<LROPoller>} The HttpLongRunningOperationResponse
     * that provides methods for interacting with the LRO.
     */
    beginLongRunningRequest(request: RequestPrepareOptions | WebResource, options?: RequestOptionsBase): Promise<LROPoller>;
    /**
     * Restore an LROPoller from the provided LROPollState. This method can be used to recreate an
     * LROPoller on a different process or machine.
     */
    restoreLROPoller(lroPollState: LROPollState): LROPoller;
}
export declare function getDefaultUserAgentValue(): string;
export declare function updateOptionsWithDefaultValues(options?: AzureServiceClientOptions): AzureServiceClientOptions;
//# sourceMappingURL=azureServiceClient.d.ts.map