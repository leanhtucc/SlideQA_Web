import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "src/apis/queryClient";
import { AuthProvider } from "src/contexts/AuthContext";
import Routes from "src/routes/routes";

const queryClient = createQueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app">
          <Routes />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
