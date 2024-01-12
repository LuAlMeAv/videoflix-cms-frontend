import { createContext, useContext, useState } from "react"
import { globalContext } from "./GlobalProvider"

export const databaseContext = createContext()

const formInitialState = {
    title: "",
    original_title: "",
    tagline: "",
    season: "",
    episode: "",
    episode_name: "",
    episode_number: "",
    season_number: "",
    year: "",
    certification: "",
    duration: "",
    genres: "",
    genre_ids: "",
    online: false,
    overview: "",
    backdrop_path: "",
    poster_path: "",
    video_path: "",
    video_duration: "",
    video_duration_formated: "",
    video_start: "",
    video_end: "",
    video_start_intro: "",
    video_end_intro: ""
}

export default function DatabaseProvider({ children }) {
    const { setLoadingResponse } = useContext(globalContext)
    const { REACT_APP_API_URL } = process.env

    // const REACT_APP_API_URL = 'http://192.168.1.222:5000'
    const [searchType, setSearchType] = useState("movie")
    const [elementType, setElementType] = useState("movie")
    const [dataForm, setDataForm] = useState(formInitialState)
    const [allMovies, setAllMovies] = useState([])

    ////--- POST
    const saveData = async (data) => {
        setLoadingResponse(true)

        data.unique_title = uniqueTitle()
        delete data.id

        if (elementType === 'serie') {
            data.seasons = []
        }
        if (elementType === 'season') {
            data.episodes = []
        }

        return fetch(`${REACT_APP_API_URL}/db/new/${elementType}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(thenFuntion)
            .catch(catchFuntion)
    }

    ////--- GET
    const getAllMovies = () => {
        setLoadingResponse(true)
        fetch(`${REACT_APP_API_URL}/db/all/movies`)
            .then(async (res) => {
                const response = await res.json()
                const result = await getOnlineVideo(response)
                setAllMovies(result)
                setLoadingResponse(false)
            })
            .catch(catchFuntion)
    }
    const getElementByName = async () => {
        setLoadingResponse(true)
        return fetch(`${REACT_APP_API_URL}/db/${elementType}/t/${uniqueTitle()}`)
            .then(thenFuntion)
            .catch(catchFuntion)
    }
    const getElementById = async (save_type, id) => {
        setLoadingResponse(true)
        return fetch(`${REACT_APP_API_URL}/db/${save_type}/${id}`)
            .then(thenFuntion)
            .catch(catchFuntion)
    }
    const getOnlineVideo = async (elements) => {
        const videosOnline = await Promise.all(elements.map(async (element) => {
            if (!element.video_path) {
                return { ...element, video_status: 'error' }
            }

            return await fetch(`${REACT_APP_API_URL}/file/online/${element.video_path}`)
                .then(async (res) => {
                    const response = await res.json()

                    if (response.resStatus === 'success') {
                        return { ...element, video_status: response.resStatus }
                    }

                    // If the file doesn't exist on disk, video_path is updated to null
                    updateData({ video_path: '' }, element._id)
                    return { ...element, video_status: 'error' }
                })
                .catch(catchFuntion)
        }))

        return videosOnline
    }

    ////--- PUT
    const updateData = async (newData, id) => {
        setLoadingResponse(true)
        return fetch(`${REACT_APP_API_URL}/db/${elementType}/${id || dataForm._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        })
            .then(thenFuntion)
            .catch(catchFuntion)
    }

    ////--- DELETE
    const deleteData = async (element_type, id) => {
        setLoadingResponse(true)
        return fetch(`${REACT_APP_API_URL}/db/${element_type}/${id}`, {
            method: 'DELETE'
        })
            .then(async (res) => {
                getAllMovies()
                setLoadingResponse(false)
                return await res.json()
            })
            .catch(catchFuntion)
    }

    const clearData = () => setDataForm(formInitialState)

    const uniqueTitle = () => {
        const { title, year, season_number, episode_number } = dataForm;

        if (title === "") {
            return undefined
        }

        const clear_accents = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const clear_symbols = clear_accents.replace(/[^a-zA-Z0-9 ]/g, '')
        const clear_spaces = clear_symbols.replaceAll(" ", "_")

        const video_name = {
            'movie': `${clear_spaces}-${year}-movie`,
            'serie': `${clear_spaces}-${year}-serie`,
            'season': `${clear_spaces}-s${season_number < 10 ? "0" : ""}${season_number * 1}`,
            'episode': `${clear_spaces}-s${season_number < 10 ? "0" : ""}${season_number * 1}e${episode_number < 10 ? "0" : ""}${episode_number * 1}`,
        }

        return video_name[elementType].toLowerCase()
    }

    const thenFuntion = async (res) => {
        setLoadingResponse(false)
        return await res.json()
    }
    const catchFuntion = async (err) => {
        setLoadingResponse(false)
        console.error(err)
    }

    return (
        <databaseContext.Provider
            value={{
                searchType, setSearchType,
                elementType, setElementType,
                dataForm, setDataForm,
                allMovies,

                getAllMovies,
                getElementByName,
                getElementById,

                saveData,
                updateData,
                deleteData,

                clearData,
                uniqueTitle,
            }}
        >
            {children}
        </databaseContext.Provider>
    )
}