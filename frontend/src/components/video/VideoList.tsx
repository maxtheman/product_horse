import { useQuery } from 'urql';
import { useLocation } from 'wouter';
import { GET_ALL_VIDEOS_QUERY } from '@/graphql';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { AnimatedErrorMessage } from '@/components/AnimatedErrorMessage';
import { PlusCircle, Eye, RotateCcw, CircleDot } from 'lucide-react';

const VideoList = () => {

    const [result, refetch] = useQuery({ query: GET_ALL_VIDEOS_QUERY });
    // const client = useClient();
    const [, navigate] = useLocation();


    // don't need this right now, pick back up if you have more issues
    // useEffect(() => {
    //   if (shouldRefetchVideos) {
    //     refetch({ requestPolicy: 'network-only' });
    //   }
    // }, [shouldRefetchVideos, refetch]);

    if (result.fetching) return (
        <div className="space-y-2">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
        </div>
    );
    if (result.error) return <AnimatedErrorMessage message={result.error.message} />
    if (!result.data || !result.data.getAllVideos || result.data.getAllVideos.length === 0) {
        return (
            <div className="container py-10 mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
                    <Button onClick={() => navigate("/new-video")}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create Video
                    </Button>
                </div>
                <EmptyState showAddUser={false} showUploadResearch={false} showAskQuestion={true} />
            </div>
        );
    }

    return (
        <div className="container py-10 mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
                <Button onClick={() => navigate("/new-video")}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Video
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Video List</CardTitle>
                    <CardDescription>View and manage all your created videos. <br />
                        <span className="text-xs">If you don't see your video here, it may still be early in the processing pipeline.</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50%]">Title</TableHead>
                                <TableHead>Render Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.data.getAllVideos.map((video: { id: string; title: string; renderStatus: string }) => (
                                <TableRow key={video.id}>
                                    <TableCell className="font-medium">{video.title}</TableCell>
                                    <TableCell>
                                        <CircleDot className={`h-4 w-4 inline-block mr-2 ${video.renderStatus === 'complete' ? 'text-green-500' : 'text-yellow-500'}`} />
                                        {video.renderStatus}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" onClick={() => navigate(`/videos/${video.id}`)}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => refetch({ requestPolicy: 'network-only' })}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default VideoList;