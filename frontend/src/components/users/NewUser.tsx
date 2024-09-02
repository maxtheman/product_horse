import { useLocation } from "wouter"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { PulsingButton } from "@/components/PulsingButton"
import { useMutation } from 'urql';
import { SAVE_USER_MUTATION } from "@/graphql";
import { AnimatedErrorMessage } from "@/components/AnimatedErrorMessage"
import { Form, FormField, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { UserPlus, ArrowLeft } from "lucide-react"
import { FormItem, FormControl } from "@/components/ui/form"

const userSchema = z.object({ userName: z.string().min(2), externalId: z.string().optional() })

const NewUserForm = () => {
    // Not saved to MainAppStore as this is a temporary form for adding a new user
    const [, saveUser] = useMutation(SAVE_USER_MUTATION)
    const [userId, setUserId] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [, navigate] = useLocation();
    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: { userName: "", externalId: "" },
    })

    const onSubmit = async (data: z.infer<typeof userSchema>) => {
        setIsSubmitting(true);
        const result = await saveUser(data)
        if (result.data) {
            setUserId(result.data.saveUser.id)
            form.reset()
            toast("User created successfully", {
                description: `User ID: ${result.data.saveUser.id}`,
                action: {
                    label: "View User",
                    onClick: () => navigate(`/users/${result.data.saveUser.id}`),
                },
            });
        }
        if (result.error) {
            form.setError("root", { type: 'custom', message: result.error.graphQLErrors[0].message })
        }
        setIsSubmitting(false);
    }

    return (
        <div className="container py-10 mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
                <Button variant="outline" onClick={() => navigate("/")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Contacts
                </Button>
            </div>
            <Card className="w-full max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>New Contact Details</CardTitle>
                    <CardDescription>Create a new contact profile to manage research and insights.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <AnimatedErrorMessage message={form.formState.errors.root?.message} />
                            <FormField
                                control={form.control}
                                name="userName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="userName">User Name</FormLabel>
                                        <FormControl>
                                            <Input id="userName" placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <AnimatedErrorMessage message={form.formState.errors.userName?.message} />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="externalId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="externalId">External ID (Optional)</FormLabel>
                                        <FormControl>
                                            <Input id="externalId" placeholder="crm_id_12345" {...field} />
                                        </FormControl>
                                        <AnimatedErrorMessage message={form.formState.errors.externalId?.message} />
                                    </FormItem>
                                )}
                            />
                            <PulsingButton type="submit" className="w-full" isSubmitting={isSubmitting}>
                                {isSubmitting ? "Saving..." : <><UserPlus className="w-4 h-4 mr-2" />Save User</>}
                            </PulsingButton>
                        </form>
                    </Form>
                </CardContent>
                {userId && (
                    <CardFooter>
                        <div className="w-full p-4 text-green-700 bg-green-100 rounded-md">
                            User Created! User ID: {userId}
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}

export default NewUserForm;