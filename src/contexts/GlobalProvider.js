import { createContext } from "react"
import TmdbProvider from "./TmdbProvider"
import UploadProvider from "./UploadProvider"
import AuthProvider from "./AuthProvider"
import { SnackbarProvider } from "notistack"

const globalContext = createContext()

export default function GlobalProvider({ children }) {
    return (
        <globalContext.Provider value>
            <SnackbarProvider>
                <AuthProvider>
                    <UploadProvider>
                        <TmdbProvider>
                            {children}
                        </TmdbProvider>
                    </UploadProvider>
                </AuthProvider>
            </SnackbarProvider>
        </globalContext.Provider>
    )
}
