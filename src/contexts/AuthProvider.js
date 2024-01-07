import { createContext, useState } from "react"

export const authContext = createContext()

const initialStateLogin = {
    auth: true,
    level: 1000,
    token: "a1b2c3d4e5",
    id: "f6g7h8i9j0"
}

export default function AuthProvider({ children }) {
    const [login, setLogin] = useState(initialStateLogin)

    return (
        <authContext.Provider
            value={{
                login, setLogin
            }}
        >
            {children}
        </authContext.Provider>
    )
}