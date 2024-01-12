import { createContext, useState } from "react"
import { SnackbarProvider } from "notistack"
import DatabaseProvider from "./DatabaseProvider"
import FilesProvider from "./FilesProvider"
import TmdbProvider from "./TmdbProvider"
import AuthProvider from "./AuthProvider"

export const globalContext = createContext()

export default function GlobalProvider({ children }) {
    const [loadingResponse, setLoadingResponse] = useState(false)

    return (
        <globalContext.Provider value={{ loadingResponse, setLoadingResponse }}>
            <SnackbarProvider>
                <AuthProvider>
                    <DatabaseProvider>
                        <FilesProvider>
                            <TmdbProvider>
                                {children}
                            </TmdbProvider>
                        </FilesProvider>
                    </DatabaseProvider>
                </AuthProvider>
            </SnackbarProvider>
        </globalContext.Provider>
    )
}
