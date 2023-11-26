import { createContext } from "react"
import TmdbProvider from "./TmdbProvider"
import UploadProvider from "./UploadProvider"
import AuthProvider from "./AuthProvider"
import { SnackbarProvider, enqueueSnackbar } from "notistack"
import DatabaseProvider from "./DatabaseProvider"

export const globalContext = createContext()

export default function GlobalProvider({ children }) {
    // const [loadingResponse, setLoadingResponse] = useState(false)


    const setResponse = (response) => {
        // setLoadingResponse(false)
        enqueueSnackbar(response.message, { variant: response.resStatus })
    }

    return (
        <globalContext.Provider value={{ setResponse }}>
            <SnackbarProvider>
                <AuthProvider>
                    <DatabaseProvider>
                        <UploadProvider>
                            <TmdbProvider>
                                {children}
                            </TmdbProvider>
                        </UploadProvider>
                    </DatabaseProvider>
                </AuthProvider>
            </SnackbarProvider>
        </globalContext.Provider>
    )
}
