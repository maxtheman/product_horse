import { z } from "zod";
import { signupSchema, loginSchema } from "./schema";

export type SignupFormData = z.infer<typeof signupSchema>;
export type FormError = { field: string; type: string; message: string }
export type LoginFormData = z.infer<typeof loginSchema>;