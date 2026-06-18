import { AdminProvider } from '@/context/AdminContext';
import AppRouter from '@/router';

export default function App() {
  return (
    <AdminProvider>
      <AppRouter />
    </AdminProvider>
  );
}
