import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration} from '../configuration'

import { DownloadFileKeyGet400Response } from '../models/DownloadFileKeyGet400Response';
import { DownloadFileKeyTokenGet200Response } from '../models/DownloadFileKeyTokenGet200Response';
import { FileCreateBody } from '../models/FileCreateBody';
import { FileCreatePartBody } from '../models/FileCreatePartBody';
import { FileCreateStartBody } from '../models/FileCreateStartBody';
import { FilesGet206Response } from '../models/FilesGet206Response';
import { FilesPost200Response } from '../models/FilesPost200Response';
import { FilesPostRequest } from '../models/FilesPostRequest';
import { R2MultipartUploadResponse } from '../models/R2MultipartUploadResponse';
import { R2Object } from '../models/R2Object';
import { R2ObjectList } from '../models/R2ObjectList';
import { R2UploadedPart } from '../models/R2UploadedPart';
import { R2UploadedPartBody } from '../models/R2UploadedPartBody';
import { Visibility } from '../models/Visibility';

import { ObservableDefaultApi } from "./ObservableAPI";
import { DefaultApiRequestFactory, DefaultApiResponseProcessor} from "../apis/DefaultApi";

export interface DefaultApiDownloadFileKeyGetRequest {
    /**
     * 
     * @type string
     * @memberof DefaultApidownloadFileKeyGet
     */
    fileKey: string
    /**
     * 
     * @type string
     * @memberof DefaultApidownloadFileKeyGet
     */
    token: string
}

export interface DefaultApiDownloadFileKeyTokenGetRequest {
    /**
     * 
     * @type string
     * @memberof DefaultApidownloadFileKeyTokenGet
     */
    fileKey: string
}

export interface DefaultApiFilesGetRequest {
    /**
     * 
     * @type string
     * @memberof DefaultApifilesGet
     */
    key?: string
    /**
     * 
     * @type number
     * @memberof DefaultApifilesGet
     */
    limit?: number
    /**
     * 
     * @type string
     * @memberof DefaultApifilesGet
     */
    cursor?: string
    /**
     * 
     * @type string
     * @memberof DefaultApifilesGet
     */
    range?: string
    /**
     * 
     * @type string
     * @memberof DefaultApifilesGet
     */
    onlyIf?: string
}

export interface DefaultApiFilesPostRequest {
    /**
     * 
     * @type FilesPostRequest
     * @memberof DefaultApifilesPost
     */
    filesPostRequest: FilesPostRequest
    /**
     * 
     * @type string
     * @memberof DefaultApifilesPost
     */
    uploadId?: string
    /**
     * 
     * @type string
     * @memberof DefaultApifilesPost
     */
    key?: string
    /**
     * 
     * @type Visibility
     * @memberof DefaultApifilesPost
     */
    visibility?: Visibility
}

export interface DefaultApiFilesPutRequest {
    /**
     * 
     * @type HttpFile
     * @memberof DefaultApifilesPut
     */
    file: HttpFile
    /**
     * 
     * @type string
     * @memberof DefaultApifilesPut
     */
    key: string
    /**
     * 
     * @type string
     * @memberof DefaultApifilesPut
     */
    uploadId?: string
    /**
     * 
     * @type number
     * @memberof DefaultApifilesPut
     */
    part?: number
    /**
     * 
     * @type Visibility
     * @memberof DefaultApifilesPut
     */
    visibility?: Visibility
}

export class ObjectDefaultApi {
    private api: ObservableDefaultApi

    public constructor(configuration: Configuration, requestFactory?: DefaultApiRequestFactory, responseProcessor?: DefaultApiResponseProcessor) {
        this.api = new ObservableDefaultApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Download a file
     * @param param the request object
     */
    public downloadFileKeyGetWithHttpInfo(param: DefaultApiDownloadFileKeyGetRequest, options?: Configuration): Promise<HttpInfo<HttpFile>> {
        return this.api.downloadFileKeyGetWithHttpInfo(param.fileKey, param.token,  options).toPromise();
    }

    /**
     * Download a file
     * @param param the request object
     */
    public downloadFileKeyGet(param: DefaultApiDownloadFileKeyGetRequest, options?: Configuration): Promise<HttpFile> {
        return this.api.downloadFileKeyGet(param.fileKey, param.token,  options).toPromise();
    }

    /**
     * Generate a download token for a file
     * @param param the request object
     */
    public downloadFileKeyTokenGetWithHttpInfo(param: DefaultApiDownloadFileKeyTokenGetRequest, options?: Configuration): Promise<HttpInfo<DownloadFileKeyTokenGet200Response>> {
        return this.api.downloadFileKeyTokenGetWithHttpInfo(param.fileKey,  options).toPromise();
    }

    /**
     * Generate a download token for a file
     * @param param the request object
     */
    public downloadFileKeyTokenGet(param: DefaultApiDownloadFileKeyTokenGetRequest, options?: Configuration): Promise<DownloadFileKeyTokenGet200Response> {
        return this.api.downloadFileKeyTokenGet(param.fileKey,  options).toPromise();
    }

    /**
     * Get file or list files
     * @param param the request object
     */
    public filesGetWithHttpInfo(param: DefaultApiFilesGetRequest = {}, options?: Configuration): Promise<HttpInfo<HttpFile | FilesGet206Response>> {
        return this.api.filesGetWithHttpInfo(param.key, param.limit, param.cursor, param.range, param.onlyIf,  options).toPromise();
    }

    /**
     * Get file or list files
     * @param param the request object
     */
    public filesGet(param: DefaultApiFilesGetRequest = {}, options?: Configuration): Promise<HttpFile | FilesGet206Response> {
        return this.api.filesGet(param.key, param.limit, param.cursor, param.range, param.onlyIf,  options).toPromise();
    }

    /**
     * Create or complete multipart upload
     * @param param the request object
     */
    public filesPostWithHttpInfo(param: DefaultApiFilesPostRequest, options?: Configuration): Promise<HttpInfo<FilesPost200Response>> {
        return this.api.filesPostWithHttpInfo(param.filesPostRequest, param.uploadId, param.key, param.visibility,  options).toPromise();
    }

    /**
     * Create or complete multipart upload
     * @param param the request object
     */
    public filesPost(param: DefaultApiFilesPostRequest, options?: Configuration): Promise<FilesPost200Response> {
        return this.api.filesPost(param.filesPostRequest, param.uploadId, param.key, param.visibility,  options).toPromise();
    }

    /**
     * Upload file or file part
     * @param param the request object
     */
    public filesPutWithHttpInfo(param: DefaultApiFilesPutRequest, options?: Configuration): Promise<HttpInfo<R2Object | R2UploadedPart>> {
        return this.api.filesPutWithHttpInfo(param.file, param.key, param.uploadId, param.part, param.visibility,  options).toPromise();
    }

    /**
     * Upload file or file part
     * @param param the request object
     */
    public filesPut(param: DefaultApiFilesPutRequest, options?: Configuration): Promise<R2Object | R2UploadedPart> {
        return this.api.filesPut(param.file, param.key, param.uploadId, param.part, param.visibility,  options).toPromise();
    }

}
