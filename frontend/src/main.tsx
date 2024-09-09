import { createRoot } from 'react-dom/client'
import { Client, cacheExchange, fetchExchange, Provider } from 'urql';
import useMainStore from '@/store';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import App from '@/App';
import '@/index.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/graphql';

useMainStore.getState().getAuthToken();

const client = new Client({
  url: API_URL,
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = useMainStore.getState().getAuthToken();
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
  suspense: true,
});

createRoot(document.getElementById('root')!).render(
  <Provider value={client}>
    <Suspense fallback={<Skeleton className="w-full h-full" />}>
      <App />
    </Suspense>
  </Provider>
)
