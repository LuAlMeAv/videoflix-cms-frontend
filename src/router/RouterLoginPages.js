import { Route, Routes } from "react-router-dom";
import UploadPage from "../pages/UploadPage";
import NotFoundPage from "../pages/NotFoundPage";
import MoviesPage from "../pages/MoviesPage";
import Navbar from "../components/Navbar";

export default function RouterLoginPages() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<UploadPage />} />
                <Route path="/movies" element={<MoviesPage />} />


                <Route path='*' element={<NotFoundPage />} />
            </Routes>
        </>
    )
}
