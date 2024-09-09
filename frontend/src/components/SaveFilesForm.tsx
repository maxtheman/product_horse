import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from 'urql';
import { useLocation } from "wouter";
import {
    FileUploader,
    FileInput,
} from "@/components/extension/file-upload";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { FileUp, Video, Music, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AnimatedErrorMessage } from "@/components/AnimatedErrorMessage";
import { PulsingButton } from "@/components/PulsingButton";
import { SAVE_FILES_MUTATION, UPDATE_FILE_METADATA_STATUS_MUTATION, TRANSCRIBE_FILE_MUTATION } from "@/graphql";

type SaveFilesResult = {
    id: string;
    filePath: string;
    fileName: string;
    fileStatus: string;
    uploadConfig: UploadConfig;
};

interface UploadConfig  {
    type: string;
    destination: SinglePartUpload | MultiPartUploadUrls;
};

interface SinglePartUpload {
    type: 'single';
    url: string;
}

interface MultiPartUploadUrls {
    type: 'multi';
    presignedUrls: string[];
    completePostUrl: string;
    parts: number;
}
const uploadFileToS3 = async (file: File, uploadConfig: UploadConfig): Promise<boolean> => {
    const { type, destination } = uploadConfig;
    try {
        if (type === 'single' && 'url' in destination) {
            console.log("uploading single")
            const response = await fetch(destination.url, {
                method: 'PUT',
                body: file,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else if (type === 'multi' && 'presignedUrls' in destination) {
            console.log("uploading multi")
            const parts: { ETag: string; PartNumber: number }[] = [];
            for (let i = 0; i < destination.parts; i += 6) {
                const uploadPromises = destination.presignedUrls.slice(i, i + 6).map(async (url, index) => {
                    const partNumber = i + index + 1;
                    const start = (partNumber - 1) * (file.size / destination.parts);
                    const end = partNumber * (file.size / destination.parts);
                    const chunk = file.slice(start, end);

                    const response = await fetch(url, {
                        method: 'PUT',
                        body: chunk,
                    });

                    if (!response.ok) throw new Error(`Failed to upload part ${partNumber}`);

                    const etag = response.headers.get('ETag');
                    if (!etag) throw new Error(`ETag not received for part ${partNumber}`);

                    return { ETag: etag, PartNumber: partNumber };
                });
                const uploadedParts = await Promise.all(uploadPromises);
                parts.push(...uploadedParts);
            }
            console.log("parts", parts)
            const xmlPayload = `
                <CompleteMultipartUpload>
                    ${parts.map(part => `
                        <Part>
                            <PartNumber>${part.PartNumber}</PartNumber>
                            <ETag>${part.ETag}</ETag>
                        </Part>
                    `).join('')}
                </CompleteMultipartUpload>
            `;
            const completeResponse = await fetch(destination.completePostUrl, {
                method: 'POST',
                body: xmlPayload,
                headers: {
                    'Content-Type': 'application/xml'
                }
            });
            if (!completeResponse.ok) {
                throw new Error('Failed to complete multipart upload');
            }
        } else {
            throw new Error('Invalid upload config type');
        }

        return true;
    } catch (error) {
        console.error('Error uploading file:', error);
        return false;
    }
};

const fileSchema = z.object({
    files: z.array(z.instanceof(File)).nonempty(),
    fileMetadata: z.object({
        fileType: z.enum(["VIDEO", "AUDIO"]),
        fileName: z.string().min(1),
        resolutionX: z.number().int().nonnegative(),
        resolutionY: z.number().int().nonnegative(),
        frameRate: z.number().nonnegative(),
        duration: z.number().nonnegative(),
    })
})

const SaveFilesForm = ({ userId }: { userId: string }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [videoSuccess, setVideoSuccess] = useState(false);
    const [, navigate] = useLocation();

    const [, saveFiles] = useMutation(SAVE_FILES_MUTATION);
    const [, updateFileMetadataStatus] = useMutation(UPDATE_FILE_METADATA_STATUS_MUTATION);
    const [, transcribeFile] = useMutation(TRANSCRIBE_FILE_MUTATION);

    const form = useForm<z.infer<typeof fileSchema>>({
        resolver: zodResolver(fileSchema),
        defaultValues: {
            files: [],
            fileMetadata: {
                fileType: "VIDEO",
                fileName: "",
                resolutionX: 1920,
                resolutionY: 1080,
                frameRate: 24,
                duration: 0
            }
        },
    })

    const dropzoneOptions = {
        accept: { 'video/*': [], 'audio/*': [] },
        maxFiles: 5,
        maxSize: 5 * 1024 * 1024 * 1024, // 5 GB
    };

    const detectFileMetadata = (file: File) => {
        return new Promise<z.infer<typeof fileSchema>['fileMetadata']>((resolve) => {
            if (file.type.startsWith('audio/')) {
                const audio = new Audio();
                audio.addEventListener('loadedmetadata', () => {
                    URL.revokeObjectURL(audio.src);
                    resolve({
                        fileType: 'AUDIO',
                        fileName: file.name,
                        resolutionX: 0,
                        resolutionY: 0,
                        frameRate: 0,
                        duration: audio.duration,
                    });
                });
                audio.src = URL.createObjectURL(file);
            } else {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    URL.revokeObjectURL(video.src);
                    resolve({
                        fileType: 'VIDEO',
                        fileName: file.name,
                        resolutionX: video.videoWidth,
                        resolutionY: video.videoHeight,
                        frameRate: (video as HTMLVideoElement & { mozFrameRate?: number; webkitFrameRate?: number }).mozFrameRate ||
                            (video as HTMLVideoElement & { mozFrameRate?: number; webkitFrameRate?: number }).webkitFrameRate ||
                            24,
                        duration: video.duration,
                    });
                };
                video.src = URL.createObjectURL(file);
            }
        });
    };

    const onSubmit = async (data: z.infer<typeof fileSchema>) => {
        setIsSubmitting(true);
        toast("Files uploading...", {
            description: "Your upload is in progress.",
        });
        try {
            // Step 0: Save files to server with mutation
            const fileMetadataInput = await Promise.all(data.files.map(async (file) => {
                const metadata = await detectFileMetadata(file);
                return {
                    fileName: file.name,
                    fileType: metadata.fileType,
                    resolutionX: metadata.resolutionX,
                    resolutionY: metadata.resolutionY,
                    frameRate: metadata.frameRate,
                    duration: metadata.duration,
                    fileSize: file.size,
                    mimeType: file.type,
                };
            }));

            const saveFilesResult = await saveFiles({ userId, fileMetadata: fileMetadataInput })


            if (saveFilesResult.error) {
                throw new Error(saveFilesResult.error.message);
            }

            const savedFiles = saveFilesResult.data.saveFiles as SaveFilesResult[];

            console.log(savedFiles)

            // Step 1 & 2: Upload files and transcribe
            const processPromises = savedFiles.map(async (savedFile: SaveFilesResult, index: number) => {
                const file = data.files[index];
                const metadata = fileMetadataInput[index];

                // Upload file
                await updateFileMetadataStatus({ fileId: savedFile.id, fileStatus: "upload_started" });

                const uploadResult = await uploadFileToS3(file, savedFile.uploadConfig);
                if (!uploadResult) {
                    await updateFileMetadataStatus({ fileId: savedFile.id, fileStatus: "upload_failed" });
                    throw new Error(`Failed to upload file: ${savedFile.fileName}`);
                }

                await updateFileMetadataStatus({ fileId: savedFile.id, fileStatus: "upload_finished" });
                toast("File uploaded successfully", {
                    description: "File uploaded successfully. Transcribing...",
                });
                // Transcribe file
                const fileToTranscribe = {
                    id: savedFile.id,
                    fileName: savedFile.fileName,
                    fileType: metadata.fileType,
                    resolutionX: metadata.resolutionX,
                    resolutionY: metadata.resolutionY,
                    frameRate: metadata.frameRate,
                    duration: metadata.duration,
                };
                await updateFileMetadataStatus({ fileId: savedFile.id, fileStatus: "transcribe_started" });
                const transcribeResult = await transcribeFile({ fileId: fileToTranscribe.id });
                if (!transcribeResult.data?.transcribeFile) {
                    await updateFileMetadataStatus({ fileId: savedFile.id, fileStatus: "transcribe_failed" });
                    toast("File transcription failed", {
                        description: "File transcription failed. Please try again.",
                    });
                    throw new Error(`Failed to transcribe file: ${savedFile.fileName}`);
                }

                await updateFileMetadataStatus({ fileId: savedFile.id, fileStatus: "transcribe_finished" });

                return { uploadResult, transcribeResult };
            });

            await Promise.all(processPromises);

            setVideoSuccess(true);
            for (const file of savedFiles) {
                await updateFileMetadataStatus({ fileId: file.id, fileStatus: "active" });
            }
            form.reset();
            toast("Files uploaded and transcribed successfully", {
                description: `${savedFiles.length} file(s) processed. Ready to create videos.`,
                action: {
                    label: "Create Video",
                    onClick: () => navigate(`/clips`),
                },
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred with file';
            form.setError("root", { type: 'custom', message: errorMessage });
            toast.error("Error processing files", {
                description: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
            form.setValue('files', [] as unknown as [File, ...File[]]);
        }
    };

    return (
        <div className="container py-10 mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Content</h1>
                    <h2 className="text-sm text-gray-500">User ID: {userId}</h2>
                </div>
                <Button variant="outline" onClick={() => navigate("/")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Contacts
                </Button>
            </div>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                    <CardDescription>Add a video or audio file for this user's research.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <AnimatedErrorMessage message={form.formState.errors.root?.message} />
                            <FormField
                                control={form.control}
                                name="files"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>File</FormLabel>
                                        <FormControl>
                                            <FileUploader
                                                value={field.value}
                                                onValueChange={(files) => {
                                                    field.onChange(files ?? []);
                                                    if (files?.[0]) {
                                                        detectFileMetadata(files[0]).then(metadata => {
                                                            form.setValue('fileMetadata', metadata);
                                                        });
                                                    }
                                                }}
                                                dropzoneOptions={dropzoneOptions}
                                                className="w-full"
                                            >
                                                <FileInput className="w-full p-4 border-2 border-gray-300 border-dashed rounded-lg">
                                                    <div className="text-center">
                                                        <FileUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                        <p className="text-sm text-gray-600">Drag and drop your file here or click to select</p>
                                                    </div>
                                                </FileInput>
                                                {field.value.length > 0 && (
                                                    <div className="mt-4 space-y-2">
                                                        {field.value.map((file, index) => (
                                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                                                                <div className="flex items-center space-x-2">
                                                                    {file.type.startsWith('video/') ? (
                                                                        <Video className="w-5 h-5 text-blue-500" />
                                                                    ) : (
                                                                        <Music className="w-5 h-5 text-green-500" />
                                                                    )}
                                                                    <span className="text-sm font-medium truncate" style={{ maxWidth: '200px' }}>
                                                                        {file.name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </FileUploader>
                                        </FormControl>
                                        <AnimatedErrorMessage message={form.formState.errors.files?.message} />
                                    </FormItem>
                                )}
                            />
                            <PulsingButton type="submit" className="w-full" isSubmitting={isSubmitting}>
                                {isSubmitting ? "Uploading" : <>
                                    <FileUp className="w-4 h-4 mr-2" />
                                    Upload File
                                </>}
                            </PulsingButton>
                        </form>
                    </Form>
                </CardContent>
                {videoSuccess && (
                    <CardFooter>
                        <div className="w-full p-4 text-green-700 bg-green-100 rounded-md">
                            File uploaded successfully!
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}

export default SaveFilesForm;