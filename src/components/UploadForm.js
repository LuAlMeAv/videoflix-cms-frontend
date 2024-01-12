import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { Autocomplete, Backdrop, Button, CircularProgress, Grid, Stack, Switch, TextField, Typography } from '@mui/material'
import ImagesElement from './ImagesElement'
import VideoElement from './VideoElement'
import { databaseContext } from '../contexts/DatabaseProvider'
import { filesContext } from '../contexts/FilesProvider'
import { globalContext } from '../contexts/GlobalProvider'

export default function UploadForm() {
    // const { REACT_APP_API_URL } = process.env
    const { loadingResponse } = useContext(globalContext)
    const { clearFiles, uploadFiles, updateFiles } = useContext(filesContext)
    const { searchType, clearData, dataForm, setDataForm, updateData, saveData, getElementByName, getElementById, setElementType, elementType, uniqueTitle } = useContext(databaseContext)

    const { title, original_title, tagline, season_number, episode_number, episode_name, year, certification, duration, genre_ids, overview, online } = dataForm;

    const [videoState, setVideoState] = useState('play')
    const [change, setChange] = useState(false)

    const { enqueueSnackbar } = useSnackbar();

    const { edit_element_type, id } = useParams()
    const navigate = useNavigate()

    const handleInputChange = (e) => {
        const name = e.target.name
        let value = e.target.value

        if (name === "title") {
            setElementType(searchType === 'tv' ? 'serie' : 'movie')
            setDataForm({ ...dataForm, season_number: "", episode_number: "", episode_name: "", [name]: value })
        }
        else if (name === "season_number") {
            value = value * 1 || ""

            setElementType(value === "" ? 'serie' : 'season')
            setDataForm({ ...dataForm, episode_number: "", episode_name: "", [name]: value === "" ? "" : value })
        }
        else if (name === "episode_number") {
            value = value * 1 || ""

            setElementType(value === "" ? 'season' : 'episode')
            setDataForm({ ...dataForm, episode_name: !value ? "" : "Episodio " + value, video_path: "", [name]: value })
        }
        else if (name === "year") {
            value = value * 1 || ""
            setDataForm({ ...dataForm, [name]: value })
        }
        else {
            setDataForm({ ...dataForm, [name]: value })
        }
    }

    const handleChangeGenres = (value) => setDataForm({ ...dataForm, genre_ids: value })

    const handleClickSave = async () => {
        setVideoState('stop')

        const exist = await getElementByName()

        if (exist.resStatus === 'success') {
            return enqueueSnackbar('Este elemento ya existe', { variant: 'warning' })
        }

        const responseFiles = await uploadFiles()

        const data = {
            ...dataForm,
            video_path: responseFiles.video ? responseFiles.video : dataForm.video_path,
            poster_path: responseFiles.poster ? responseFiles.poster : dataForm.poster_path,
            backdrop_path: responseFiles.backdrop ? responseFiles.backdrop : dataForm.backdrop_path
        }

        const responseSave = await saveData(data)

        enqueueSnackbar(responseSave.message, { variant: responseSave.resStatus })

        if (responseSave.resStatus === 'success') {
            navigate(-1)
        }
    }

    const handleClickSaveChanges = async () => {
        setVideoState('stop')
        console.log(change)
        const newFiles = await updateFiles()

        const newData = {
            ...dataForm,
            unique_title: uniqueTitle(),
            video_path: newFiles.video ? newFiles.video : dataForm.video_path,
            poster_path: newFiles.poster ? newFiles.poster : dataForm.poster_path,
            backdrop_path: newFiles.backdrop ? newFiles.backdrop : dataForm.backdrop_path,
        }

        const response = await updateData(newData)

        enqueueSnackbar(response.message, { variant: response.resStatus })

        if (response.resStatus === 'success') {
            navigate(-1)
        }
    }

    const fillEditData = async () => {
        const response = await getElementById(edit_element_type, id)

        if (!response.element) {
            return enqueueSnackbar('No se ha encontrado ningún elemento', { variant: 'error' })
        }

        setDataForm({ ...dataForm, ...response.element })
    }

    const handleClear = () => {
        clearFiles()
        clearData()
    }

    useEffect(() => {
        handleClear()
        setElementType(searchType === 'tv' ? 'serie' : 'movie')
        setChange(false)

        if (id) {
            fillEditData()
            setElementType(edit_element_type)
        }
        // eslint-disable-next-line
    }, [id])

    return (
        <Grid container spacing={2} mt={3} maxWidth={"720px"} mx="auto" pr={3} onChange={() => setChange(true)}>
            <InputItem xs={12} label="Titulo" name="title" value={title} onChange={handleInputChange} />
            <InputItem xs={12} label="Titulo original" name="original_title" value={original_title} onChange={handleInputChange} />
            <InputItem xs={12} label="Eslogan" name="tagline" value={tagline} onChange={handleInputChange} />

            {/* IF IS SERIES */}
            {elementType !== "movie" && <>
                <InputItem
                    xs={7}
                    fullWidth
                    label="Temporada"
                    name="season_number"
                    value={season_number}
                    onChange={handleInputChange}
                    color={season_number ? 'info' : 'error'}
                    disabled={!title && true}
                />
                <InputItem
                    xs={5}
                    fullWidth
                    label="Episodio"
                    name="episode_number"
                    value={episode_number}
                    onChange={handleInputChange}
                    color={episode_number ? 'info' : 'error'}
                    disabled={!season_number && true}
                />
                <InputItem
                    xs={12}
                    fullWidth
                    label="Nombre del Episodio"
                    name="episode_name"
                    value={episode_name}
                    color={episode_name ? 'info' : 'error'}
                    onChange={handleInputChange}
                    disabled={!episode_number && true}
                />
            </>}

            <InputItem
                xs={4}
                label="Año"
                name="year"
                value={year}
                color={year > 1000 ? 'info' : 'error'}
                onChange={handleInputChange}
            />
            <InputItem xs={4} label="Clasificación" name="certification" value={certification?.toUpperCase()} onChange={handleInputChange} />
            <InputItem xs={4} label="Duración" name="duration" value={duration?.toLowerCase()} onChange={handleInputChange} />
            <GeneresSelectorInput value={genre_ids} setGenres={handleChangeGenres} />
            <InputItem xs={12} label="Resumen" name="overview" value={overview} onChange={handleInputChange} multiline maxRows={6} />

            {/* IMAGES AREA */}
            <ImagesElement />

            {/* VIDEO AREA */}
            {(searchType === "movie" || (season_number >= 0 && episode_number > 0)) &&
                <VideoElement videoState={videoState} setVideoState={setVideoState} />
            }

            <Grid item xs={12}>
                <Typography>Quieres que este contenido este disponible ahora?</Typography>
                <Stack direction="row" alignItems="center">
                    <Switch
                        color='success'
                        checked={online}
                        onChange={(e) => setDataForm({ ...dataForm, online: e.target.checked })}
                    />
                    <Typography >{online ? 'Sí' : 'No'}</Typography>
                </Stack>
            </Grid>

            {/* BUTTON AREA */}
            <Grid item xs={12} md={8} container spacing={2} mx="auto" justifyContent="center" >
                {id ?
                    <ButtonItem onClick={handleClickSaveChanges} variant="contained" btnName="update" />
                    :
                    <>
                        <ButtonItem onClick={handleClear} variant='outlined' btnName="clear" />

                        <ButtonItem onClick={handleClickSave} variant='contained' btnName={
                            elementType
                            // searchType === "movie" ? "movie" :
                            //     season_number === "" ? "serie" :
                            //         episode_number === "" ? "season" :
                            //             "episode"
                        } />
                    </>
                }
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

// INPUT ITEM
function InputItem(props) {
    const { dataForm, setDataForm } = useContext(databaseContext)

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

// BUTTONS
function ButtonItem({ onClick, variant, btnName }) {
    const btnContent = {
        'update': 'Actualizar',
        'clear': 'Limpiar',
        'movie': 'Guardar Pelicula',
        'serie': 'Guardar Serie',
        'season': 'Guardar Temporada',
        'episode': 'Guardar Episodio',
    }

    return (
        <Grid item xs={12} md={6} >
            <Button fullWidth onClick={() => onClick(btnName)} variant={variant} children={btnContent[btnName]} />
        </Grid>
    )
}

// GENERES INPUT CHECKBOX
function GeneresSelectorInput({ value, setGenres }) {
    const { searchType } = useContext(databaseContext)

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