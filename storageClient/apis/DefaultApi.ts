// TODO: better import syntax?
import { BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS } from './baseapi';
import { Configuration } from '../configuration';
import { RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo } from '../http/http';
import { ObjectSerializer } from '../models/ObjectSerializer';
import { ApiException } from './exception';
import { canConsumeForm, isCodeInRange } from '../util';
import { SecurityAuthentication } from '../auth/auth';


import { DownloadFileKeyGet400Response } from '../models/DownloadFileKeyGet400Response';
import { DownloadFileKeyTokenGet200Response } from '../models/DownloadFileKeyTokenGet200Response';
import { FilesGet206Response } from '../models/FilesGet206Response';
import { FilesPost200Response } from '../models/FilesPost200Response';
import { FilesPostRequest } from '../models/FilesPostRequest';
import { R2Object } from '../models/R2Object';
import { R2UploadedPart } from '../models/R2UploadedPart';
import { Visibility } from '../models/Visibility';

/**
 * no description
 */
export class DefaultApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Download a file
     * @param fileKey 
     * @param token 
     */
    public async downloadFileKeyGet(fileKey: string, token: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'fileKey' is not null or undefined
        if (fileKey === null || fileKey === undefined) {
            throw new RequiredError("DefaultApi", "downloadFileKeyGet", "fileKey");
        }


        // verify required parameter 'token' is not null or undefined
        if (token === null || token === undefined) {
            throw new RequiredError("DefaultApi", "downloadFileKeyGet", "token");
        }


        // Path Params
        const localVarPath = '/download/{file_key}'
            .replace('{' + 'file_key' + '}', encodeURIComponent(String(fileKey)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (token !== undefined) {
            requestContext.setQueryParam("token", ObjectSerializer.serialize(token, "string", ""));
        }


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["ApiKeyAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }

        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Generate a download token for a file
     * @param fileKey 
     */
    public async downloadFileKeyTokenGet(fileKey: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'fileKey' is not null or undefined
        if (fileKey === null || fileKey === undefined) {
            throw new RequiredError("DefaultApi", "downloadFileKeyTokenGet", "fileKey");
        }


        // Path Params
        const localVarPath = '/download/{file_key}/token'
            .replace('{' + 'file_key' + '}', encodeURIComponent(String(fileKey)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["ApiKeyAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }

        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get file or list files
     * @param key 
     * @param limit 
     * @param cursor 
     * @param range 
     * @param onlyIf 
     */
    public async filesGet(key?: string, limit?: number, cursor?: string, range?: string, onlyIf?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;






        // Path Params
        const localVarPath = '/files';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (key !== undefined) {
            requestContext.setQueryParam("key", ObjectSerializer.serialize(key, "string", ""));
        }

        // Query Params
        if (limit !== undefined) {
            requestContext.setQueryParam("limit", ObjectSerializer.serialize(limit, "number", ""));
        }

        // Query Params
        if (cursor !== undefined) {
            requestContext.setQueryParam("cursor", ObjectSerializer.serialize(cursor, "string", ""));
        }

        // Query Params
        if (range !== undefined) {
            requestContext.setQueryParam("range", ObjectSerializer.serialize(range, "string", ""));
        }

        // Query Params
        if (onlyIf !== undefined) {
            requestContext.setQueryParam("onlyIf", ObjectSerializer.serialize(onlyIf, "string", ""));
        }


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["ApiKeyAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }

        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Create or complete multipart upload
     * @param filesPostRequest 
     * @param uploadId 
     * @param key 
     * @param visibility 
     */
    public async filesPost(filesPostRequest: FilesPostRequest, uploadId?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'filesPostRequest' is not null or undefined
        if (filesPostRequest === null || filesPostRequest === undefined) {
            throw new RequiredError("DefaultApi", "filesPost", "filesPostRequest");
        }

        // Path Params
        const localVarPath = '/files';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Query Params
        if (uploadId !== undefined) {
            requestContext.setQueryParam("upload_id", ObjectSerializer.serialize(uploadId, "string", ""));
        }

        // If parts are present, set key as a query parameter
        console.log(filesPostRequest);
        if (filesPostRequest.parts && filesPostRequest.parts.length > 0 && filesPostRequest.key) {
            requestContext.setQueryParam("key", ObjectSerializer.serialize(filesPostRequest.key, "string", ""));
        }

        // If visibility is present, set it as a query parameter
        if (filesPostRequest.visibility) {
            requestContext.setQueryParam("visibility", ObjectSerializer.serialize(filesPostRequest.visibility, "Visibility", ""));
        }

        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        let serializedBody;
        if (filesPostRequest.parts && filesPostRequest.parts.length > 0) {
            // If parts are present, send only the parts array
            serializedBody = ObjectSerializer.stringify(
                ObjectSerializer.serialize(filesPostRequest.parts, "R2UploadedPartBody[]", ""),
                contentType
            );
        } else {
            serializedBody = ObjectSerializer.stringify(
                ObjectSerializer.serialize(filesPostRequest, "FilesPostRequest", ""),
                contentType
            );
        }
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["ApiKeyAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }

        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Upload file or file part
     * @param file 
     * @param key 
     * @param uploadId 
     * @param part 
     * @param visibility 
     */
    public async filesPut(file: HttpFile, key: string, uploadId?: string, part?: number, visibility?: Visibility, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'file' is not null or undefined
        if (file === null || file === undefined) {
            throw new RequiredError("DefaultApi", "filesPut", "file");
        }


        // verify required parameter 'key' is not null or undefined
        if (key === null || key === undefined) {
            throw new RequiredError("DefaultApi", "filesPut", "key");
        }





        // Path Params
        const localVarPath = '/files';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.PUT);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Form Params
        const useForm = canConsumeForm([
            'multipart/form-data',
        ]);

        let localVarFormParams
        if (useForm) {
            localVarFormParams = new FormData();
        } else {
            localVarFormParams = new URLSearchParams();
        }

        if (file !== undefined) {
            // TODO: replace .append with .set
            if (localVarFormParams instanceof FormData) {
                localVarFormParams.append('file', file, file.name);
            }
        }
        if (key !== undefined) {
            // TODO: replace .append with .set
            localVarFormParams.append('key', key as any);
        }
        if (uploadId !== undefined) {
            // TODO: replace .append with .set
            localVarFormParams.append('upload_id', uploadId as any);
        }
        if (part !== undefined) {
            // TODO: replace .append with .set
            localVarFormParams.append('part', part as any);
        }
        if (visibility !== undefined) {
            // TODO: replace .append with .set
            localVarFormParams.append('visibility', visibility as any);
        }

        requestContext.setBody(localVarFormParams);

        if (!useForm) {
            const contentType = ObjectSerializer.getPreferredMediaType([
                "multipart/form-data"
            ]);
            requestContext.setHeaderParam("Content-Type", contentType);
        }

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["ApiKeyAuth"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }

        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class DefaultApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to downloadFileKeyGet
     * @throws ApiException if the response code was not in [200, 299]
     */
    public async downloadFileKeyGetWithHttpInfo(response: ResponseContext): Promise<HttpInfo<HttpFile>> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: HttpFile = await response.getBodyAsFile() as any as HttpFile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", "binary"
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Bad request", body, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", "binary"
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Not found", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: HttpFile = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "HttpFile", "binary"
            ) as HttpFile;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to downloadFileKeyTokenGet
     * @throws ApiException if the response code was not in [200, 299]
     */
    public async downloadFileKeyTokenGetWithHttpInfo(response: ResponseContext): Promise<HttpInfo<DownloadFileKeyTokenGet200Response>> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: DownloadFileKeyTokenGet200Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyTokenGet200Response", ""
            ) as DownloadFileKeyTokenGet200Response;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", ""
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Bad request", body, response.headers);
        }
        if (isCodeInRange("500", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: DownloadFileKeyTokenGet200Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyTokenGet200Response", ""
            ) as DownloadFileKeyTokenGet200Response;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to filesGet
     * @throws ApiException if the response code was not in [200, 299]
     */
    public async filesGetWithHttpInfo(response: ResponseContext): Promise<HttpInfo<HttpFile | FilesGet206Response>> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body = await response.getBodyAsFile();
            if (body instanceof Blob) {
                return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
            }
            throw new Error("Unexpected response type");
        }
        if (isCodeInRange("206", response.httpStatusCode)) {
            const body: FilesGet206Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "FilesGet206Response", "binary"
            ) as FilesGet206Response;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", "binary"
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Bad request", body, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", "binary"
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Unauthorized", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", "binary"
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Permission denied", body, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", "binary"
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Not found", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: HttpFile | FilesGet206Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "HttpFile | FilesGet206Response", "binary"
            ) as HttpFile | FilesGet206Response;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to filesPost
     * @throws ApiException if the response code was not in [200, 299]
     */
    public async filesPostWithHttpInfo(response: ResponseContext): Promise<HttpInfo<FilesPost200Response>> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: FilesPost200Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "FilesPost200Response", ""
            ) as FilesPost200Response;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", ""
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Bad request", body, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", ""
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Unauthorized", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: FilesPost200Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "FilesPost200Response", ""
            ) as FilesPost200Response;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to filesPut
     * @throws ApiException if the response code was not in [200, 299]
     */
    public async filesPutWithHttpInfo(response: ResponseContext): Promise<HttpInfo<R2Object | R2UploadedPart>> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: R2Object = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "R2Object", ""
            ) as R2Object;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: R2UploadedPart = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "R2UploadedPart", ""
            ) as R2UploadedPart;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", ""
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Bad request", body, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            const body: DownloadFileKeyGet400Response = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "DownloadFileKeyGet400Response", ""
            ) as DownloadFileKeyGet400Response;
            throw new ApiException<DownloadFileKeyGet400Response>(response.httpStatusCode, "Unauthorized", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: R2Object | R2UploadedPart = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "R2Object | R2UploadedPart", ""
            ) as R2Object | R2UploadedPart;
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, body);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
