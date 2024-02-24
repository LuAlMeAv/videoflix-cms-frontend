import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { databaseContext } from "../contexts/DatabaseProvider"
import { Button, Divider, Grid, IconButton, Modal, Tooltip, Typography } from "@mui/material"
import { Close, Delete, Edit, HideImage, Visibility, WebAsset, WebAssetOff } from "@mui/icons-material"
import { enqueueSnackbar } from "notistack"
import DeleteDialog from "../components/DeleteDialog"
import { filesContext } from "../contexts/FilesProvider"

const type_of_element = {
    movie: 'Película',
    serie: 'Serie',
    season: 'Temporada',
    episode: 'Episodio',
}

export default function ViewPage() {
    const { REACT_APP_API_URL } = process.env
    const { getElementById, updateData, deleteData } = useContext(databaseContext)
    const { deleteFiles } = useContext(filesContext)

    const { id, element_type } = useParams()
    const navigate = useNavigate()

    const [element, setElement] = useState({})
    const [videoModal, setVideoModal] = useState(false)
    const [openDialog, setOpenDialog] = useState(false)
    const [dialog, setDialog] = useState()

    const image_path = (element_type === 'episode' ? element.backdrop_path : element.poster_path)

    const getData = async () => {
        const elementData = await getElementById(element_type, id)

        const element = elementData.element;

        if (!element) {
            return enqueueSnackbar('El elemento no existe', { variant: 'error' })
        }

        if (element.online && (element_type === 'season' && element.episodes < 1)) {
            const responseUpdate = await updateData({ online: false }, element._id, element_type)

            if (responseUpdate.resStatus === 'success') {
                element.online = false
            }

            enqueueSnackbar(responseUpdate.message, { variant: responseUpdate.resStatus })
        }

        if (element.online && (element_type === 'serie' && element.seasons < 1)) {
            const responseUpdate = await updateData({ online: false }, element._id, element_type)

            if (responseUpdate.resStatus === 'success') {
                element.online = false
            }

            enqueueSnackbar(responseUpdate.message, { variant: responseUpdate.resStatus })
        }

        setElement(element || {})
    }
    const handleChangeOnline = async () => {
        if ((element_type === 'episode' || element_type === 'movie') && !element.video_path) {
            return enqueueSnackbar("No hay video para realizar esta acción", { variant: 'error' })
        } else if (element_type === 'season' && (!element.episodes || element.episodes.length < 1)) {
            return enqueueSnackbar("No hay episodios para realizar esta acción", { variant: 'error' })
        } else if (element_type === 'serie' && (!element.seasons || element.seasons.length < 1)) {
            return enqueueSnackbar("No hay Temporadas para realizar esta acción", { variant: 'error' })
        }

        const updateInfo = await updateData({ online: !element.online }, element._id, element_type)

        if (updateInfo.resStatus === 'success') {
            setElement({ ...element, online: !element.online })
        }
        enqueueSnackbar(updateInfo.message, { variant: updateInfo.resStatus })
    }
    const handleDelete = async (element, type, from) => {
        if (type === 'serie' && element.seasons?.length > 0) {
            return enqueueSnackbar('La serie aún contine temporadas', { variant: 'error' })
        }

        if (type === 'season' && element.episodes?.length > 0) {
            return enqueueSnackbar('La temporadas aún contine capítulos', { variant: 'error' })
        }

        const delete_function = async () => {
            // Delete files
            const responseDelete = await deleteFiles(element)

            if (!responseDelete.allOk) {
                return
            }

            delete_type[type](element, from)
        }

        setOpenDialog(true)

        const title = type === 'episode' ? element.episode_name : type === 'season' ? element.season_number : element.title

        return setDialog({
            title: "Eliminar " + type_of_element[type] + '?',
            content: "Estas seguro que quieres eliminar " + type_of_element[type] + ': ' + title,
            actionFunction: () => delete_function()
        })
    }
    const deleteMovie = async (element) => {
        // Delete data
        const responseDeleteData = await deleteData('movie', element._id)
        if (responseDeleteData.resStatus === 'success') {
            navigate(-1)
        }

        enqueueSnackbar(responseDeleteData.message, { variant: responseDeleteData.resStatus })
    }
    const deleteSerie = async (element) => {
        // Delete Data
        const responseDeleteData = await deleteData('serie', element._id)
        if (responseDeleteData.resStatus === 'success') {
            navigate(-1)
        }

        enqueueSnackbar(responseDeleteData.message, { variant: responseDeleteData.resStatus })
    }
    const deleteSeason = async (element, from) => {
        // delete Data
        const responseDeleteData = await deleteData('season', element._id)
        enqueueSnackbar(responseDeleteData.message, { variant: responseDeleteData.resStatus })

        // update serie data
        const parentData = await getElementById('serie', element.serie_id)
        const parentElement = parentData.element

        const newSeasons = parentElement.seasons.filter((se) => se[element.season_number] !== element._id)

        const responseUpdate = await updateData({ seasons: newSeasons }, parentElement._id, 'serie')
        if (responseUpdate.resStatus === 'success') {
            setElement({ ...element, seasons: newSeasons })
        }

        if (responseDeleteData.resStatus === 'success' && responseUpdate.resStatus === 'success') {
            if (from === 'view') {
                navigate(-1)
            }
        }

        enqueueSnackbar(responseUpdate.message, { variant: responseUpdate.resStatus })
    }
    const deleteEpisode = async (element, from) => {
        // delete Data
        const responseDeleteData = await deleteData('episode', element._id)
        enqueueSnackbar(responseDeleteData.message, { variant: responseDeleteData.resStatus })

        // update season data
        const parentData = await getElementById('season', element.season_id)
        const parentElement = parentData.element

        const newEpisodes = parentElement.episodes.filter((ep) => ep[element.episode_number] !== element._id)

        const responseUpdate = await updateData({ episodes: newEpisodes }, parentElement._id, 'season')
        if (responseUpdate.resStatus === 'success') {
            setElement({ ...element, episodes: newEpisodes })
        }

        if (responseDeleteData.resStatus === 'success' && responseUpdate.resStatus === 'success') {
            if (from === 'view') {
                navigate(-1)
            }
        }

        enqueueSnackbar(responseUpdate.message, { variant: responseUpdate.resStatus })
    }

    const delete_type = {
        'movie': deleteMovie,
        'serie': deleteSerie,
        'season': deleteSeason,
        'episode': deleteEpisode
    }

    useEffect(() => {
        getData()

        // eslint-disable-next-line
    }, [id, element_type, element.episodes?.length, element.seasons?.length])

    return (
        <>
            {!element.unique_title ? <>
                <Typography variant="h4" children='404' align='center' paragraph />
                <Typography variant="h5" children='Elemento no enconrado' align='center' paragraph />
                <Button children='Atras' onClick={() => navigate(-1)} variant="contained" sx={{ display: 'block', m: 'auto' }} />
            </> : <>
                <Grid container p={5} spacing={1} maxWidth={1080} m='auto'>

                    {/* SECCTION I 'HEADER' */}
                    <Grid container item xs={12} spacing={1} mb={5}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="h4">{type_of_element[element_type]}</Typography>
                        </Grid>
                        {(element_type === 'serie' || element_type === 'season') &&
                            <Grid item xs={12} sm={6} display='flex' justifyContent='end'>
                                <Button variant="contained" color="success" onClick={() => navigate("/new/" + (element_type === "serie" ? "season" : "episode") + "/" + id)}>
                                    Agregar {element_type === 'serie' ? 'temporada' : 'Episodio'}
                                </Button>
                            </Grid>
                        }
                    </Grid>

                    {/* SECCTION II 'IMAGE' */}
                    <Grid container item xs={12} sm={3} spacing={1} alignContent='start'>

                        {/* INTERACTIVE BUTTONS */}
                        <Grid item xs={12} display='flex' justifyContent='center' gap={1}>
                            <ButtonAction
                                icon={element.online ? 'online' : 'offline'}
                                event={handleChangeOnline}
                                placeholder={element.online ? 'En linea' : 'Fuera de linea'}
                                color={element.online ? 'success' : 'error'}
                            />
                            <ButtonAction
                                icon='edit'
                                event={() => navigate('/edit/' + element_type + '/' + id)}
                                placeholder='Editar'
                                color='warning'
                            />
                            <ButtonAction
                                icon='delete'
                                event={() => handleDelete(element, element_type, 'view')}
                                placeholder='Eliminar'
                                color='error'
                            />
                        </Grid>
                        <Grid item xs={11} m='auto' textAlign='center'>
                            {image_path ?
                                <img src={image_path?.includes('http') ? image_path : `${REACT_APP_API_URL}/file/${image_path}`} alt={element.title + ' ' + element_type} width='100%' />
                                :
                                <HideImage sx={{ fontSize: '12rem', color: 'gray' }} />
                            }
                        </Grid>
                        {(element_type === 'movie' || element_type === 'episode') &&
                            <Grid item xs={12} display='flex' justifyContent='center'>
                                <Button disabled={element.video_path ? false : true} variant="outlined" onClick={() => setVideoModal(true)}>Ver video</Button>
                            </Grid>
                        }
                    </Grid>

                    {/* SECCTION III 'INFO' */}
                    <Grid container item xs={12} sm={9} alignContent='start'>
                        <Grid item xs={12}>
                            <Typography variant="h5">{element.title}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" >{element.original_title}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography paragraph>{element.year}</Typography>
                        </Grid>
                        {(element_type === 'season' || element_type === 'episode') &&
                            <Grid item xs={12}>
                                <Typography>{element_type === 'season' ? 'Temporada ' + element.season_number : 'Episodio ' + element.episode_number}</Typography>
                            </Grid>
                        }
                        {element_type === 'episode' &&
                            <Grid item xs={12}>
                                <Typography>{element.episode_name}</Typography>
                            </Grid>
                        }
                        <Grid item xs={12}>
                            <Typography>{element.duration}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography>{element.overview}</Typography>
                        </Grid>
                    </Grid>
                </Grid>

                {/* SEASONS / EPISODES */}
                {((element_type === 'serie' && element.seasons?.length > 0) || (element_type === 'season' && element.episodes?.length > 0)) && <>
                    <Divider />
                    <Typography pt={2} variant="h4" textAlign='center'>{element_type === 'serie' ? 'Temporadas' : 'Capitulos'}</Typography>

                    <Grid container mt={5}>
                        {element[element_type === 'serie' ? 'seasons' : 'episodes']?.map((element, i) => {
                            i++
                            let e;

                            for (const prop in element) {
                                e = element[prop]
                            }

                            return <ChildItem
                                key={i}
                                id={e}
                                elementParent={element_type}
                                handleDelete={handleDelete}
                                handleChangeOnline={handleChangeOnline}
                            />
                        })}
                    </Grid>
                </>}
            </>}

            {/* MODAL/DIALOG */}
            {videoModal &&
                <VideoModal open={videoModal} setOpen={setVideoModal} src={element.video_path} />
            }
            {openDialog &&
                <DeleteDialog open={openDialog} setOpen={setOpenDialog} dialog={dialog} setDialog={setDialog} />
            }
        </>
    )
}

//  MODAL ELEMENT
const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
    bgcolor: 'background.paper',
    border: '2px solid #ccc',
    boxShadow: 24,
    pb: 4,
    borderRadius: '5px',
};

const VideoModal = ({ open, setOpen, src }) => {
    const { REACT_APP_API_URL } = process.env
    const handleClose = () => {
        setOpen(false)
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
        >
            <Grid container sx={modalStyle}>
                <Grid item xs={12} display='flex' justifyContent='end' pr={4} pt={1}>
                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Grid>
                <Grid item xs={10} m='auto'>
                    <video controls autoPlay src={REACT_APP_API_URL + '/file/' + src} width='100%' />
                </Grid>
            </Grid>
        </Modal>
    )
}

//  CHILDREN ELEMENT
const ChildItem = ({ id, elementParent, handleDelete }) => {
    const { REACT_APP_API_URL } = process.env
    const { getElementById, updateData } = useContext(databaseContext)

    const [children, setChildren] = useState({})
    const navigate = useNavigate()

    const element_type = elementParent === 'serie' ? 'season' : 'episode'
    const image_path = (element_type === 'season' ? children.poster_path : children.backdrop_path)

    const getChildrenData = async () => {
        const elementData = await getElementById(element_type, id)
        setChildren(elementData.element || {})
    }
    const handleOnline = async () => {
        if (element_type === 'episode' && !children.video_path) {
            return enqueueSnackbar("No hay video para realizar esta acción", { variant: 'error' })
        } else if (element_type === 'season' && (!children.episodes || children.episodes.length < 1)) {
            return enqueueSnackbar("No hay episodios para realizar esta acción", { variant: 'error' })
        }

        const updateInfo = await updateData({ online: !children.online }, children._id, element_type)

        if (updateInfo.resStatus === 'success') {
            setChildren({ ...children, online: !children.online })
        }

        enqueueSnackbar(updateInfo.message, { variant: updateInfo.resStatus })
    }
    const handleNavigate = () => navigate('/view/' + element_type + '/' + id)

    useEffect(() => {
        getChildrenData()

        // eslint-disable-next-line
    }, [id])

    return (
        <Grid item xs={12} sm={6} md={3}>
            {(children?.season_number && elementParent === 'serie') &&
                <Grid item xs={12}>
                    <Typography textAlign='center' p={1}>{'Temporada ' + children.season_number}</Typography>
                </Grid>
            }
            {children?.episode_number &&
                <Grid item xs={12}>
                    <Typography textAlign='center' noWrap overflow="auto" p={1}>{children.episode_name ? children.episode_number + ': ' + children.episode_name : 'Episodio ' + children.episode_number}</Typography>
                </Grid>
            }
            <Grid item xs={9} display='flex' m='auto'>
                <img src={image_path?.includes('http') ? image_path : `${REACT_APP_API_URL}/file/${image_path}`} alt={children?.unique_title} width='100%' loading="lazy" />
            </Grid>

            <Grid item xs={12} display='flex' justifyContent='center' gap={1}>
                <ButtonAction icon={children.online ? 'online' : 'offline'} placeholder={children.online ? 'En línea' : 'Fuera de línea'} event={handleOnline} color={children.online ? 'success' : 'error'} />
                <ButtonAction icon='view' placeholder='Ver detalles' event={handleNavigate} color='info' />
                <ButtonAction icon='delete' placeholder='Eliminar' event={() => handleDelete(children, element_type, 'preview')} color='error' />
            </Grid>
        </Grid>
    )
}

// BUTTON ELEMENT
const ButtonAction = ({ event, icon, placeholder, color, disabled }) => {
    const icons = {
        'online': <WebAsset />,
        'offline': <WebAssetOff />,
        'view': <Visibility />,
        'edit': <Edit />,
        'delete': <Delete />,
    }

    return (
        <Tooltip title={placeholder}>
            <IconButton disabled={disabled} onClick={event} color={color}>
                {icons[icon]}
            </IconButton>
        </Tooltip>
    )
}