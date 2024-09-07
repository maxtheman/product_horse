import { GET_UTTERANCES_QUERY, GET_TRANSCRIPT_QUERY, CREATE_VIDEO_MUTATION, GET_ALL_VIDEOS_QUERY, GET_VIDEO_QUERY } from "./graphql";
import { useMutation, useQuery } from 'urql';
import { useEffect, useState, lazy, Suspense } from "react";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils"
import {
  Users,
  UserPlus,
  Search,
  Video,
  LogOut,
  CircleDot,
  PlusCircle,
  Eye,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  LucideIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLocation, Router, Switch, Route, Link } from "wouter"
import { PulsingButton } from "@/components/PulsingButton";
import { AnimatedErrorMessage } from "@/components/AnimatedErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import useMainStore from "@/store";
const LoginForm = lazy(() => import("@/components/auth/LoginForm"));
const SignUpForm = lazy(() => import("@/components/auth/SignupForm"));
const NewUserForm = lazy(() => import("@/components/users/NewUser"));
const Logout = lazy(() => import("@/components/auth/Logout"));
const UserList = lazy(() => import("@/components/users/UserList"));
const VideoJS = lazy(() => import("@/components/VideoJS"));
const SaveFilesForm = lazy(() => import("@/components/SaveFilesForm"));
import type Player from 'video.js/dist/types/player';

// TODOS:
// - Add a progress bar to the uploader and move the upload logic to zustand state

// AUTHENTICATION


// GET UTTERANCES

const utterancesSchema = z.object({
  question: z.string().min(1),
  transcriptIds: z.array(z.string()).nonempty()
})


interface Utterance {
  id: string;
  text: string;
  words: { id: string }[];
}

const GetUtterancesForm = () => {
  const [queryVariables, setQueryVariables] = useState<z.infer<typeof utterancesSchema> | null>(null)
  const [transcriptsResult] = useQuery({ query: GET_TRANSCRIPT_QUERY })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUtterances, setSelectedUtterances] = useState<Set<string>>(new Set());
  const [utterancesResult] = useQuery({
    query: GET_UTTERANCES_QUERY,
    variables: queryVariables ?? {},
    pause: !queryVariables
  })
  const [, createVideo] = useMutation(CREATE_VIDEO_MUTATION);
  const [videoCreated, setVideoCreated] = useState(false);
  const [, navigate] = useLocation();

  const form = useForm<z.infer<typeof utterancesSchema>>({
    resolver: zodResolver(utterancesSchema),
    defaultValues: { question: "", transcriptIds: [] }
  })
  // https://db59eb944db359472048f5e9a5dbc7d7.r2.cloudflarestorage.com

  const onSubmit = async (data: z.infer<typeof utterancesSchema>) => {
    setIsSubmitting(true);
    setQueryVariables(data);

    if (utterancesResult.data) {
      const utterances = utterancesResult.data.getRelevantUtterances;
      const utteranceSegments = utterances
        .filter((u: Utterance) => selectedUtterances.has(u.id))
        .map((u: Utterance) => ({
          utteranceId: u.id,
          wordIds: u.words.map((w: { id: string }) => w.id)
        }));

      if (utteranceSegments.length > 0) {
        const result = await createVideo({
          utteranceSegments,
          title: data.question // Set the title to the query
        });

        if (result.data) {
          setVideoCreated(true);
          form.reset();
          toast("Video job created successfully", {
            description: "Your video is being processed. Check the video list for updates.",
            action: {
              label: "View Videos",
              onClick: () => navigate("/videos"),
            },
            duration: 5000
          });
          navigate("/videos");
        }
        if (result.error) {
          form.setError("root", { type: 'custom', message: result.error.graphQLErrors[0].message });
        }
      } else {
        form.setError("root", { type: 'custom', message: "Please select at least one utterance" });
      }
    }

    setIsSubmitting(false);
  }

  const toggleUtterance = (id: string) => {
    setSelectedUtterances(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  const transcripts = transcriptsResult.data?.getTranscripts || []
  const allTranscriptIds = transcripts.map((t: { id: string }) => t.id)

  if (transcriptsResult.fetching) {
    return (
      <div className="container py-10 mx-auto space-y-4">
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-40" />
        <Skeleton className="w-full h-10" />
      </div>
    );
  }

  return (
    <div className="container py-10 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Search for Clips</h1>
        <Button onClick={() => navigate("/")}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Upload Research
        </Button>
      </div>
      {transcripts.length === 0 ? (
        <EmptyState
          showAddUser={false}
          showUploadResearch={true}
          showAskQuestion={false}
        />
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
            <CardDescription>Find relevant clips from your transcripts and create videos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <AnimatedErrorMessage message={form.formState.errors.root?.message} />
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your question here" />
                      </FormControl>
                      <AnimatedErrorMessage message={form.formState.errors.question?.message} />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Transcripts</FormLabel>
                  <FormControl>
                    <div className="p-2 space-y-2 overflow-y-auto border rounded-md max-h-60">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.watch('transcriptIds').length === allTranscriptIds.length}
                          onCheckedChange={(checked) => {
                            form.setValue('transcriptIds', checked ? allTranscriptIds : [])
                          }}
                        />
                        <span>Select All</span>
                      </div>
                      {transcripts.map((transcript: { id: string, fileMetadata: { fileName: string } }) => (
                        <div key={transcript.id} className="flex items-center space-x-2">
                          <Controller
                            name="transcriptIds"
                            control={form.control}
                            render={({ field }) => (
                              <Checkbox
                                checked={field.value.includes(transcript.id)}
                                onCheckedChange={(checked) => {
                                  const updatedIds = checked
                                    ? [transcript.id, ...field.value]
                                    : field.value.filter((id: string) => id !== transcript.id)
                                  field.onChange(updatedIds)
                                }}
                              />
                            )}
                          />
                          <span>{transcript.fileMetadata.fileName ?? "No name provided"}</span>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <AnimatedErrorMessage message={form.formState.errors.transcriptIds?.message} />
                </FormItem>
                <PulsingButton
                  type="submit"
                  className="w-full"
                  isSubmitting={isSubmitting || utterancesResult.fetching}
                >
                  {utterancesResult.fetching ? <>
                    Loading Utterances
                  </> : isSubmitting ? "Working" : <>
                    <Search className="w-4 h-4 mr-2" />
                    Get Utterances
                  </>}
                </PulsingButton>
              </form>
            </Form>

            {utterancesResult.data && (
              <div className="mt-8">
                <h2 className="mb-4 text-xl font-semibold">Results:</h2>
                {utterancesResult.data.getRelevantUtterances.length === 0 ? (
                  <p>No relevant utterances found. Try refining your question.</p>
                ) : (
                  <>
                    {utterancesResult.data.getRelevantUtterances.map((utterance: Utterance) => (
                      <div key={utterance.id} className="flex items-center mt-2 space-x-2">
                        <Checkbox
                          checked={selectedUtterances.has(utterance.id)}
                          onCheckedChange={() => toggleUtterance(utterance.id)}
                        />
                        <span>{utterance.text}</span>
                      </div>
                    ))}
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isSubmitting || selectedUtterances.size === 0}
                      className="w-full mt-4"
                    >
                      {isSubmitting
                        ? "Creating Video"
                        : selectedUtterances.size === 0
                          ? "Select Clips to Create a Video"
                          : "Create Video from Selected Clips"}
                    </Button>
                  </>
                )}
              </div>
            )}
            {videoCreated && <p className="mt-4 text-green-500">Video job created successfully! Check the video list for updates.</p>}
            {utterancesResult.error && <p className="mt-4 text-red-500">{utterancesResult.error.graphQLErrors[0].message}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// CREATE AND GET VIDEO
const VideoList = () => {
  const [result, refetch] = useQuery({ query: GET_ALL_VIDEOS_QUERY });
  const [, navigate] = useLocation();

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
          <Button onClick={() => navigate("/utterances")}>
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
        <Button onClick={() => navigate("/utterances")}>
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

// Nav and Routing

interface Route {
  path: string;
  label: string;
  icon: LucideIcon;
  isDynamic?: boolean;
}

const routes: Route[] = [
  { path: "/", label: "Contacts", icon: Users },
  { path: "/new-user", label: "New Contact", icon: UserPlus },
  { path: "/utterances", label: "Search for Clips", icon: Search },
  { path: "/videos", label: "Videos", icon: Video },
  { path: "/logout", label: "Logout", icon: LogOut },
];

const Navigation = () => {
  const [location] = useLocation();
  const [activeItem, setActiveItem] = useState("/");
  const [currentRoutes, setCurrentRoutes] = useState(routes);

  useEffect(() => {
    setActiveItem(location);

    const updatedRoutes = [...routes];
    const userMatch = location.match(/^\/users\/([^/]+)/);
    const videoMatch = location.match(/^\/videos\/([^/]+)/);

    if (userMatch) {
      const userId = userMatch[1];
      const userIndex = updatedRoutes.findIndex(route => route.path === "/");
      if (userIndex !== -1) {
        updatedRoutes.splice(userIndex + 1, 0, {
          path: `/users/${userId}`,
          label: `Users > ${userId.substring(0, 10)}...`,
          icon: Users,
          isDynamic: true
        });
      }
    }

    if (videoMatch) {
      const videoId = videoMatch[1];
      const videoIndex = updatedRoutes.findIndex(route => route.path === "/videos");
      if (videoIndex !== -1) {
        updatedRoutes.splice(videoIndex + 1, 0, {
          path: `/videos/${videoId}`,
          label: `Videos > ${videoId.substring(0, 10)}...`,
          icon: Video,
          isDynamic: true
        });
      }
    }

    setCurrentRoutes(updatedRoutes);
  }, [location]);

  const NavItem = ({ icon: Icon, children, path, isActive, isDynamic }: {
    icon: LucideIcon;
    children: React.ReactNode;
    path: string;
    isActive: boolean;
    isDynamic: boolean;
  }) => {
    const content = (
      <NavigationMenuItem className="w-full">
        <Link href={path} className="w-full">
          <NavigationMenuLink
            className={cn(
              navigationMenuTriggerStyle(),
              "w-full justify-start",
              isActive && "bg-accent",
              path === "/logout" && "text-muted-foreground",
              isDynamic ? "ml-5" : ""
            )}
          >
            <Icon className="w-4 h-4 mr-2" />
            {children}
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
    );

    return isDynamic ? (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20, transition: { duration: 0.1 } }}  // Faster exit
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {content}
      </motion.div>
    ) : content;
  };

  return (
    <NavigationMenu orientation="vertical" className="max-w-[200px] w-full overflow-hidden flex flex-col justify-start border-r h-full">
      <NavigationMenuList className="flex flex-col items-start flex-grow w-full p-2 space-y-1">
        <NavigationMenuItem className="pl-4 mt-6 mb-4 text-2xl font-bold">
          🐴
        </NavigationMenuItem>
        <AnimatePresence>
          {currentRoutes.map((route) => (
            <NavItem
              key={route.path}
              icon={route.icon}
              path={route.path}
              isActive={
                route.path === '/'
                  ? activeItem === '/'
                  : activeItem.startsWith(route.path)
              }
              isDynamic={route.isDynamic || false}
            >
              {route.label}
            </NavItem>
          ))}
        </AnimatePresence>
      </NavigationMenuList>
    </NavigationMenu>
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
        <Route path="/utterances">
          <ProtectedRoute>
            <GetUtterancesForm />
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
        {token ? <Navigation /> : null}
        <div className="flex-1 p-4 overflow-auto bg-gray-50">
          <AppRouter token={token || ""} />
        </div>
        <Toaster />
      </div>
    </Router>
  );
}
export default App;