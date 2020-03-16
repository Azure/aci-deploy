import { CompositeMapper } from "@azure/ms-rest-js";
/**
 * @class
 * Provides additional information about an http error response returned from a Microsoft Azure service.
 */
export interface CloudError extends Error {
    /**
     * @property {string} code The error code parsed from the body of the http error response.
     */
    code: string;
    /**
     * @property {string} message The error message parsed from the body of the http error response.
     */
    message: string;
    /**
     * @property {string} [target] The target of the error.
     */
    target?: string;
    /**
     * @property {Array<CloudError>} [details] An array of CloudError objects specifying the details.
     */
    details?: Array<CloudError>;
    /**
     * @property {any} [innerError] The inner error parsed from the body of the http error response
     */
    innerError?: any;
    /**
     * @property {AdditionalInfoElement} [innerError] The additional error information
     */
    additionalInfo?: AdditionalInfoElement;
}
/**
 * @interface
 * Additional data for an instance of CloudError.
 */
export interface AdditionalInfoElement {
    /**
     * @property {string} [type] Type of the data.
     */
    type?: string;
    /**
     * @property {string} [info] Additional info.
     */
    info?: string;
}
export declare const CloudErrorMapper: CompositeMapper;
//# sourceMappingURL=cloudError.d.ts.map