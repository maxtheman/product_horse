import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration} from '../configuration'
import { Observable, of, from } from '../rxjsStub';
import {mergeMap, map} from  '../rxjsStub';
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

import { DefaultApiRequestFactory, DefaultApiResponseProcessor} from "../apis/DefaultApi";
export class ObservableDefaultApi {
    private requestFactory: DefaultApiRequestFactory;
    private responseProcessor: DefaultApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: DefaultApiRequestFactory,
        responseProcessor?: DefaultApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new DefaultApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new DefaultApiResponseProcessor();
    }

    /**
     * Download a file
     * @param fileKey 
     * @param token 
     */
    public downloadFileKeyGetWithHttpInfo(fileKey: string, token: string, _options?: Configuration): Observable<HttpInfo<HttpFile>> {
        const requestContextPromise = this.requestFactory.downloadFileKeyGet(fileKey, token, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.downloadFileKeyGetWithHttpInfo(rsp)));
            }));
    }

    /**
     * Download a file
     * @param fileKey 
     * @param token 
     */
    public downloadFileKeyGet(fileKey: string, token: string, _options?: Configuration): Observable<HttpFile> {
        return this.downloadFileKeyGetWithHttpInfo(fileKey, token, _options).pipe(map((apiResponse: HttpInfo<HttpFile>) => apiResponse.data));
    }

    /**
     * Generate a download token for a file
     * @param fileKey 
     */
    public downloadFileKeyTokenGetWithHttpInfo(fileKey: string, _options?: Configuration): Observable<HttpInfo<DownloadFileKeyTokenGet200Response>> {
        const requestContextPromise = this.requestFactory.downloadFileKeyTokenGet(fileKey, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.downloadFileKeyTokenGetWithHttpInfo(rsp)));
            }));
    }

    /**
     * Generate a download token for a file
     * @param fileKey 
     */
    public downloadFileKeyTokenGet(fileKey: string, _options?: Configuration): Observable<DownloadFileKeyTokenGet200Response> {
        return this.downloadFileKeyTokenGetWithHttpInfo(fileKey, _options).pipe(map((apiResponse: HttpInfo<DownloadFileKeyTokenGet200Response>) => apiResponse.data));
    }

    /**
     * Get file or list files
     * @param key 
     * @param limit 
     * @param cursor 
     * @param range 
     * @param onlyIf 
     */
    public filesGetWithHttpInfo(key?: string, limit?: number, cursor?: string, range?: string, onlyIf?: string, _options?: Configuration): Observable<HttpInfo<HttpFile | FilesGet206Response>> {
        const requestContextPromise = this.requestFactory.filesGet(key, limit, cursor, range, onlyIf, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.filesGetWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get file or list files
     * @param key 
     * @param limit 
     * @param cursor 
     * @param range 
     * @param onlyIf 
     */
    public filesGet(key?: string, limit?: number, cursor?: string, range?: string, onlyIf?: string, _options?: Configuration): Observable<HttpFile | FilesGet206Response> {
        return this.filesGetWithHttpInfo(key, limit, cursor, range, onlyIf, _options).pipe(map((apiResponse: HttpInfo<HttpFile | FilesGet206Response>) => apiResponse.data));
    }

    /**
     * Create or complete multipart upload
     * @param filesPostRequest 
     * @param uploadId 
     * @param key 
     * @param visibility 
     */
    public filesPostWithHttpInfo(filesPostRequest: FilesPostRequest, uploadId?: string, key?: string, visibility?: Visibility, _options?: Configuration): Observable<HttpInfo<FilesPost200Response>> {
        const requestContextPromise = this.requestFactory.filesPost(filesPostRequest, uploadId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.filesPostWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create or complete multipart upload
     * @param filesPostRequest 
     * @param uploadId 
     * @param key 
     * @param visibility 
     */
    public filesPost(filesPostRequest: FilesPostRequest, uploadId?: string, key?: string, visibility?: Visibility, _options?: Configuration): Observable<FilesPost200Response> {
        return this.filesPostWithHttpInfo(filesPostRequest, uploadId, key, visibility, _options).pipe(map((apiResponse: HttpInfo<FilesPost200Response>) => apiResponse.data));
    }

    /**
     * Upload file or file part
     * @param file 
     * @param key 
     * @param uploadId 
     * @param part 
     * @param visibility 
     */
    public filesPutWithHttpInfo(file: HttpFile, key: string, uploadId?: string, part?: number, visibility?: Visibility, _options?: Configuration): Observable<HttpInfo<R2Object | R2UploadedPart>> {
        const requestContextPromise = this.requestFactory.filesPut(file, key, uploadId, part, visibility, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.filesPutWithHttpInfo(rsp)));
            }));
    }

    /**
     * Upload file or file part
     * @param file 
     * @param key 
     * @param uploadId 
     * @param part 
     * @param visibility 
     */
    public filesPut(file: HttpFile, key: string, uploadId?: string, part?: number, visibility?: Visibility, _options?: Configuration): Observable<R2Object | R2UploadedPart> {
        return this.filesPutWithHttpInfo(file, key, uploadId, part, visibility, _options).pipe(map((apiResponse: HttpInfo<R2Object | R2UploadedPart>) => apiResponse.data));
    }

}
