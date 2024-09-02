import { FormError } from "@/types"
import { UseFormReturn, FieldValues, Path } from "react-hook-form"

export const handleFormErrors = <T extends FieldValues>(
    formErrors: FormError[],
    form: UseFormReturn<T>,
    formFields: readonly (keyof T)[]
) => {
    if (formErrors.length > 0) {
        formErrors.forEach((error: FormError) => {
            if (formFields.includes(error.field as keyof T)) {
                form.setError(error.field as Path<T>, { type: 'custom', message: error.message })
            } else {
                form.setError('root' as Path<T>, { type: 'custom', message: error.message })
            }
        })
    }
}