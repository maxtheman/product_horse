import { create } from 'zustand'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { useMutation, useQuery } from 'urql';
import { useState } from "react";
// import { useEffect } from "react";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { REGISTER_MUTATION, SAVE_USER_MUTATION, GET_USERS_QUERY, SAVE_FILES_MUTATION, GET_UTTERANCES_QUERY, GET_TRANSCRIPT_QUERY, CREATE_VIDEO_MUTATION, GET_ALL_VIDEOS_QUERY, GET_VIDEO_QUERY } from "./graphql";
import { tokenManager } from "./utils/tokenManager";
import { Link, useRoute } from "wouter";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLocation, Router, Switch, Route } from "wouter"


// AUTHENTICATION

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
});

interface AuthStore {
  token: string;
  storeToken: (token: string) => void;
}
const useStore = create<AuthStore>((set) => ({
  token: tokenManager.get() ?? '',
  storeToken: (token: string) => {
    tokenManager.set(token);
    set({ token });
  },
}));

const SignUpForm = () => {
  const [, registerMutation] = useMutation(REGISTER_MUTATION);
  const storeToken = useStore((state) => state.storeToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      companyName: "",
    },
  })

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);
    const result = await registerMutation(data);
    if (result.data) {
      storeToken(result.data.registerCompanyAndEmployee.token);
    }
    if (result.error) {
      form.setError("root", { type: 'custom', message: result.error.graphQLErrors[0].message });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md space-y-4">
          {form.formState.errors.root && <p className="text-red-500">{form.formState.errors.root.message}</p>}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>Sign Up</Button>
        </form>
      </Form>
    </>
  )
}

// CREATE USERS AND FILES
const userSchema = z.object({ userName: z.string().min(2), externalId: z.string().optional() })

export function SaveUserForm() {
  const [, saveUser] = useMutation(SAVE_USER_MUTATION)
  const [userId, setUserId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { userName: "" },
  })

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    setIsSubmitting(true);
    const result = await saveUser(data)
    if (result.data) {
      setUserId(result.data.saveUser.id)
      form.reset()
      setIsSubmitting(false);
    }
    if (result.error) {
      form.setError("root", { type: 'custom', message: result.error.graphQLErrors[0].message })
    }
  }

  return (
    <>
      {userId && <p>User Created! User: {userId}</p>}
      <h1 className="text-2xl font-bold">Save User</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && <p className="text-red-500">{form.formState.errors.root.message}</p>}
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="externalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>External ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="crm_id_12345" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save User"}</Button>
        </form>
      </Form>
    </>
  )
}

const fileSchema = z.object({
  files: z.array(z.instanceof(File)).nonempty(),
  fileMetadata: z.object({
    fileType: z.enum(["VIDEO", "AUDIO"]),
    fileName: z.string().min(1),
    resolutionX: z.number().int().positive(),
    resolutionY: z.number().int().positive(),
    frameRate: z.number().positive(),
    duration: z.number().positive(),
  })
})

const UserList = () => {
  const [result] = useQuery({ query: GET_USERS_QUERY });
  const [, navigate] = useLocation();

  if (result.fetching) return <p>Loading...</p>;
  if (result.error) return <p>Error: {result.error.message}</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.data.getUsers.map((user: { id: string; name: string }) => (
          <TableRow key={user.id} onClick={() => navigate(`/users/${user.id}`)} className="cursor-pointer">
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.id}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export function SaveFilesForm({ userId }: { userId: string }) {
  const [, saveFiles] = useMutation(SAVE_FILES_MUTATION)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [videoSuccess, setVideoSuccess] = useState(false);
  const form = useForm<z.infer<typeof fileSchema>>({
    resolver: zodResolver(fileSchema),
    defaultValues: { files: [], fileMetadata: { fileType: "VIDEO", resolutionX: 1920, resolutionY: 1080, frameRate: 24, duration: 0 } },
  })


  const detectFileMetadata = (file: File) => {
    return new Promise<z.infer<typeof fileSchema>['fileMetadata']>((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          fileType: file.type.startsWith('video/') ? 'VIDEO' : 'AUDIO',
          resolutionX: video.videoWidth,
          resolutionY: video.videoHeight,
          frameRate: video.mozFrameRate || video.webkitFrameRate || 24,
          duration: video.duration,
          fileName: file.name,
        });
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const metadata = await detectFileMetadata(files[0]);
      form.setValue('files', files as [File, ...File[]]);
      form.setValue('fileMetadata', metadata);
    }
  };

  const onSubmit = async (data: z.infer<typeof fileSchema>) => {
    setIsSubmitting(true)
    const result = await saveFiles({ ...data, userId })
    if (result.data) {
      setVideoSuccess(true);
      form.reset();
    }
    if (result.error) {
      form.setError("root", { type: 'custom', message: result.error.graphQLErrors[0].message })
    }
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {videoSuccess && <p className="text-green-500">Video saved successfully!</p>}
        {form.formState.errors.root && <p className="text-red-500">{form.formState.errors.root.message}</p>}
        <FormField
          control={form.control}
          name="files"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Files</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="video/*,audio/*"
                  multiple
                  onChange={(e) => {
                    console.log("value", value);
                    onFileChange(e);
                    onChange(e.target.files);
                  }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Files"}</Button>
      </form>
    </Form>
  )
}

// GET UTTERANCES

const utterancesSchema = z.object({
  question: z.string().min(1),
  transcriptIds: z.array(z.string()).nonempty()
})

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

  const onSubmit = async (data: z.infer<typeof utterancesSchema>) => {
    setIsSubmitting(true);
    setQueryVariables(data);

    if (utterancesResult.data) {
      const utterances = utterancesResult.data.getRelevantUtterances;
      const utteranceSegments = utterances
        .filter((u: any) => selectedUtterances.has(u.id))
        .map((u: any) => ({
          utteranceId: u.id,
          wordIds: u.words.map((w: any) => w.id)
        }));

      if (utteranceSegments.length > 0) {
        const result = await createVideo({
          utteranceSegments,
          title: data.question // Set the title to the query
        });

        if (result.data) {
          setVideoCreated(true);
          setTimeout(() => {
            navigate(`/videos/${result.data.createVideoFromUtterances.id}`);
          }, 1000);
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

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Transcripts</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Checkbox
                  checked={form.watch('transcriptIds').length === allTranscriptIds.length}
                  onCheckedChange={(checked) => {
                    form.setValue('transcriptIds', checked ? allTranscriptIds : [])
                  }}
                />
                <span>Select All</span>
                {transcripts.length === 0 && <Skeleton className="w-full h-4" />}
                {transcripts.length === 0 && <Skeleton className="w-full h-4" />}
                {transcripts.length === 0 && <Skeleton className="w-full h-4" />}
                {transcripts.length === 0 && <Skeleton className="w-full h-4" />}
                {transcripts.length === 0 && <Skeleton className="w-full h-4" />}
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
            <FormMessage />
          </FormItem>
          <Button
            type="submit"
            disabled={isSubmitting || utterancesResult.fetching}
          >
            {utterancesResult.fetching ? "Loading Utterances..." : isSubmitting ? "Working..." : "Get Utterances"}
          </Button>
        </form>
      </Form>
      {utterancesResult.data && (
        <div className="flex flex-col w-full mt-4">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || selectedUtterances.size === 0}
            className="mt-4"
          >
            {isSubmitting
              ? "Creating Video, make take 5-10 minutes. Feel free to leave and come back later."
              : selectedUtterances.size === 0
                ? "Select Utterances below to Create a Video"
                : "Create Video from Selected Utterances"}
          </Button>
          <h2 className="text-xl font-bold">Results:</h2>
          {utterancesResult.data.getRelevantUtterances.map((utterance: any) => (
            <div key={utterance.id} className="flex items-center mt-2 space-x-2">
              <Checkbox
                checked={selectedUtterances.has(utterance.id)}
                onCheckedChange={() => toggleUtterance(utterance.id)}
              />
              <span>{utterance.text}</span>
            </div>
          ))}
        </div>
      )}
      {videoCreated && <p className="text-green-500">Video created successfully!</p>}
      {utterancesResult.error && <p className="mt-4 text-red-500">{utterancesResult.error.graphQLErrors[0].message}</p>}
    </>
  )
}

// CREATE AND GET VIDEO
const VideoList = () => {
  const [result] = useQuery({ query: GET_ALL_VIDEOS_QUERY });
  const [, navigate] = useLocation();

  if (result.fetching) return <p>Loading...</p>;
  if (result.error) return <p>Error: {result.error.message}</p>;
  if (!result.data || !result.data.getAllVideos) return <p>No videos found.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Render Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.data.getAllVideos.map((video: { id: string; title: string; renderStatus: string }) => (
          <TableRow key={video.id} onClick={() => navigate(`/videos/${video.id}`)} className="cursor-pointer">
            <TableCell>{video.title}</TableCell>
            <TableCell>{video.renderStatus}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const VideoPlayer = ({ id }: { id: string }) => {
  const [result] = useQuery({
    query: GET_VIDEO_QUERY,
    variables: { videoId: id }
  });

  if (result.fetching) return <p>Loading...</p>;
  if (result.error) return <p>Error: {result.error.message}</p>;

  const { title, signedUrl, renderStatus } = result.data.getVideo;

  return (
    <div className="flex flex-col items-center">
      <h1>{title}</h1>
      <p>Status: {renderStatus}</p>
      {renderStatus === 'complete' && signedUrl && (
        <video controls src={signedUrl} className="w-full max-w-3xl">
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};


// Nav and Routing
const routes = [
  { path: "/", label: "Users" },
  { path: "/new-user", label: "New User" },
  { path: "/utterances", label: "Search Utterances" },
  { path: "/videos", label: "Videos" },
  { path: "/logout", label: "Logout" },
];

const Navigation = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem className='pl-4 text-2xl font-bold'>
          🐴
        </NavigationMenuItem>
        {routes.map((route) => (
          <NavigationMenuItem key={route.path}>
            <Link href={route.path}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {route.label}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const Logout = () => {
  const storeToken = useStore((state) => state.storeToken);
  storeToken("");
  tokenManager.remove();
  return <>Logging out...</>
}
const AppRouter = () => {
  return (
    <Switch>
      <Route path="/" component={UserList} />
      <Route path="/users/:id">
        {(params) => <SaveFilesForm userId={params.id} />}
      </Route>
      <Route path="/new-user" component={SaveUserForm} />
      <Route path="/utterances" component={GetUtterancesForm} />
      <Route path="/videos" component={VideoList} />
      <Route path="/videos/:id">
        {(params) => <VideoPlayer id={params.id} />}
      </Route>
      <Route path="/logout" component={Logout} />
      <Route>
        <div>Not Found</div>
      </Route>
    </Switch>
  );
};

// Update the App component
function App() {
  const token = useStore((state) => state.token);
  return (
    <Router>
      {token ? <Navigation /> : null}
      <div className="flex flex-col p-4">
        {token ? <AppRouter /> : <SignUpForm />}
      </div>
    </Router>
  );
}
export default App;
