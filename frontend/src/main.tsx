import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Client, cacheExchange, fetchExchange, Provider } from 'urql';
import useMainStore from '@/store';
import App from '@/App'
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

});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider value={client}>
      <App />
    </Provider>
  </StrictMode>,
)
