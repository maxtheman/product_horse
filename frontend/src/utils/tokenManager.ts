export const tokenManager = {
    set: (token: string) => {
      document.cookie = `jwt=${token}; max-age=86400; domain=${window.location.hostname}; path=/; SameSite=Strict; Secure`;
    },
    get: () => document.cookie.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1],
    remove: () => {
      document.cookie = `jwt=; max-age=0; domain=${window.location.hostname}; path=/; SameSite=Strict; Secure`;
    }
  };
  