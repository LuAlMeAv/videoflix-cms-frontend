import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { Autocomplete, Backdrop, Button, CircularProgress, Grid, Stack, Switch, TextField, Typography } from '@mui/material'
import ImagesElement from './ImagesElement'
import VideoElement from './VideoElement'
import { databaseContext } from '../contexts/DatabaseProvider'
import { filesContext } from '../contexts/FilesProvider'
import { globalContext } from '../contexts/GlobalProvider'

const uniqueTitle = (element_type, data) => {
    const { title, original_title, year, season_number, episode_number } = data;

    if (original_title === "") {
        return undefined
    }

    const original = original_title.replace(/[^a-zA-Z0-9 ]/g, '')
    const language = title.replace(/[^a-zA-Z0-9 ]/g, '')
    const clear_symbols = original.replace(' ', '') === '' ? language : original
    const clear_accents = clear_symbols.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const clear_spaces = clear_accents.replaceAll(" ", "_")

    const video_name = {
        'movie': `${clear_spaces}-${year}-movie`,
        'serie': `${clear_spaces}-${year}-serie`,
        'season': `${clear_spaces}-s${season_number < 10 ? "0" : ""}${season_number * 1}`,
        'episode': `${clear_spaces}-s${season_number < 10 ? "0" : ""}${season_number * 1}e${episode_number < 10 ? "0" : ""}${episode_number * 1}`,
    }

    return video_name[element_type]?.toLowerCase()
}

export default function DataFormElement() {
    const { loadingResponse } = useContext(globalContext)
    const { clearFiles, uploadFiles, updateNameFiles, deleteSingleFile } = useContext(filesContext)
    const { clearData, dataForm, setDataForm, updateData, saveData, getElementByName, getElementById, setElementType, formInitialState } = useContext(databaseContext)

    const { title, original_title, tagline, season_number, episode_number, episode_name, year, certification, duration, genre_ids, overview, online } = dataForm;

    const [videoState, setVideoState] = useState('play')
    const [change, setChange] = useState(false)
    const [oldData, setOldData] = useState({})

    const { enqueueSnackbar } = useSnackbar();

    const { element_type, id, id_parent } = useParams()
    const navigate = useNavigate()

    const handleInputChange = (e) => {
        const name = e.target.name
        let value = e.target.value

        if (name === "year" || name === "season_number" || name === "episode_number") {
            value = value * 1 || ""
            setDataForm({ ...dataForm, [name]: value })
        }
        else {
            setDataForm({ ...dataForm, [name]: value })
        }
    }

    const fillEditData = async () => {
        const response = await getElementById(element_type, id)

        if (!response.element) {
            return enqueueSnackbar('No se ha encontrado ningún elemento', { variant: 'error' })
        }

        setOldData(response.element)
        setDataForm({ ...formInitialState, ...response.element })
    }
    const parentData = async () => {
        const type = element_type === 'episode' ? 'season' : 'serie'

        const response = await getElementById(type, id_parent)

        if (!response.element) {
            return enqueueSnackbar('No se ha encontrado ningún elemento', { variant: 'error' })
        }

        const element = response.element
        element[type + '_id'] = element._id
        delete element._id

        setDataForm({ ...formInitialState, ...element })
    }

    // SAVE FUNCTIONS
    const handleClickSave = () => {
        setVideoState('stop')

        const unique_title = uniqueTitle(element_type, dataForm)

        const type_of_save = {
            'movie': saveMovie,
            'serie': saveSerie,
            'season': saveSeason,
            'episode': saveEpisode,
        }

        type_of_save[element_type](unique_title)
    }
    const saveMovie = async (unique_title) => {
        const exist = await getElementByName(element_type, unique_title)

        if (exist.element) {
            return enqueueSnackbar('La película ya existe', { variant: 'warning' })
        }

        const uploadInfo = await uploadFiles(unique_title)
        console.log(uploadInfo)

        const data = {
            ...dataForm,
            unique_title,
            video_path: uploadInfo.video ? uploadInfo.video : dataForm.video_path,
            poster_path: uploadInfo.poster ? uploadInfo.poster : dataForm.poster_path,
            backdrop_path: uploadInfo.backdrop ? uploadInfo.backdrop : dataForm.backdrop_path
        }

        const saveInfo = await saveData(element_type, data)
        console.log(saveInfo)

        if (saveInfo.resStatus === 'success') {
            navigate(-1, { replace: true })
        }

        enqueueSnackbar(saveInfo.message, { variant: saveInfo.resStatus })
    }
    const saveSerie = async (unique_title) => {
        const exist = await getElementByName(element_type, unique_title)

        if (exist.element) {
            return enqueueSnackbar('La Serie ya existe', { variant: 'warning' })
        }

        const uploadInfo = await uploadFiles(unique_title)
        console.log(uploadInfo)

        const data = {
            ...dataForm,
            unique_title,
            poster_path: uploadInfo.poster ? uploadInfo.poster : dataForm.poster_path,
            backdrop_path: uploadInfo.backdrop ? uploadInfo.backdrop : dataForm.backdrop_path,
            seasons: []
        }

        const saveInfo = await saveData(element_type, data)
        console.log(saveInfo)

        if (saveInfo.resStatus === 'success') {
            navigate(-1, { replace: true })
        }

        enqueueSnackbar(saveInfo.message, { variant: saveInfo.resStatus })
    }
    const saveSeason = async (unique_title) => {
        // verify if exist
        const exist = await getElementByName(element_type, unique_title)

        if (exist.element) {
            return enqueueSnackbar('La Temporada ya existe', { variant: 'warning' })
        }

        // upload files
        const responseUpload = await uploadFiles(unique_title)
        console.log(responseUpload)

        const data = {
            ...dataForm,
            unique_title,
            poster_path: responseUpload.poster ? responseUpload.poster : dataForm.poster_path,
            episodes: []
        }
        delete data.id

        // save season
        const responseSaveData = await saveData(element_type, data)

        enqueueSnackbar(responseSaveData.message, { variant: responseSaveData.resStatus })

        // update serie
        const serieData = await getElementById('serie', data.serie_id)
        const serieElement = serieData.element

        const newSeasons = [...serieElement.seasons, { [data.season_number]: responseSaveData._res._id }]

        const orderSeasons = newSeasons.sort((a, b) => {
            return Object.keys(a)[0] - Object.keys(b)[0]
        })

        const responseUpdate = await updateData({ seasons: orderSeasons }, serieElement._id, 'serie')

        if (responseUpdate.resStatus === 'success') {
            navigate(-1, { replace: true })
        }
    }
    const saveEpisode = async (unique_title) => {
        // verify if exist
        const exist = await getElementByName(element_type, unique_title)

        if (exist.element) {
            return enqueueSnackbar('El episodio ya existe', { variant: 'warning' })
        }

        // upload files
        const responseUpload = await uploadFiles(unique_title)
        console.log(responseUpload)

        const data = {
            ...dataForm,
            unique_title,
            video_path: responseUpload.video ? responseUpload.video : dataForm.video_path,
            backdrop_path: responseUpload.backdrop ? responseUpload.backdrop : dataForm.backdrop_path,
        }
        delete data.id

        // save episode
        const responseSaveData = await saveData(element_type, data)

        enqueueSnackbar(responseSaveData.message, { variant: responseSaveData.resStatus })

        // update season
        const seasonData = await getElementById('season', data.season_id)
        const serieElement = seasonData.element

        const newEpisodes = [...serieElement.episodes, { [data.episode_number]: responseSaveData._res._id }]

        const orderEpisodes = newEpisodes.sort((a, b) => {
            return Object.keys(a)[0] - Object.keys(b)[0]
        })

        const responseUpdate = await updateData({ episodes: orderEpisodes }, serieElement?._id, 'season')

        if (responseUpdate.resStatus === 'success') {
            navigate(-1, { replace: true })
        }
    }

    // UPDATE FUNCTIONS
    const handleClickSaveChanges = async () => {
        // Stop if the video is playing
        setVideoState('stop')

        // Check if there are changes, if not go back
        if (!change) {
            navigate(-1, { replace: true })
            return enqueueSnackbar('No hay cambios por realizar', { variant: 'success' })
        }

        // Delete the files if there are any on the server
        const responseDelete = await deleteServerFiles()

        if (!responseDelete.allOk) {
            return
        }

        // Gets the new unique_name
        const unique_title = uniqueTitle(element_type, dataForm)

        // If the element is a movie and the unique_name changes, all files on the server are renamed
        if ((element_type === 'movie' || element_type === 'serie') && unique_title !== oldData.unique_title) {
            const responseUpdateFilesName = await updateNameFiles(unique_title)
            console.log(responseUpdateFilesName)
        }

        // Upload if there are new files
        const responseUpload = await uploadFiles(unique_title)

        // Set the new files data
        const newData = {
            ...dataForm,
            unique_title,
            video_path: responseUpload.video ? responseUpload.video : dataForm.video_path,
            poster_path: responseUpload.poster ? responseUpload.poster : dataForm.poster_path,
            backdrop_path: responseUpload.backdrop ? responseUpload.backdrop : dataForm.backdrop_path,
        }

        // Update the element in the database
        const updateResponse = await updateData(newData, dataForm._id, element_type)

        // If all is ok go back
        if (updateResponse.resStatus === 'success') {
            navigate(-1, { replace: true })
        }

        // Show the response in a snack bar
        enqueueSnackbar(updateResponse.message, { variant: updateResponse.resStatus })
    }
    const deleteServerFiles = async () => {
        const files = ['video', 'poster', 'backdrop']

        let responses = { allOk: true }

        files.forEach(async (file) => {
            // Verify if the file path change
            if (oldData[file + '_path'] !== dataForm[file + '_path']) {
                // Verify if the path is external
                if (oldData[file + '_path'] && !oldData[file + '_path'].includes('http')) {
                    // Delete file from server
                    const responseDelete = await deleteSingleFile(oldData[file + '_path'])

                    // Add response to the object responses
                    responses[file + '_path'] = responseDelete

                    // If an error occurs, change the allOk property to false and display the error in the snackbar
                    if (responseDelete.resStatus === 'error') {
                        responses.allOk = false
                        enqueueSnackbar(responseDelete.message, { variant: responseDelete.resStatus })
                    }
                }
            }
        })

        return responses
    }

    const disabledOnlineValidation = () => {
        if ((element_type === 'movie' || element_type === 'episode') && dataForm.video_path === '') {
            return true
        }
        if (element_type === 'season' && (!dataForm.episodes || dataForm.episodes.length < 1)) {
            return true
        }
        if (element_type === 'serie' && (!dataForm.seasons || dataForm.seasons.length < 1)) {
            return true
        }
        return false
    }
    const disabledOriginalTitleValidation = () => {
        const isEdit = window.location.pathname.includes('edit')

        if (element_type === 'season' || element_type === 'episode') {
            return true
        } else if (isEdit && element_type === 'serie' && dataForm.seasons?.length > 0) {
            return true
        }

        return false
    }

    const handleClear = () => {
        console.log("Limpiando")
        clearFiles()
        clearData()
    }

    useEffect(() => {
        handleClear()

        setElementType(element_type)

        if (id) {
            fillEditData()
        }

        if (id_parent) {
            parentData()
        }

        // eslint-disable-next-line
    }, [id, id_parent])

    return (
        <>
            <Grid container spacing={2} mt={3} maxWidth={"720px"} mx="auto" pr={3} onChange={() => setChange(true)}>
                <InputItem xs={12} label="Titulo" name="title" value={title} onChange={handleInputChange} disabled={(element_type === 'season' || element_type === 'episode') && true} />
                <InputItem xs={12} label="Titulo original" name="original_title" value={original_title} onChange={handleInputChange} disabled={disabledOriginalTitleValidation()} />

                {(element_type === 'movie' || element_type === 'serie') &&
                    <InputItem xs={12} label="Eslogan" name="tagline" value={tagline} onChange={handleInputChange} />
                }

                {(element_type === 'season' || element_type === 'episode') &&
                    <InputItem
                        xs={12}
                        fullWidth
                        label="Temporada"
                        name="season_number"
                        value={season_number}
                        onChange={handleInputChange}
                        color={season_number ? 'info' : 'error'}
                        disabled={(element_type === 'episode' || (element_type === 'season' && window.location.href.includes('edit'))) && true}
                    />
                }

                {element_type === 'episode' && <>
                    <InputItem
                        xs={12}
                        fullWidth
                        label="Episodio"
                        name="episode_number"
                        value={episode_number}
                        onChange={handleInputChange}
                        color={episode_number ? 'info' : 'error'}
                        disabled={(element_type === 'episode' && window.location.href.includes('edit')) && true}
                    />
                    <InputItem
                        xs={12}
                        fullWidth
                        label="Nombre del Episodio"
                        name="episode_name"
                        value={episode_name}
                        color={episode_name ? 'info' : 'error'}
                        onChange={handleInputChange}
                    />
                </>}

                <InputItem
                    xs={12}
                    label="Año"
                    name="year"
                    value={year}
                    color={year > 1000 ? 'info' : 'error'}
                    onChange={handleInputChange}
                />
                {/* {element_type !== 'season' &&
            } */}
                <InputItem xs={12} label="Clasificación" name="certification" value={certification?.toUpperCase()} onChange={handleInputChange} />
                {(element_type === 'movie' || element_type === 'episode') &&
                    <InputItem xs={12} label="Duración" name="duration" value={duration?.toLowerCase()} onChange={handleInputChange} />
                }
                {/* {element_type !== 'season' &&
            } */}
                <GeneresSelectorInput value={genre_ids} generesType={element_type} />
                <InputItem xs={12} label="Resumen" name="overview" value={overview} onChange={handleInputChange} multiline maxRows={6} />

                {/* IMAGES AREA */}
                <ImagesElement setChange={setChange} />

                {/* VIDEO AREA */}
                {(element_type === "movie" || element_type === "episode") &&
                    <VideoElement setChange={setChange} videoState={videoState} setVideoState={setVideoState} />
                }

                <Grid item xs={12}>
                    <Typography>Quieres que este contenido este disponible ahora?</Typography>
                    <Stack direction="row" alignItems="center">
                        <Switch
                            color='success'
                            checked={online}
                            onChange={(e) => setDataForm({ ...dataForm, online: e.target.checked })}
                            disabled={disabledOnlineValidation()}
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

                            <ButtonItem onClick={handleClickSave} variant='contained' btnName={element_type} />
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
        </>
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
function GeneresSelectorInput({ value, generesType }) {
    const { dataForm, setDataForm } = useContext(databaseContext)

    const [genresValue, setGenresValue] = useState([])

    const genres = generesType === "movie" ? genresMovies : genresTv;

    const indexOfGeneres = value && value.map(g => genres.map(obj => obj.id).indexOf(g))

    const arrayGenresObject = indexOfGeneres && indexOfGeneres.map(i => genres[i])

    const handleChangeGenres = (e, value) => {
        setGenresValue(value)
        const newGenres_ids = value.map(g => g.id)
        setDataForm({ ...dataForm, genre_ids: newGenres_ids })
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