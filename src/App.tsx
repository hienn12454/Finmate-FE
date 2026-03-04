import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./routes/ScrollToTop";
import AiChatBot from "./components/AiChatBot";

function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <AiChatBot />
    </>
  );
}

export default App;
