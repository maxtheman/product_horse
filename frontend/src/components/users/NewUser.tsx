import { useLocation } from "wouter"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { PulsingButton } from "@/components/PulsingButton"
import { useClient } from 'urql';
import { AnimatedErrorMessage } from "@/components/AnimatedErrorMessage"
import { Form, FormField, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { UserPlus, ArrowLeft } from "lucide-react"
import { FormItem, FormControl } from "@/components/ui/form"
import useMainStore from "@/store";
import { handleFormErrors } from "@/utils/handleFormErrors"

const userSchema = z.object({ userName: z.string().min(2), externalId: z.string().nullable() })

const NewUserForm = () => {
    const client = useClient();
    const { addUser, isSubmittingForm } = useMainStore();
    const [, navigate] = useLocation();
    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: { userName: "", externalId: null },
    })

    const onSubmit = async (data: z.infer<typeof userSchema>) => {
        const formErrors = await addUser(client, data)
        handleFormErrors(formErrors, form, ["userName", "externalId"])
        if (formErrors.length === 0) {
            form.reset()
        }
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
                                        <FormLabel htmlFor="userName">Name</FormLabel>
                                        <FormControl>
                                            <Input id="userName" placeholder="John Doe" {...field} value={field.value ?? ''} />
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
                                            <Input id="externalId" placeholder="crm_id_12345" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <AnimatedErrorMessage message={form.formState.errors.externalId?.message} />
                                    </FormItem>
                                )}
                            />
                            <PulsingButton type="submit" className="w-full" isSubmitting={isSubmittingForm}>
                                {isSubmittingForm ? "Saving" : <><UserPlus className="w-4 h-4 mr-2" />Save User</>}
                            </PulsingButton>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default NewUserForm;