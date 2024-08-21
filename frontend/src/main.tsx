import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Client, cacheExchange, fetchExchange, Provider } from 'urql';
import { tokenManager } from './utils/tokenManager';
import App from './App.tsx'
import './index.css'

const client = new Client({
  url: 'https://product-horse-api.fly.dev/graphql',
  // url: 'http://127.0.0.1:8000/graphql',
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
