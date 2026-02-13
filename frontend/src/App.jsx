import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResendVerification from "./pages/ResendVerification";
import AdminDashboard from "./pages/AdminDashboard";
import PizzaBuilder from "./pages/PizzaBuilder";
import UserDashboard from "./pages/UserDashboard";
import { ToastProvider } from "./components/Toast";





const Dummy = ({ name }) => <h1 style={{ padding: 40 }}>{name}</h1>;

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
  <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/builder" element={<PizzaBuilder />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;






