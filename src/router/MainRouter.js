import { useContext } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { authContext } from '../contexts/AuthProvider'
import RouterLoginPages from './RouterLoginPages'
import RouterNoLoginPages from './RouterNoLoginPages'

export default function MainRouter() {
    const { login } = useContext(authContext)

    return (
        <BrowserRouter>
            {login.auth ?
                <RouterLoginPages />
                :
                <RouterNoLoginPages />
            }
        </BrowserRouter>
    )
}