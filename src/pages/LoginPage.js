import { useContext } from "react"
import { authContext } from "../contexts/AuthProvider"

export default function LoginPage() {
    const { login, setLogin } = useContext(authContext)
    return (
        <>
            <h1>Login</h1>
            <button onClick={() => setLogin({ ...login, auth: true })}> get access </button>
        </>
    )
}
