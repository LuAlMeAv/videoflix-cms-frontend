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

    // SAVE ON DATABASE FUNCTIONS
    const saveMovie = async () => {
        // Turn to true the backdrop loading
        setLoadingResponse(true)

        // Unifique the response from TMDB and the form edited data
        const data = { ...movieE, ...dataForm }

        // Save the element in the database and return the object created
        const saveResponse = await saveData(data)

        //  If the response is an error, do not upload files
        if (saveResponse.resStatus !== "success") {
            return
        }

        // Create a new name with specific rules
        const filename = clearTitle(data.title)

        // Upload de video file and update the movie data in the database
        uploadFile(videoFile, 'video', filename, saveResponse._r._id)

        // If the poster file is local upload the image and update the path in the movie data
        if (dataForm.poster_path.includes('blob')) {
            uploadFile(posterFile, 'image', filename, saveResponse._r._id, 'movie', 'poster')
        }

        // If the backdrop file is local upload the image and update the path in the movie data
        if (dataForm.backdrop_path.includes('blob')) {
            uploadFile(backdropFile, 'image', filename, saveResponse._r._id, 'movie', 'backdrop')
        }
    }
    const saveSerie = async () => {
        setLoadingResponse(true)

        const data = { ...serieE, ...dataForm }

        const saveResponse = await saveData(data)

        if (saveResponse.resStatus !== "success") {
            return
        }

        const filename = clearTitle(data.title)

        if (dataForm.poster_path.includes('blob')) {
            uploadFile(posterFile, 'image', filename, saveResponse._r._id, 'tv', 'poster')
        }

        if (dataForm.backdrop_path.includes('blob')) {
            uploadFile(backdropFile, 'image', filename, saveResponse._r._id, 'tv', 'backdrop')
        }
    }
    const saveSeason = async () => {
        setLoadingResponse(true)

        const data = { ...seasonE, ...dataForm }

        const serie = await getDBSerieElementByName(data.title)

        if (serie._r === undefined) {
            return
        }

        const saveResponse = await saveData(data, 'season', serie._r._id)

        if (saveResponse.resStatus !== "success") {
            return
        }

        const filename = clearTitle(data.title)

        if (dataForm.poster_path.includes('blob')) {
            uploadFile(posterFile, 'image', filename, saveResponse._r._id, 'season', 'poster')
        }
    }
    const saveEpisode = async () => {
        setLoadingResponse(true)

        const data = { ...episodeE, ...dataForm }

        const serie = await getDBSerieElementByName(data.title)

        if (serie._r === undefined) {
            return
        }

        const season = serie._r.seasons.filter(s => s.season === data.season_number * 1)

        if (season.length < 1) {
            return enqueueSnackbar('Temporada no encontrada, debes guardarla primero', { variant: 'error' })
        }
        const saveResponse = await saveData(data, 'episode', season[0].id)

        if (saveResponse.resStatus !== "success") {
            return
        }

        const filename = clearTitle(dataForm.title)

        uploadFile(videoFile, 'video', filename, saveResponse._r._id)

        if (dataForm.backdrop_path.includes('blob')) {
            uploadFile(backdropFile, 'image', filename, saveResponse._r._id, 'episode', 'backdrop')
        }
    }
    const saveData = async (data, type, id) => {
        setLoadingResponse(true)
        // console.log(`${REACT_APP_API_URL}/${searchType}${type ? '/' + type : ''}${id ? '/' + id : ''}`)
        return await fetch(`${REACT_APP_API_URL}/${searchType}${type ? '/' + type : ''}${id ? '/' + id : ''}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(async (res) => {
                const response = await res.json()
                setResponse(response)
                return response
            })
            .catch(err => errorResponse(err))
    }
    // UPLOAD FUNCTION
    const uploadFile = async (file, file_type, filename, id, model, imageType) => {
        setLoadingResponse(true)
        
        // Create new form data
        const dataForm = new FormData()

        // Add the file to the form data
        dataForm.append('file', file)

        const urlQuery = file_type === 'video' ?
            // Query Example: http://localhost:5000/upload/video/movie/name_of_the_movie-2023-movie/id_model
            `${REACT_APP_API_URL}/upload/${file_type}/${searchType}/${filename}/${id}`
            :
            // Query Example: http://localhost:5000/upload/image/movie/name_of_the_movie-2023-movie/poster/a1b2c3d4e5f6g7h8i9/episode
            `${REACT_APP_API_URL}/upload/${file_type}/${searchType}/${filename}/${imageType}/${id}/${model}`

        await fetch(urlQuery, {
            method: 'POST',
            body: dataForm
        })
            .then(async (res) => {
                const response = await res.json()
                setResponse(response)
                return response
            })
            .catch(err => errorResponse(err))
    }
    // GET ID BY BANE FUNCTION
    const getDBSerieElementByName = async (title) => {
        return fetch(`${REACT_APP_API_URL}/tv/t/${title}`)
            .then(async (res) => {
                const response = await res.json()
                if (response.resStatus === "error") {
                    setResponse(response)
                }
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
        // Data states
        setMovieE({})
        setSerieE({})
        setSeasonE({})
        setEpisodeE({})
        setDataForm(formInitialState)
        // File states
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