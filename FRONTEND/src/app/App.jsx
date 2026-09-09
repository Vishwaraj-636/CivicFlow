import { useEffect } from 'react';
import './App.css'
import { RouterProvider } from 'react-router'
import { routes } from './app.routes.jsx'
import { useAuth } from '../features/auth/hook/useAuth';



function App() {
   const { handleGetCurrentUser } = useAuth();

   useEffect(() => {
      handleGetCurrentUser();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   return (
      <>
         <RouterProvider router={routes} />
      </>
   )
}

export default App
