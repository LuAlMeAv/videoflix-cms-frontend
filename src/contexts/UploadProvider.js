import { createContext, useState } from "react"
import { useSnackbar } from "notistack"

export const uploadContext = createContext()

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
    overview: "",
    backdrop_path: "",
    poster_path: "",
    video_path: "",
    video_duration: "",
    video_duration_formated: "",
    video_start: 0,
    video_end: 0,
    video_start_intro: 0,
    video_end_intro: 0
}

export default function UploadProvider({ children }) {
    const { REACT_APP_API_URL } = process.env

    const { enqueueSnackbar } = useSnackbar();

    const [searchType, setSearchType] = useState("movie")

    // DATA STATES
    const [dataForm, setDataForm] = useState(formInitialState)
    const [movieE, setMovieE] = useState({})
    const [serieE, setSerieE] = useState({})
    const [seasonE, setSeasonE] = useState({})
    const [episodeE, setEpisodeE] = useState({})
    // FILE STATES
    const [videoFile, setVideoFile] = useState({})
    const [posterFile, setPosterFile] = useState({})
    const [backdropFile, setBackdropFile] = useState({})
    // INFORMATION STATES
    const [loadingResponse, setLoadingResponse] = useState(false)

    // SAVE FUNCTIONS
    const saveMovie = async () => {
        const video_name = clearTitle(dataForm.title)
        let movieData = { ...movieE, ...dataForm }

        const response = await saveDataOnDB(movieData)

        if (!response || response.resStatus !== "success") {
            return
        }

        movieData = response._r

        const video_response = await uploadVideo(video_name)
        movieData = { ...movieData, video_path: video_response.path }

        if (dataForm.backdrop_path.includes('blob')) {
            const backdrop_response = await uploadImage(video_name, "backdrop")
            movieData = { ...movieData, backdrop_path: backdrop_response.path }
        }
        if (dataForm.poster_path.includes('blob')) {
            const poster_response = await uploadImage(video_name, "poster")
            movieData = { ...movieData, poster_path: poster_response.path }
        }

        const newData = {
            video_path: movieData.video_path,
            backdrop_path: movieData.backdrop_path,
            poster_path: movieData.poster_path
        }

        updateDataOnDB(newData, 'movie', movieData._id)
    }
    const saveSerie = async () => {
        let serieData = { ...serieE, ...dataForm }

        const responseDB = await saveDataOnDB(serieData)

        if (!responseDB || responseDB.resStatus !== "success") {
            return
        }

        serieData = responseDB._r

        const video_name = clearTitle(dataForm.title)

        if (dataForm.backdrop_path.includes('blob')) {
            const backdrop_response = await uploadImage(video_name, "backdrop")
            serieData = { ...serieData, backdrop_path: backdrop_response.path }
        }
        if (dataForm.poster_path.includes('blob')) {
            const poster_response = await uploadImage(video_name, "poster")
            serieData = { ...serieData, poster_path: poster_response.path }
        }

        const newData = {
            video_path: serieData.video_path,
            backdrop_path: serieData.backdrop_path,
            poster_path: serieData.poster_path
        }

        updateDataOnDB(newData, 'tv', serieData._id)
    }
    const saveSeason = async () => {
        let seasonData = { ...seasonE, ...dataForm }

        const serieElement = await getDBSerieElementByName(seasonData.title)

        if (!serieElement || serieElement.resStatus !== "success") {
            return
        }

        const responseDB = await saveDataOnDB(seasonData, 'season', serieElement._r._id)

        if (!responseDB || responseDB.resStatus !== "success") {
            return
        }

        seasonData = responseDB._r

        const video_name = clearTitle(dataForm.title)

        if (dataForm.poster_path.includes('blob')) {
            const poster_response = await uploadImage(video_name, "poster")
            seasonData = { ...seasonData, poster_path: poster_response.path }
        }

        const newData = {
            poster_path: seasonData.poster_path
        }

        updateDataOnDB(newData, 'season', seasonData._id)
    }
    const saveEpisode = async () => {
        let episodeData = { ...episodeE, ...dataForm }

        const serieElement = await getDBSerieElementByName(episodeData.title)

        if (!serieElement || serieElement.resStatus !== "success") {
            return
        }

        const existSeason = serieElement._r.seasons.filter(s => s.season === episodeData.season_number * 1)

        if (existSeason.length < 1) {
            return enqueueSnackbar('Temporada no encontrada, debes guardarla primero', { variant: 'error' })
        }

        const responseDB = await saveDataOnDB(episodeData, 'episode', existSeason[0].id)

        if (!responseDB || responseDB.resStatus !== "success") {
            return
        }

        episodeData = responseDB._r

        const video_name = clearTitle(dataForm.title)

        const video_response = await uploadVideo(video_name)
        episodeData = { ...episodeData, video_path: video_response.path }

        if (dataForm.backdrop_path.includes('blob')) {
            const backdrop_response = await uploadImage(video_name, "backdrop")
            episodeData = { ...episodeData, backdrop_path: backdrop_response.path }
        }

        const newData = {
            video_path: episodeData.video_path,
            backdrop_path: episodeData.backdrop_path
        }

        updateDataOnDB(newData, 'episode', episodeData._id)
    }
    // BACKEND INTERACTIVE FUNCTIONS
    const uploadVideo = async (video_name) => {
        setLoadingResponse(true)

        const formData = new FormData()

        formData.append('video', videoFile)

        return fetch(`${REACT_APP_API_URL}/upload/video/${searchType}/${video_name}`, {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(response => {
                setResponse(response)
                return response;
            })
            .catch(err => errorResponse(err))
    }
    const uploadImage = async (name, type) => {
        setLoadingResponse(true)

        const formData = new FormData()

        formData.append('image', (type === "poster" ? posterFile : backdropFile))

        return fetch(`${REACT_APP_API_URL}/upload/image/${type}/${name}-${type}`, {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(response => {
                setResponse(response)
                return response
            })
            .catch(err => errorResponse(err))
    }
    const saveDataOnDB = async (fileData, type, id) => {
        setLoadingResponse(true)

        const complement = type === "episode" ? '/episode/' + id : '/season/' + id

        const queryUrl = `${REACT_APP_API_URL}/${searchType}${type === undefined ? "" : complement}`

        return fetch(queryUrl, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(fileData)
        })
            .then(async res => {
                const response = await res.json()
                setResponse(response)
                return response
            })
            .catch(err => errorResponse(err))
    }
    const updateDataOnDB = (newData, type, id) => {
        const queryUrl = `${REACT_APP_API_URL}${(type === "movie" || type === "tv") ? "" : "/tv"}/${type}/${id}`

        fetch(queryUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newData)
        })
            .then(response => response.json())
            .then(response => setResponse(response))
            .catch(err => console.error(err))
    }
    const getDBSerieElementByName = async (title) => {
        setLoadingResponse(true)

        return fetch(`${REACT_APP_API_URL}/tv/t/${title}`)
            .then(async (res) => {
                const response = await res.json()
                setResponse(response)
                return response
            })
            .catch(err => errorResponse(err))
    }
    // BANCKEND RESPONSES FUNCTIONS
    const setResponse = (response) => {
        setLoadingResponse(false)
        enqueueSnackbar(response.message, { variant: response.resStatus })
    }
    const errorResponse = (err) => {
        console.error(err)
        setLoadingResponse(false)
        enqueueSnackbar('Error al conectar con la Base de Datos, intenta más tarde', { variant: 'error' })
    }

    const clearTitle = (title) => {
        const { season_number, episode_number, year } = dataForm

        const title_clear_accents = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const title_clear_symbols = title_clear_accents.replace(/[^a-zA-Z0-9 ]/g, '')
        const title_clear_spaces = title_clear_symbols.replaceAll(" ", "_")

        const video_name = searchType === "movie" ?
            `${title_clear_spaces}-${year}-movie`
            : episode_number > 0 ?
                `${season_number < 10 ? "0" : ""}${season_number * 1}x${episode_number < 10 ? "0" : ""}${episode_number * 1}-${title_clear_spaces}`
                : season_number > 0 ?
                    `s${season_number < 10 ? "0" : ""}${season_number * 1}-${title_clear_spaces}`
                    :
                    `${title_clear_spaces}-${year}-serie`

        return video_name.toLowerCase()
    }
    const clearData = () => {
        setMovieE({})
        setSerieE({})
        setSeasonE({})
        setEpisodeE({})
        setDataForm(formInitialState)

        setVideoFile({})
        setPosterFile({})
        setBackdropFile({})
    }

    return (
        <uploadContext.Provider
            value={{
                dataForm, setDataForm,
                searchType, setSearchType,

                movieE, setMovieE,
                serieE, setSerieE,
                seasonE, setSeasonE,
                episodeE, setEpisodeE,

                loadingResponse,

                clearData,
                setVideoFile,
                setPosterFile,
                setBackdropFile,
                saveMovie,
                saveSerie,
                saveSeason,
                saveEpisode,
            }}
        >
            {children}
        </uploadContext.Provider>
    )
}