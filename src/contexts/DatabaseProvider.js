import { createContext, useContext, useState } from "react"
import { globalContext } from "./GlobalProvider"

export const databaseContext = createContext()

export default function DatabaseProvider({ children }) {
    const { setLoadingResponse } = useContext(globalContext)
    const { REACT_APP_API_URL } = process.env

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

    const [searchType, setSearchType] = useState("movie")
    const [elementType, setElementType] = useState("movie")
    const [dataForm, setDataForm] = useState(formInitialState)
    const [allMovies, setAllMovies] = useState([])
    const [allSeries, setAllSeries] = useState([])

    ////--- POST
    const saveData = async (element_type, data) => {
        setLoadingResponse(true)

        return fetch(`${REACT_APP_API_URL}/db/new/${element_type}`, {
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
    const getAllSeries = () => {
        setLoadingResponse(true)
        fetch(`${REACT_APP_API_URL}/db/all/series`)
            .then(async (res) => {
                const response = await res.json()
                setAllSeries(response)
                setLoadingResponse(false)
            })
            .catch(catchFuntion)
    }
    const getElementByName = async (element_type, unique_title) => {
        setLoadingResponse(true)
        return fetch(`${REACT_APP_API_URL}/db/${element_type}/t/${unique_title}`)
            .then(thenFuntion)
            .catch(catchFuntion)
    }
    const getElementById = async (type, id) => {
        setLoadingResponse(true)
        return fetch(`${REACT_APP_API_URL}/db/${type}/${id}`)
            .then(thenFuntion)
            .catch(catchFuntion)
    }
    const getOnlineVideo = async (elements) => {
        const videosOnline = await Promise.all(elements.map(async (element) => {
            if (!element.video_path) {
                return { ...element, video_status: 'error' }
            }

            return fetch(`${REACT_APP_API_URL}/file/online/${element.video_path}`)
                .then(async (res) => {
                    const response = await res.json()

                    if (response.resStatus === 'success') {
                        return { ...element, video_status: response.resStatus }
                    }

                    // If the file doesn't exist on disk, video_path is updated to null
                    updateData({ video_path: '', online: false }, element._id)
                    return { ...element, video_status: 'error' }
                })
                .catch(catchFuntion)
        }))

        return videosOnline
    }

    ////--- PUT
    const updateData = async (newData, id, element) => {
        setLoadingResponse(true)
        return fetch(`${REACT_APP_API_URL}/db/${element || elementType}/${id || dataForm._id}`, {
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
                formInitialState,
                searchType, setSearchType,
                elementType, setElementType,
                dataForm, setDataForm,
                allMovies,
                allSeries,

                getAllMovies,
                getAllSeries,
                getElementByName,
                getElementById,

                saveData,
                updateData,
                deleteData,

                clearData,
            }}
        >
            {children}
        </databaseContext.Provider>
    )
}