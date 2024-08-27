import { DefaultApi, createConfiguration, ServerConfiguration, R2UploadedPartBody, HttpFile, Visibility } from 'storage-client';


class StorageClient {
    private apiInstance: DefaultApi;

    constructor(jwt: string) {
        const serverConfig = new ServerConfiguration('https://storage.producthorse.workers.dev', {});
        // const serverConfig = new ServerConfiguration('http://localhost:8787', {});


        const configuration = createConfiguration({
            baseServer: serverConfig,
            authMethods: { ApiKeyAuth: jwt }
        });
        this.apiInstance = new DefaultApi(configuration);
    }


    async uploadLargeFile(file: File, key: string, visibility: Visibility) {
        const chunkSize = 5 * 1024 * 1024; // 5MB chunks
        const fileSize = file.size;
    
        // Initiate multipart upload
        const initResponse = await this.apiInstance.filesPost({ key, visibility });
        const uploadId = initResponse.uploadId;
    
        let partNumber = 1;
        const parts: R2UploadedPartBody[] = [];
        for (let start = 0; start < fileSize; start += chunkSize) {
            const end = Math.min(start + chunkSize, fileSize);
            const chunk = file.slice(start, end);
            const partResponse = await this.apiInstance.filesPut(
                Object.assign(new Blob([chunk],
                    { type: 'application/octet-stream' }),
                    { name: `part-${partNumber}` }
                ),
                key,
                uploadId,
                partNumber,
            );
            if (!partResponse.etag) {
                throw new Error('Part response does not contain ETag');
            }
            parts.push({
                etag: partResponse.etag,
                partNumber: partNumber
            });
            partNumber++;
        }
    
        // Complete multipart upload
        await this.apiInstance.filesPost({
            parts,
            key,
            visibility,
        }, uploadId);
        return true;
    }

    async uploadSmallFile(file: HttpFile, key: string, visibility: Visibility) {
        return await this.apiInstance.filesPut(file, key, undefined, undefined, visibility);
    }
    async upload(file: File, key: string, visibility: 'PUBLIC' | 'PRIVATE' | 'INTERNAL') {
        const visibilityEnum = visibility as Visibility;
        if (!visibilityEnum) {
            throw new Error('Invalid visibility');
        }
        if (file.size > 30 * 1024 * 1024) {
            console.log("uploading large file");
            return this.uploadLargeFile(file, key, visibilityEnum);
        } else {
            console.log("uploading small file");
            return this.uploadSmallFile(file, key, visibilityEnum);
        }
    }
}

export default StorageClient;