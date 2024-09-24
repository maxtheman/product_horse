import { GET_VIDEO_QUERY } from "./graphql";
import { useQuery } from 'urql';
import { useEffect, useState, lazy, Suspense } from "react";
import React from "react";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useLocation, Router, Switch, Route } from "wouter"
import { AnimatedErrorMessage } from "@/components/AnimatedErrorMessage";
// import {
//   Search,
//   PlusCircle,
// } from "lucide-react"
// import { z } from "zod"
// import { useMutation } from 'urql';
// import { GET_UTTERANCES_QUERY, GET_TRANSCRIPT_QUERY, CREATE_VIDEO_MUTATION } from "./graphql"
// import { toast } from "sonner"
// import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Input } from "@/components/ui/input"
// import { PulsingButton } from "@/components/PulsingButton";
// import { EmptyState } from "@/components/EmptyState";
// import { zodResolver } from "@hookform/resolvers/zod"
// import { useForm, Controller } from "react-hook-form"
import useMainStore from "@/store";
const LoginForm = lazy(() => import("@/components/auth/LoginForm"));
const SignUpForm = lazy(() => import("@/components/auth/SignupForm"));
const NewUserForm = lazy(() => import("@/components/users/NewUser"));
const Logout = lazy(() => import("@/components/auth/Logout"));
const UserList = lazy(() => import("@/components/users/UserList"));
const VideoJS = lazy(() => import("@/components/VideoJS"));
const SaveFilesForm = lazy(() => import("@/components/SaveFilesForm"));
const VideoEditor = lazy(() => import("@/components/video-editor"));
const Navigation = lazy(() => import("@/components/Navigation"));
const VideoList = lazy(() => import("@/components/video/VideoList"));
import type Player from 'video.js/dist/types/player';

// TODOS:
// - Add a progress bar to the uploader and move the upload logic to zustand state

// AUTHENTICATION


// GET UTTERANCES

// const utterancesSchema = z.object({
//   question: z.string().min(1),
//   transcriptIds: z.array(z.string()).nonempty()
// })


// interface Utterance {
//   id: string;
//   text: string;
//   words: { id: string }[];
// }

// const GetUtterancesForm = () => {
//   const [queryVariables, setQueryVariables] = useState<z.infer<typeof utterancesSchema> | null>(null)
//   const [transcriptsResult] = useQuery({ query: GET_TRANSCRIPT_QUERY })
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [selectedUtterances, setSelectedUtterances] = useState<Set<string>>(new Set());
//   const [utterancesResult] = useQuery({
//     query: GET_UTTERANCES_QUERY,
//     variables: queryVariables ?? {},
//     pause: !queryVariables
//   })
//   const [, createVideo] = useMutation(CREATE_VIDEO_MUTATION);
//   const [videoCreated, setVideoCreated] = useState(false);
//   const [, navigate] = useLocation();

//   const form = useForm<z.infer<typeof utterancesSchema>>({
//     resolver: zodResolver(utterancesSchema),
//     defaultValues: { question: "", transcriptIds: [] }
//   })

//   const onSubmit = async (data: z.infer<typeof utterancesSchema>) => {
//     setIsSubmitting(true);
//     setQueryVariables(data);

//     if (utterancesResult.data) {
//       const utterances = utterancesResult.data.getRelevantUtterances;
//       const utteranceSegments = utterances
//         .filter((u: Utterance) => selectedUtterances.has(u.id))
//         .map((u: Utterance) => ({
//           utteranceId: u.id,
//           wordIds: u.words.map((w: { id: string }) => w.id)
//         }));

//       if (utteranceSegments.length > 0) {
//         const result = await createVideo({
//           utteranceSegments,
//           title: data.question // Set the title to the query
//         });

//         if (result.data) {
//           setVideoCreated(true);
//           form.reset();
//           toast("Video job created successfully", {
//             description: "Your video is being processed. Check the video list for updates.",
//             action: {
//               label: "View Videos",
//               onClick: () => navigate("/videos"),
//             },
//             duration: 5000
//           });
//           navigate("/videos");
//         }
//         if (result.error) {
//           form.setError("root", { type: 'custom', message: result.error.graphQLErrors[0].message });
//         }
//       } else {
//         form.setError("root", { type: 'custom', message: "Please select at least one utterance" });
//       }
//     }

//     setIsSubmitting(false);
//   }

//   const toggleUtterance = (id: string) => {
//     setSelectedUtterances(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(id)) {
//         newSet.delete(id);
//       } else {
//         newSet.add(id);
//       }
//       return newSet;
//     });
//   }

//   const transcripts = transcriptsResult.data?.getTranscripts || []
//   const allTranscriptIds = transcripts.map((t: { id: string }) => t.id)
  
//   if (transcriptsResult.fetching) {
//     return (
//       <div className="container py-10 mx-auto space-y-4">
//         <Skeleton className="w-full h-10" />
//         <Skeleton className="w-full h-40" />
//         <Skeleton className="w-full h-10" />
//       </div>
//     );
//   }

//   return (
//     <div className="container py-10 mx-auto">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-3xl font-bold tracking-tight">Search for Clips</h1>
//         <Button onClick={() => navigate("/")}>
//           <PlusCircle className="w-4 h-4 mr-2" />
//           Upload Research
//         </Button>
//       </div>
//       {transcripts.length === 0 ? (
//         <EmptyState
//           showAddUser={false}
//           showUploadResearch={true}
//           showAskQuestion={false}
//         />
//       ) : (
//         <Card className="w-full">
//           <CardHeader>
//             <CardTitle>Ask a Question</CardTitle>
//             <CardDescription>Find relevant clips from your transcripts and create videos.</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                 <AnimatedErrorMessage message={form.formState.errors.root?.message} />
//                 <FormField
//                   control={form.control}
//                   name="question"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Question</FormLabel>
//                       <FormControl>
//                         <Input {...field} placeholder="Enter your question here" />
//                       </FormControl>
//                       <AnimatedErrorMessage message={form.formState.errors.question?.message} />
//                     </FormItem>
//                   )}
//                 />
//                 <FormItem>
//                   <FormLabel>Transcripts</FormLabel>
//                   <FormControl>
//                     <div className="p-2 space-y-2 overflow-y-auto border rounded-md max-h-60">
//                       <div className="flex items-center space-x-2">
//                         <Checkbox
//                           checked={form.watch('transcriptIds').length === allTranscriptIds.length}
//                           onCheckedChange={(checked) => {
//                             form.setValue('transcriptIds', checked ? allTranscriptIds : [])
//                           }}
//                         />
//                         <span>Select All</span>
//                       </div>
//                       {transcripts.map((transcript: { id: string, fileMetadata: { fileName: string } }) => (
//                         <div key={transcript.id} className="flex items-center space-x-2">
//                           <Controller
//                             name="transcriptIds"
//                             control={form.control}
//                             render={({ field }) => (
//                               <Checkbox
//                                 checked={field.value.includes(transcript.id)}
//                                 onCheckedChange={(checked) => {
//                                   const updatedIds = checked
//                                     ? [transcript.id, ...field.value]
//                                     : field.value.filter((id: string) => id !== transcript.id)
//                                   field.onChange(updatedIds)
//                                 }}
//                               />
//                             )}
//                           />
//                           <span>{transcript.fileMetadata.fileName ?? "No name provided"}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </FormControl>
//                   <AnimatedErrorMessage message={form.formState.errors.transcriptIds?.message} />
//                 </FormItem>
//                 <PulsingButton
//                   type="submit"
//                   className="w-full"
//                   isSubmitting={isSubmitting || utterancesResult.fetching}
//                 >
//                   {utterancesResult.fetching ? <>
//                     Loading Utterances
//                   </> : isSubmitting ? "Working" : <>
//                     <Search className="w-4 h-4 mr-2" />
//                     Get Utterances
//                   </>}
//                 </PulsingButton>
//               </form>
//             </Form>

//             {utterancesResult.data && (
//               <div className="mt-8">
//                 <h2 className="mb-4 text-xl font-semibold">Results:</h2>
//                 {utterancesResult.data.getRelevantUtterances.length === 0 ? (
//                   <p>No relevant utterances found. Try refining your question.</p>
//                 ) : (
//                   <>
//                     {utterancesResult.data.getRelevantUtterances.map((utterance: Utterance) => (
//                       <div key={utterance.id} className="flex items-center mt-2 space-x-2">
//                         <Checkbox
//                           checked={selectedUtterances.has(utterance.id)}
//                           onCheckedChange={() => toggleUtterance(utterance.id)}
//                         />
//                         <span>{utterance.text}</span>
//                       </div>
//                     ))}
//                     <Button
//                       onClick={form.handleSubmit(onSubmit)}
//                       disabled={isSubmitting || selectedUtterances.size === 0}
//                       className="w-full mt-4"
//                     >
//                       {isSubmitting
//                         ? "Creating Video"
//                         : selectedUtterances.size === 0
//                           ? "Select Clips to Create a Video"
//                           : "Create Video from Selected Clips"}
//                     </Button>
//                   </>
//                 )}
//               </div>
//             )}
//             {videoCreated && <p className="mt-4 text-green-500">Video job created successfully! Check the video list for updates.</p>}
//             {utterancesResult.error && <p className="mt-4 text-red-500">{utterancesResult.error.graphQLErrors[0].message}</p>}
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }

const VideoPlayer = ({ id }: { id: string }) => {
  const [result, reexecuteQuery] = useQuery({
    query: GET_VIDEO_QUERY,
    variables: { videoId: id }
  });
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [, navigate] = useLocation();

  const setActiveItemName = useMainStore((state) => state.setActiveItemName);

  const handlePlayerReady = (player: Player) => {
    setPlayer(player);

    player.on('timeupdate', () => {
      console.log('timeupdate', player.currentTime());
      const time = player.currentTime() || currentTime
      setCurrentTime(time);
    });

    player.on('loadedmetadata', () => {
      setDuration(player.duration() || 0);
    });

    player.on('error', () => {
      const errorMessage = player.error()?.message || 'Unknown error';
      setError(`Failed to load the video: ${errorMessage}`);
      reexecuteQuery({ requestPolicy: 'network-only' });
    });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
    };
  }, [player]);

  if (result.fetching) return (
    <div className="space-y-4">
      <Skeleton className="w-full h-8" />
      <Skeleton className="w-full h-[400px]" />
      <Skeleton className="w-full h-12" />
    </div>
  );
  if (result.error) return <AnimatedErrorMessage message={result.error.message} />;
  const { title, signedUrl, renderStatus } = result.data.getVideo;
  setActiveItemName(title);


  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [{
      src: signedUrl,
      type: 'video/mp4'
    }]
  };



  return (
    <div className="container py-10 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <Button variant="outline" onClick={() => navigate("/videos")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Videos
        </Button>
      </div>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Status: {renderStatus}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStatus === 'complete' && signedUrl && !error && (
            <div className="space-y-4">
              <Suspense fallback={<Skeleton className="w-full h-full" />}>
                <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
              </Suspense>
              <div className="flex items-center space-x-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => player?.paused() ? player?.play() : player?.pause()}
                  disabled={!player}
                >
                  {player?.paused() ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <span className="text-sm">{formatTime(currentTime)}</span>
                <Slider
                  min={0}
                  max={duration}
                  step={1}
                  value={[currentTime]}
                  onValueChange={(value) => player?.currentTime(value[0])}
                  className="w-full"
                  disabled={!player}
                />
                <span className="text-sm">{formatTime(duration)}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => player?.muted(!player.muted())}
                  disabled={!player}
                >
                  {player?.muted() ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[player?.volume() || 0]}
                  onValueChange={(value) => player?.volume(value[0])}
                  className="w-24"
                  disabled={!player}
                />
              </div>
            </div>
          )}
          {error && (
            <>
              <AnimatedErrorMessage message={error} />
              <p className="text-sm text-gray-600">
                Our streaming infrastructure is experiencing issues. We apologize for the inconvenience. Please try playing the video again or download it using the link below.
              </p>
            </>
          )}
          <div className="mt-4 space-y-4">
            <Button asChild>
              <a href={signedUrl} download={`${title}.mp4`}>
                Download Video
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AppRouter = ({ token }: { token: string }) => {
  const [, navigate] = useLocation();

  // Redirect to login if there's no token for protected routes
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
      if (!token) {
        navigate('/login');
      }
    }, []);
    return token ? <>{children}</> : null;
  };

  useEffect(() => {
    if (!token && !['/login', '/signup'].includes(window.location.pathname)) {
      navigate('/login');
    }
  }, [token, navigate]);

  if (!token) {
    return (
      <Switch>
        <Route path="/login" component={LoginForm} />
        <Route path="/signup" component={SignUpForm} />
      </Switch>
    );
  }

  return (
    <Suspense fallback={<Skeleton className="w-full h-full" />}>
      <Switch>
        <Route path="/">
          <ProtectedRoute>
            <UserList />
          </ProtectedRoute>
        </Route>
        <Route path="/users/:id">
          {(params) => (
            <ProtectedRoute>
              <SaveFilesForm userId={params.id} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/new-user">
          <ProtectedRoute>
            <NewUserForm />
          </ProtectedRoute>
        </Route>
        <Route path="/new-video">
          <ProtectedRoute>
            <VideoEditor />
          </ProtectedRoute>
        </Route>
        <Route path="/videos">
          <ProtectedRoute>
            <VideoList />
          </ProtectedRoute>
        </Route>
        <Route path="/videos/:id">
          {(params) => (
            <ProtectedRoute>
              <VideoPlayer id={params.id} />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/logout" component={Logout} />
        <Route>
          <div>Not Found</div>
        </Route>
      </Switch>
    </Suspense>
  );
};

// Update the App component
function App() {
  const token = useMainStore((state) => state.authToken);

  return (
    <Router>
      <div className="flex h-screen">
        {token && <Navigation />}
        <div className="flex items-center justify-center flex-1 overflow-hidden">
          <div className="overflow-visible bg-gray-50">
            <AppRouter token={token || ""} />
          </div>
        </div>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;