import { create } from "zustand";
import { Client, OperationResult } from "urql";
import {
    REGISTER_MUTATION,
    LOGIN_MUTATION,
    GET_USERS_QUERY,
    SAVE_USER_MUTATION
} from "./graphql";
import { SignupFormData, LoginFormData, FormError } from "./types";

interface User {
    id: string;
    name: string;
}

interface Users {
    loaded: boolean;
    users: User[];
    errors: string[] | null;
}

interface UserFormData {
    userName: string;
    externalId: string | null;
}

interface MainStore {
    authToken: string | null;
    isSubmittingForm: boolean;
    setAuthToken: (token: string) => void;
    getAuthToken: () => string | null;
    removeAuthToken: () => void;
    signup: (client: Client, data: SignupFormData) => Promise<FormError[]>;
    login: (client: Client, data: LoginFormData) => Promise<FormError[]>;
    users: Users;
    activeItemName: string;
    setActiveItemName: (name: string) => void;
    getUsers: (client: Client) => Promise<void>;
    addUser: (client: Client, data: UserFormData) => Promise<FormError[]>;
    navExpanded: boolean;
    setNavExpanded: (expanded: boolean) => void;
    shouldRefetchUsers: boolean;
    setShouldRefetchUsers: (value: boolean) => void;
}

function handleForm<T>(result: OperationResult<T, object>, callback: (data: T) => void): FormError[] {
    let formErrors: FormError[] = []
    if (result.data) {
        callback(result.data)
        return formErrors
    }
    if (result.error) {
        try {
            console.log(result.error.graphQLErrors)
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
        document.cookie = `jwt=${token}; max-age=86400; domain=${window.location.hostname}; path=/; SameSite=Strict; Secure`;
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
            const token = data.login.token || data.LoginSuccess.token
            get().setAuthToken(token)
        })
        set({ isSubmittingForm: false });
        if (formErrors.length === 0) {
            get().getUsers(client).catch(console.error);
        }
        return formErrors
    },
    users: {
        loaded: false,
        users: [],
        errors: null
    },
    activeItemName: "",
    setActiveItemName: (name: string) => {
        set({ activeItemName: name });
    },
    getUsers: async (client: Client) => {
        set({ users: { loaded: false, users: [], errors: null } });
        const result = await client.query(GET_USERS_QUERY, {}).toPromise();
        console.log(result) // might be a more efficient way to do this, check the result for more attributes
        set({ users: {
            loaded: true,
            users: result?.data?.getUsers || [],
            errors: result?.error?.graphQLErrors.map((error) => error.message) || null
        }, shouldRefetchUsers: false});
    },
    addUser: async (client: Client, data: UserFormData) => {
        set({ isSubmittingForm: true });
        const result = await client.mutation(SAVE_USER_MUTATION, data).toPromise();
        const formErrors = handleForm(result, async () => {
            set((state) => ({
                users: {
                  ...state.users,
                  users: [...state.users.users, result?.data?.saveUser]
                },
                shouldRefetchUsers: true
            }));
        });
        set({ isSubmittingForm: false });
        return formErrors;
    },
    navExpanded: false,
    setNavExpanded: (expanded) => set({ navExpanded: expanded }),
    shouldRefetchUsers: false,
    setShouldRefetchUsers: (value: boolean) => set({ shouldRefetchUsers: value }),
}));

export default useMainStore;
