import { HttpOperationResponse, RequestOptionsBase, RestResponse } from "@azure/ms-rest-js";
import { AzureServiceClient } from "./azureServiceClient";
import { LROPollState, LROPollStrategy } from "./lroPollStrategy";
import { LongRunningOperationStates } from "./util/constants";
/**
 * An HTTP operation response that provides special methods for interacting with LROs (long running
 * operations).
 */
export declare class LROPoller {
    private readonly _lroPollStrategy;
    private readonly _initialResponse;
    /**
     * Create a new HttpLongRunningOperationResponse.
     * @param _lroPollStrategy The LROPollStrategy that this HttpLongRunningOperationResponse will
     * use to interact with the LRO.
     */
    constructor(_lroPollStrategy: LROPollStrategy | undefined, _initialResponse: HttpOperationResponse);
    /**
     * Get the first response that the service sent back when the LRO was initiated.
     */
    getInitialResponse(): HttpOperationResponse;
    /**
     * Get the most recent response that the service sent back during this LRO.
     */
    getMostRecentResponse(): HttpOperationResponse;
    /**
     * Get whether or not the LRO is finished.
     */
    isFinished(): boolean;
    /**
     * Get whether or not the LRO is finished and its final state is acceptable. If the LRO has not
     * finished yet, then undefined will be returned. An "acceptable" final state is determined by the
     * LRO strategy that the Azure service uses to perform long running operations.
     */
    isFinalStatusAcceptable(): boolean | undefined;
    /**
     * Get the current status of the LRO.
     */
    getOperationStatus(): LongRunningOperationStates;
    /**
     * If the LRO is finished and in an acceptable state, then return the HttpOperationResponse. If
     * the LRO is finished and not in an acceptable state, then throw the error that the LRO produced.
     * If the LRO is not finished, then return undefined.
     */
    getOperationResponse(): Promise<HttpOperationResponse | undefined>;
    /**
     * Send a single poll request and return the LRO's state.
     */
    poll(): Promise<LongRunningOperationStates>;
    /**
     * Send poll requests that check the LRO's status until it is determined that the LRO is finished.
     */
    pollUntilFinished(): Promise<RestResponse>;
    /**
     * Get an LROPollState object that can be used to poll this LRO in a different context (such as on
     * a different process or a different machine). If the LRO couldn't produce an LRO polling
     * strategy, then this will return undefined.
     */
    getPollState(): LROPollState | undefined;
}
export declare function createLROPollerFromInitialResponse(azureServiceClient: AzureServiceClient, initialResponse: HttpOperationResponse, options?: RequestOptionsBase): LROPoller;
export declare function createLROPollerFromPollState(azureServiceClient: AzureServiceClient, lroMemento: LROPollState): LROPoller;
//# sourceMappingURL=lroPoller.d.ts.map