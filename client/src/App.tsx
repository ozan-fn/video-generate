import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Video from "./pages/Video";
import GeneratedVideos from "./pages/GeneratedVideos";
import Sessions from "./pages/Sessions";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/video" element={<Video />} />
                <Route path="/generated-videos" element={<GeneratedVideos />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </Router>
    );
};

export default App;
