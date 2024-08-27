import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Client, cacheExchange, fetchExchange, Provider } from 'urql';
import { tokenManager } from './utils/tokenManager';
import App from './App.tsx'
import './index.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/graphql';


const client = new Client({
  url: API_URL,
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = tokenManager.get();
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
