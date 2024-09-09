import { useLocation, Link } from "wouter"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { PulsingButton } from "@/components/PulsingButton"
import { useClient } from 'urql'
import { AnimatedErrorMessage } from "@/components/AnimatedErrorMessage"
import { Form, FormField, FormLabel } from "@/components/ui/form"
import { signupSchema } from "@/schema"
import { handleFormErrors } from "@/utils/handleFormErrors"
import { Input } from "@/components/ui/input"
import useMainStore from "@/store"

const SignUpForm = () => {
    const client = useClient();
    const { signup, isSubmittingForm } = useMainStore();
    const [, navigate] = useLocation();
    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            companyName: "",
        },
    })

    const formFields = ["name", "email", "password", "companyName"] as const

    const onSubmit = async (data: z.infer<typeof signupSchema>) => {
        const formErrors = await signup(client, data)
        if (formErrors.length === 0) {
            navigate("/");
        } else {
            handleFormErrors(formErrors, form, formFields)
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Sign Up</h2>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <AnimatedErrorMessage message={form.formState.errors.root?.message} />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel htmlFor="name">Name</FormLabel>
                                    <Input id="name" autoComplete="name" placeholder="John Doe" {...field} />
                                    <AnimatedErrorMessage message={form.formState.errors.name?.message} />
                                </div>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel htmlFor="email">Email</FormLabel>
                                    <Input id="email" type="email" autoComplete="email" placeholder="john@example.com" {...field} />
                                    <AnimatedErrorMessage message={form.formState.errors.email?.message} />
                                </div>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel htmlFor="password">Password</FormLabel>
                                    <Input id="password" type="password" autoComplete="new-password" placeholder="********" {...field} />
                                    <AnimatedErrorMessage message={form.formState.errors.password?.message} />
                                </div>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <FormLabel htmlFor="companyName">Company Name</FormLabel>
                                    <Input id="companyName" autoComplete="organization" placeholder="Acme Inc." {...field} />
                                    <AnimatedErrorMessage message={form.formState.errors.companyName?.message} />
                                </div>
                            )}
                        />
                        <PulsingButton type="submit" className="w-full" isSubmitting={isSubmittingForm}>
                            {isSubmittingForm ? "Signing Up" : "Sign Up"}
                        </PulsingButton>
                    </form>
                </Form>
                <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm">Already have an account?</span>
                    <Link href="/login" className="text-sm hover:underline">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default SignUpForm;