import { Route, Routes } from "react-router-dom";
import UploadPage from "../pages/UploadPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function RouterLoginPages() {
    return (
        <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path='*' element={<NotFoundPage />} />
        </Routes>
    )
}
