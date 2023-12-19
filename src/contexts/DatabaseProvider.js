import { createContext, useState } from "react"

export const databaseContext = createContext()

export default function DatabaseProvider({ children }) {

    const { REACT_APP_API_URL } = process.env
    // const REACT_APP_API_URL = 'http://192.168.1.222:5000'
    const [allMovies, setAllMovies] = useState([])

    const getAllMovies = () => {
        fetch(`${REACT_APP_API_URL}/db/all/movies`)
            .then(async (res) => {
                const response = await res.json()
                getOnlineVideo(response)
            })
            .catch(err => console.error(err))
    }
    const getOnlineVideo = async (movies) => {
        const example = await Promise.all(movies.map(async (movie) => {
            const videoID = movie.video_path.split('/').reverse()[0] || undefined

            return await fetch(`${REACT_APP_API_URL}/online/file/${videoID}`)
                .then(async res => {
                    const response = await res.json()
                    return { ...movie, video_status: response.resStatus }
                })
        }))
        setAllMovies(example)
    }

    const deleteMovie = async (id) => {
        return await fetch(`${REACT_APP_API_URL}/movie/${id}`, {
            method: 'DELETE'
        })
            .then(async (res) => {
                const response = await res.json()
                getAllMovies()
                return response
            })
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
