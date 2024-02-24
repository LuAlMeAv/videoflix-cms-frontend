import { Route, Routes } from "react-router-dom";
import UploadPage from "../pages/UploadPage";
import NotFoundPage from "../pages/NotFoundPage";
import MoviesPage from "../pages/MoviesPage";
import Navbar from "../components/Navbar";
import SeriesPage from "../pages/SeriesPage";
import HomePage from "../pages/HomePage";
import ViewPage from "../pages/ViewPage";

export default function RouterLoginPages() {
    return (
        <Navbar children={
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/movies" element={<MoviesPage />} />
                <Route path="/series" element={<SeriesPage />} />
                <Route path="/view/:element_type/:id" element={<ViewPage />} />
                <Route path="/edit/:element_type/:id" element={<UploadPage />} />
                <Route path="/new/:element_type" element={<UploadPage />} />
                <Route path="/new/:element_type/:id_parent" element={<UploadPage />} />

                <Route path='*' element={<NotFoundPage />} />
            </Routes>
        } />
    )
}
