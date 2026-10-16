import Shell from './components/Shell';
import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './pages/AuthScreen';

function Root() {
  const { user } = useApp();
  return user ? <Shell /> : <AuthScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
