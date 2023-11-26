import { createContext, useContext, useState } from "react"
import { globalContext } from "./GlobalProvider"

export const databaseContext = createContext()

export default function DatabaseProvider({ children }) {
    const { setResponse } = useContext(globalContext)

    const { REACT_APP_API_URL } = process.env
    // const REACT_APP_API_URL = 'http://192.168.1.222:5000'
    const [allMovies, setAllMovies] = useState([])

    const getAllMovies = async () => {
        await fetch(`${REACT_APP_API_URL}/db/all/movies`)
            .then(response => response.json())
            .then(response => setAllMovies(response))
            .catch(err => console.error(err))
    }

    const deleteMovie = async (id) => {
        await fetch(`${REACT_APP_API_URL}/movie/${id}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(response => setResponse(response))
            .catch(err => console.error(err))
    }

    return (
        <databaseContext.Provider
            value={{
                getAllMovies,
                allMovies,

                deleteMovie,
            }}
        >
            {children}
        </databaseContext.Provider>
    )
}
