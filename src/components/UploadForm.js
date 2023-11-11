import { useContext, useEffect, useState } from 'react'
import { Autocomplete, Backdrop, Button, CircularProgress, Grid, TextField } from '@mui/material'
import { useSnackbar } from 'notistack'
import { uploadContext } from '../contexts/UploadProvider'
import ImagesElement from './ImagesElement'
import VideoElement from './VideoElement'

export default function UploadForm() {
    const { dataForm, setDataForm, clearData, saveMovie, saveSerie, saveSeason, saveEpisode, searchType, serieE, seasonE, episodeE, loadingResponse } = useContext(uploadContext)

    const { title, original_title, tagline, season_number, episode_number, episode_name, year, certification, duration, genre_ids, overview } = dataForm;

    const [videoState, setVideoState] = useState('play')

    const { enqueueSnackbar } = useSnackbar();

    const handleInputChange = (e) => {
        const name = e.target.name
        const value = e.target.value

        if (name === "title") {
            setDataForm({ ...dataForm, season_number: "", episode_number: "", episode_name: "", [name]: value })
        }
        else if (name === "season_number") {
            setDataForm({ ...dataForm, episode_number: "", episode_name: "", [name]: value === "" ? "" : value * 1 })
        }
        else if (name === "episode_number") {
            setDataForm({ ...dataForm, episode_name: "Episodio " + value, video_path: "", [name]: value * 1 })
        }
        else {
            setDataForm({ ...dataForm, [name]: value })
        }
    }
    const handleChangeGenres = (value) => {
        setDataForm({ ...dataForm, genre_ids: value })
    }
    const handleClickSave = () => {
        // MOVIE ITEM
        if (searchType === "movie") {
            if (!title || !year || !duration || genre_ids.length < 1) {
                return enqueueSnackbar('Alguno de los siguientes campos está vacío: Titulo, Año, Duración o Generos', { variant: 'error' })
            }
            if (!dataForm.poster_path || !dataForm.backdrop_path) {
                return enqueueSnackbar('Debes seleccionar una imágen de fondo y un Póster', { variant: 'error' })
            }
            if (!dataForm.video_path) {
                return enqueueSnackbar('Debes seleccionar un video', { variant: 'error' })
            }
            setVideoState('stop')
            saveMovie()
        } // SERIE ITEM
        else if (dataForm.season_number === "") {
            if (!title || !year || genre_ids.length < 1) {
                return enqueueSnackbar('Alguno de los siguientes campos está vacío: Titulo, Año o Generos', { variant: 'error' })
            }
            if (!dataForm.poster_path || !dataForm.backdrop_path) {
                return enqueueSnackbar('Debes seleccionar una imágen de fondo y un Póster', { variant: 'error' })
            }
            saveSerie()
        } // SEASON ITEM
        else if (dataForm.episode_number === "") {
            if (!title || !season_number) {
                return enqueueSnackbar('Alguno de los siguientes campos está vacío: Titulo o Temporada', { variant: 'error' })
            }
            if (!dataForm.poster_path) {
                return enqueueSnackbar('Debes seleccionar una imágen de Póster', { variant: 'error' })
            }
            saveSeason()
        } // EPISODE ITEM
        else {
            if (!title || !season_number || !episode_number || !episode_name || !duration) {
                return enqueueSnackbar('Alguno de los siguientes campos está vacío: Titulo, Temporada, Episodio, Nombre del Episodio o Duración', { variant: 'error' })
            }
            if (!dataForm.backdrop_path) {
                return enqueueSnackbar('Debes seleccionar una imágen de Fondo', { variant: 'error' })
            }
            if (!dataForm.video_path) {
                return enqueueSnackbar('Debes agregar un video', { variant: 'error' })
            }
            setVideoState('stop')
            saveEpisode()
        }
    }

    return (
        <Grid container spacing={2} mt={3} maxWidth={"720px"} mx="auto" pr={3}>
            <InputItem xs={12} label="Titulo" name="title" value={title} onChange={handleInputChange} />
            <InputItem xs={12} label="Titulo original" name="original_title" value={original_title} onChange={handleInputChange} />
            <InputItem xs={12} label="Eslogan" name="tagline" value={tagline || ""} onChange={handleInputChange} />

            {/* IF IS SERIES */}
            {searchType === "tv" && <>
                <InputItem
                    xs={7}
                    fullWidth
                    label="Temporada"
                    name="season_number"
                    value={season_number === 0 ? 0 : season_number > 0 ? season_number : ""}
                    onChange={handleInputChange}
                    color={season_number >= 0 ? 'info' : 'error'}
                    disabled={(title === "" || serieE.title) && true}
                />
                <InputItem
                    xs={5}
                    fullWidth
                    label="Episodio"
                    name="episode_number"
                    value={episode_number || ""}
                    onChange={handleInputChange}
                    color={episode_number > 0 ? 'info' : 'error'}
                    disabled={(season_number === "" || seasonE.season_number) && true}
                />
                <InputItem
                    xs={12}
                    fullWidth
                    label="Nombre del Episodio"
                    name="episode_name"
                    value={episode_name}
                    color={episode_name ? 'info' : 'error'}
                    onChange={handleInputChange}
                    disabled={(episode_number === "" || episodeE.episode_name) && true}
                />
            </>}

            <InputItem
                xs={4}
                label="Año"
                name="year"
                value={year * 1 || ""}
                color={year > 1000 ? 'info' : 'error'}
                onChange={handleInputChange}
            />
            <InputItem xs={4} label="Clasificación" name="certification" value={certification?.toUpperCase() || ""} onChange={handleInputChange} />
            <InputItem xs={4} label="Duración" name="duration" value={duration?.toLowerCase() || ""} onChange={handleInputChange} />
            <GeneresSelectorInput value={genre_ids} setGenres={handleChangeGenres} />
            <InputItem xs={12} label="Resumen" name="overview" value={overview} onChange={handleInputChange} multiline maxRows={6} />

            {/* IMAGES AREA */}
            <ImagesElement />

            {/* VIDEO AREA */}
            {(searchType === "movie" || (season_number >= 0 && episode_number > 0)) &&
                <VideoElement videoState={videoState} setVideoState={setVideoState} />
            }

            {/* BUTTON AREA */}
            <Grid item xs={12} md={8} container spacing={2} mx="auto">
                <ButtonItem onClick={clearData} variant='outlined' children="Limpiar" />

                <ButtonItem onClick={handleClickSave} variant='contained' children={
                    searchType === "movie" ? "Guardar Pelicula" :
                        season_number === "" ? "Guardar Serie" :
                            episode_number === "" ? "Guardar Temporada" :
                                "Guardar Episodio"
                } />
            </Grid>
            {/* LOADING BACKDROP */}
            {loadingResponse &&
                <Backdrop
                    sx={{ color: '#fff', zIndex: 999 }}
                    open={loadingResponse}
                    children={<CircularProgress color="inherit" />}
                />
            }
        </Grid>
    )
}

function InputItem(props) {
    const { dataForm, setDataForm } = useContext(uploadContext)

    const handleOnBlur = (e) => {
        const name = e.target.name
        let value = e.target.value.trim()

        if (name === "season_number" || name === "episode_number" || name === "year") {
            value = value === "" ? "" : value * 1
        }

        setDataForm({ ...dataForm, [name]: value })
    }

    return (
        <Grid item xs={props.xs}>
            <TextField fullWidth {...props} onBlur={handleOnBlur} />
        </Grid>
    )
}

function ButtonItem(props) {
    return (
        <Grid item xs={12} md={6} >
            <Button fullWidth {...props} />
        </Grid>
    )
}

// GENERES INPUT CHECKBOX
function GeneresSelectorInput({ value, setGenres }) {
    const { searchType } = useContext(uploadContext)

    const [genresValue, setGenresValue] = useState([])

    const genres = searchType === "tv" ? genresTv : genresMovies;

    const indexOfGeneres = value && value.map(g => genres.map(obj => obj.id).indexOf(g))

    const arrayGenresObject = indexOfGeneres && indexOfGeneres.map(i => genres[i])

    const handleChangeGenres = (e, value) => {
        setGenresValue(value)
        const newGenres_ids = value.map(g => g.id)
        setGenres(newGenres_ids)
    }

    useEffect(() => {
        if (value) {
            setGenresValue(arrayGenresObject)
        } else {
            setGenresValue([])
        }
        // eslint-disable-next-line
    }, [value])

    return (
        <Grid item xs={12}>
            <Autocomplete
                multiple
                limitTags={3}
                options={genres}
                getOptionLabel={(option) => option?.name}
                onChange={handleChangeGenres}
                value={genresValue}
                defaultValue={[]}
                renderInput={(params) => (
                    <TextField {...params} label="Generos" placeholder="Generos" />
                )}
            />
        </Grid>
    );
}

const genresMovies = [
    { id: 28, name: "Acción" },
    { id: 12, name: "Aventura" },
    { id: 16, name: "Animación" },
    { id: 35, name: "Comedia" },
    { id: 80, name: "Crimen" },
    { id: 99, name: "Documental" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Familia" },
    { id: 14, name: "Fantasía" },
    { id: 36, name: "Historia" },
    { id: 27, name: "Terror" },
    { id: 10402, name: "Música" },
    { id: 9648, name: "Misterio" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Ciencia ficción" },
    { id: 10770, name: "Película de TV" },
    { id: 53, name: "Suspenso" },
    { id: 10752, name: "Bélica" },
    { id: 37, name: "Western" }
]
const genresTv = [
    { id: 10759, name: "Acción y Aventura" },
    { id: 16, name: "Animación" },
    { id: 35, name: "Comedia" },
    { id: 80, name: "Crimen" },
    { id: 99, name: "Documental" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Familia" },
    { id: 10762, name: "Infantil" },
    { id: 9648, name: "Misterio" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Ciencia Ficción y Fantasía" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "Guerra y Politica" },
    { id: 37, name: "Western" }
]

// scp -r build/ lmed@192.168.1.222:/home/lmed/containers/web_server