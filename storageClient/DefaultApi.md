# .DefaultApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**downloadFileKeyGet**](DefaultApi.md#downloadFileKeyGet) | **GET** /download/{file_key} | Download a file
[**downloadFileKeyTokenGet**](DefaultApi.md#downloadFileKeyTokenGet) | **GET** /download/{file_key}/token | Generate a download token for a file
[**filesGet**](DefaultApi.md#filesGet) | **GET** /files | Get file or list files
[**filesPost**](DefaultApi.md#filesPost) | **POST** /files | Create or complete multipart upload
[**filesPut**](DefaultApi.md#filesPut) | **PUT** /files | Upload file or file part


# **downloadFileKeyGet**
> HttpFile downloadFileKeyGet()


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .DefaultApi(configuration);

let body:.DefaultApiDownloadFileKeyGetRequest = {
  // string
  fileKey: "file_key_example",
  // string
  token: "token_example",
};

apiInstance.downloadFileKeyGet(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **fileKey** | [**string**] |  | defaults to undefined
 **token** | [**string**] |  | defaults to undefined


### Return type

**HttpFile**

### Authorization

[ApiKeyAuth](README.md#ApiKeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream, application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful file download |  -  |
**400** | Bad request |  -  |
**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **downloadFileKeyTokenGet**
> DownloadFileKeyTokenGet200Response downloadFileKeyTokenGet()


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .DefaultApi(configuration);

let body:.DefaultApiDownloadFileKeyTokenGetRequest = {
  // string
  fileKey: "file_key_example",
};

apiInstance.downloadFileKeyTokenGet(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **fileKey** | [**string**] |  | defaults to undefined


### Return type

**DownloadFileKeyTokenGet200Response**

### Authorization

[ApiKeyAuth](README.md#ApiKeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful token generation |  -  |
**400** | Bad request |  -  |
**500** |  |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **filesGet**
> HttpFile | FilesGet206Response filesGet()


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .DefaultApi(configuration);

let body:.DefaultApiFilesGetRequest = {
  // string (optional)
  key: "key_example",
  // number (optional)
  limit: 1,
  // string (optional)
  cursor: "cursor_example",
  // string (optional)
  range: "range_example",
  // string (optional)
  onlyIf: "onlyIf_example",
};

apiInstance.filesGet(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **key** | [**string**] |  | (optional) defaults to undefined
 **limit** | [**number**] |  | (optional) defaults to undefined
 **cursor** | [**string**] |  | (optional) defaults to undefined
 **range** | [**string**] |  | (optional) defaults to undefined
 **onlyIf** | [**string**] |  | (optional) defaults to undefined


### Return type

**HttpFile | FilesGet206Response**

### Authorization

[ApiKeyAuth](README.md#ApiKeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream, application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  * Content-Disposition - Contains the filename (if available) <br>  |
**206** | Successful response for file metadata (not content, i.e. partial) |  -  |
**400** | Bad request |  -  |
**401** | Unauthorized |  -  |
**403** | Permission denied |  -  |
**404** | Not found |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **filesPost**
> FilesPost200Response filesPost(filesPostRequest)


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .DefaultApi(configuration);

let body:.DefaultApiFilesPostRequest = {
  // FilesPostRequest
  filesPostRequest: null,
  // string (optional)
  uploadId: "upload_id_example",
  // string (optional)
  key: "key_example",
  // Visibility (optional)
  visibility: "PUBLIC",
};

apiInstance.filesPost(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **filesPostRequest** | **FilesPostRequest**|  |
 **uploadId** | [**string**] |  | (optional) defaults to undefined
 **key** | [**string**] |  | (optional) defaults to undefined
 **visibility** | **Visibility** |  | (optional) defaults to undefined


### Return type

**FilesPost200Response**

### Authorization

[ApiKeyAuth](README.md#ApiKeyAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Bad request |  -  |
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **filesPut**
> R2Object | R2UploadedPart filesPut()


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .DefaultApi(configuration);

let body:.DefaultApiFilesPutRequest = {
  // HttpFile
  file: { data: Buffer.from(fs.readFileSync('/path/to/file', 'utf-8')), name: '/path/to/file' },
  // string
  key: "key_example",
  // string (optional)
  uploadId: "uploadId_example",
  // number (optional)
  part: 1,
  // Visibility (optional)
  visibility: "PUBLIC",
};

apiInstance.filesPut(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file** | [**HttpFile**] |  | defaults to undefined
 **key** | [**string**] |  | defaults to undefined
 **uploadId** | [**string**] |  | (optional) defaults to undefined
 **part** | [**number**] |  | (optional) defaults to undefined
 **visibility** | **Visibility** |  | (optional) defaults to undefined


### Return type

**R2Object | R2UploadedPart**

### Authorization

[ApiKeyAuth](README.md#ApiKeyAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful file upload |  -  |
**201** | Successful part upload |  -  |
**400** | Bad request |  -  |
**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


