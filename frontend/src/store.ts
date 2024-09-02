import { create } from "zustand";
import { Client, OperationResult } from "urql";
import { REGISTER_MUTATION, LOGIN_MUTATION } from "./graphql";
import { SignupFormData, LoginFormData, FormError } from "./types";


interface MainStore {
    authToken: string | null;
    isSubmittingForm: boolean;
    setAuthToken: (token: string) => void;
    getAuthToken: () => string | null;
    removeAuthToken: () => void;
    signup: (client: Client, data: SignupFormData) => Promise<FormError[]>;
    login: (client: Client, data: LoginFormData) => Promise<FormError[]>;
}

function handleForm<T>(result: OperationResult<T, object>, callback: (data: T) => void): FormError[] {
    let formErrors: FormError[] = []
    if (result.data) {
        callback(result.data)
        return formErrors
    }
    if (result.error) {
        try {
            formErrors = result.error.graphQLErrors.map((error) => ({ field: error.path?.[0].toString() || 'root', type: 'custom', message: error.message }));
            return formErrors
        } catch {
            formErrors = [{ field: 'root', type: 'custom', message: "An error occurred" }]
            return formErrors
        }
    }
    return formErrors
}

const useMainStore = create<MainStore>((set, get) => ({
    getAuthToken: () => {
        const token = document.cookie.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1];
        set({ authToken: token || '' });
        return token || null;
    },
    authToken: null,
    isSubmittingForm: false,
    setAuthToken: (token: string) => {
        set({ authToken: token });
    },
    removeAuthToken: () => {
        document.cookie = `jwt=; max-age=0; domain=${window.location.hostname}; path=/; SameSite=Strict; Secure`;
        set({ authToken: '' });
    },
    signup: async (client: Client, data: SignupFormData) => {
        set({ isSubmittingForm: true });
        const result = await client.mutation(REGISTER_MUTATION, data).toPromise();
        const formErrors = handleForm(result, (data) => {
            get().setAuthToken(data.registerCompanyAndEmployee.token)
        })
        set({ isSubmittingForm: false });
        return formErrors
    },
    login: async (client: Client, data: LoginFormData) => {
        set({ isSubmittingForm: true });
        const result = await client.mutation(LOGIN_MUTATION, data).toPromise();
        const formErrors = handleForm(result, (data) => {
            get().setAuthToken(data.LoginSuccess.token)
        })
        set({ isSubmittingForm: false });
        return formErrors
    },
}));

export default useMainStore;
