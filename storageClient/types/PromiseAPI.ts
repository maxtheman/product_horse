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
import { ObservableDefaultApi } from './ObservableAPI';

import { DefaultApiRequestFactory, DefaultApiResponseProcessor} from "../apis/DefaultApi";
export class PromiseDefaultApi {
    private api: ObservableDefaultApi

    public constructor(
        configuration: Configuration,
        requestFactory?: DefaultApiRequestFactory,
        responseProcessor?: DefaultApiResponseProcessor
    ) {
        this.api = new ObservableDefaultApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Download a file
     * @param fileKey 
     * @param token 
     */
    public downloadFileKeyGetWithHttpInfo(fileKey: string, token: string, _options?: Configuration): Promise<HttpInfo<HttpFile>> {
        const result = this.api.downloadFileKeyGetWithHttpInfo(fileKey, token, _options);
        return result.toPromise();
    }

    /**
     * Download a file
     * @param fileKey 
     * @param token 
     */
    public downloadFileKeyGet(fileKey: string, token: string, _options?: Configuration): Promise<HttpFile> {
        const result = this.api.downloadFileKeyGet(fileKey, token, _options);
        return result.toPromise();
    }

    /**
     * Generate a download token for a file
     * @param fileKey 
     */
    public downloadFileKeyTokenGetWithHttpInfo(fileKey: string, _options?: Configuration): Promise<HttpInfo<DownloadFileKeyTokenGet200Response>> {
        const result = this.api.downloadFileKeyTokenGetWithHttpInfo(fileKey, _options);
        return result.toPromise();
    }

    /**
     * Generate a download token for a file
     * @param fileKey 
     */
    public downloadFileKeyTokenGet(fileKey: string, _options?: Configuration): Promise<DownloadFileKeyTokenGet200Response> {
        const result = this.api.downloadFileKeyTokenGet(fileKey, _options);
        return result.toPromise();
    }

    /**
     * Get file or list files
     * @param key 
     * @param limit 
     * @param cursor 
     * @param range 
     * @param onlyIf 
     */
    public filesGetWithHttpInfo(key?: string, limit?: number, cursor?: string, range?: string, onlyIf?: string, _options?: Configuration): Promise<HttpInfo<HttpFile | FilesGet206Response>> {
        const result = this.api.filesGetWithHttpInfo(key, limit, cursor, range, onlyIf, _options);
        return result.toPromise();
    }

    /**
     * Get file or list files
     * @param key 
     * @param limit 
     * @param cursor 
     * @param range 
     * @param onlyIf 
     */
    public filesGet(key?: string, limit?: number, cursor?: string, range?: string, onlyIf?: string, _options?: Configuration): Promise<HttpFile | FilesGet206Response> {
        const result = this.api.filesGet(key, limit, cursor, range, onlyIf, _options);
        return result.toPromise();
    }

    /**
     * Create or complete multipart upload
     * @param filesPostRequest 
     * @param uploadId 
     * @param key 
     * @param visibility 
     */
    public filesPostWithHttpInfo(filesPostRequest: FilesPostRequest, uploadId?: string, key?: string, visibility?: Visibility, _options?: Configuration): Promise<HttpInfo<FilesPost200Response>> {
        const result = this.api.filesPostWithHttpInfo(filesPostRequest, uploadId, key, visibility, _options);
        return result.toPromise();
    }

    /**
     * Create or complete multipart upload
     * @param filesPostRequest 
     * @param uploadId 
     * @param key 
     * @param visibility 
     */
    public filesPost(filesPostRequest: FilesPostRequest, uploadId?: string, key?: string, visibility?: Visibility, _options?: Configuration): Promise<FilesPost200Response> {
        const result = this.api.filesPost(filesPostRequest, uploadId, key, visibility, _options);
        return result.toPromise();
    }

    /**
     * Upload file or file part
     * @param file 
     * @param key 
     * @param uploadId 
     * @param part 
     * @param visibility 
     */
    public filesPutWithHttpInfo(file: HttpFile, key: string, uploadId?: string, part?: number, visibility?: Visibility, _options?: Configuration): Promise<HttpInfo<R2Object | R2UploadedPart>> {
        const result = this.api.filesPutWithHttpInfo(file, key, uploadId, part, visibility, _options);
        return result.toPromise();
    }

    /**
     * Upload file or file part
     * @param file 
     * @param key 
     * @param uploadId 
     * @param part 
     * @param visibility 
     */
    public filesPut(file: HttpFile, key: string, uploadId?: string, part?: number, visibility?: Visibility, _options?: Configuration): Promise<R2Object | R2UploadedPart> {
        const result = this.api.filesPut(file, key, uploadId, part, visibility, _options);
        return result.toPromise();
    }


}



