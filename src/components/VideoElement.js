import { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { Button, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import { Cancel, CheckCircle, Delete } from '@mui/icons-material'
import { filesContext } from '../contexts/FilesProvider'
import DeleteDialog from './DeleteDialog'
import { databaseContext } from '../contexts/DatabaseProvider'
import { enqueueSnackbar } from 'notistack'

const formatRuntime = (runtime) => {
    const hours = Math.floor(runtime / 60)
    const minutes = Math.floor(runtime % 60)
    const minutesFormat = minutes < 10 ? "0" + minutes : minutes

    return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutesFormat + "m" : ""}`
}

// const dialogInitialState = { data: {}, title: "", content: "", actionFunction: () => { } }
const videoInitialState = { video_path: '', video_start: '', video_end: '', video_start_intro: '', video_end_intro: '' }

export default function VideoElement({ videoState, setVideoState }) {
    const { REACT_APP_API_URL } = process.env
    const { setVideoFile, deleteSingleFile } = useContext(filesContext)
    const { dataForm, setDataForm, searchType, updateData } = useContext(databaseContext)

    const { video_duration_formated, video_path, duration } = dataForm;

    const [openDialog, setOpenDialog] = useState(false)
    const [dialog, setDialog] = useState({})

    const videoRef = useRef(null)

    const handleOnSelectVideo = (e) => {
        const file = e.target.files[0]

        const srcPath = window.URL.createObjectURL(file)

        setDataForm({ ...dataForm, ...videoInitialState, video_path: srcPath })
        setVideoFile(file)
    }
    const handleOnLoadVideo = (e) => {
        const video = e.target

        const video_duration = video.duration
        const video_duration_formated = formatRuntime(video_duration / 60)
        const video_end = dataForm.video_end > 0 ? dataForm.video_end : video_duration

        setDataForm({
            ...dataForm,
            video_duration,
            video_duration_formated,
            video_end
        })
    }
    const handleDeleteVideoFile = () => {
        const { video_path } = dataForm

        // If you want delete before upload file
        if (video_path.includes('blob:')) {
            window.URL.revokeObjectURL(dataForm.video_path)
            setDataForm({ ...dataForm, ...videoInitialState })
            setVideoFile({})
            return
        }

        // Delete file from the backend system
        setOpenDialog(true)

        const handleDelete = async () => {
            const responseFile = await deleteSingleFile(dataForm.video_path)

            if (responseFile.resStatus === "success") {
                const response = await updateData(videoInitialState)

                if (response.resStatus === 'success') {
                    setDataForm({ ...dataForm, ...videoInitialState })
                    setVideoFile({})
                    enqueueSnackbar('El video fue eliminado', { variant: 'success' })
                }
            }
        }

        return setDialog({
            title: "Desea eliminar el video?",
            content: "El video de: " + dataForm.title + " sera eliminado del sistema también",
            actionFunction: handleDelete
        })
    }
    const handleVideoError = (e) => {
        setVideoFile({})
        setDataForm({ ...dataForm, video_path: '' })
    }

    useEffect(() => {
        if (videoState === 'stop') {
            videoRef.current?.pause()
        }
    }, [videoState])


    return (
        <Grid container item xs={12}>
            <Grid
                item
                xs={12}
                children={<Typography align='center' variant="h5" children="Video" />}
            />

            <Grid item xs={12} position="relative">
                {video_path ?
                    <Grid item container>
                        <Grid item xs={12}>
                            <IconButton color='error' sx={{ position: "absolute", right: 0, zIndex: "5" }} onClick={handleDeleteVideoFile}><Delete fontSize="large" /></IconButton>
                            <video
                                controls
                                width="100%"
                                src={video_path?.includes('http') ? video_path : `${REACT_APP_API_URL}/file/` + video_path}
                                ref={videoRef}
                                onLoadedData={handleOnLoadVideo}
                                onError={handleVideoError}
                                onPlay={() => setVideoState('play')}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography width="auto" display="flex">
                                Duración real: {video_duration_formated}
                                &nbsp;
                                <Tooltip title={duration !== video_duration_formated && "La duración del video no es igual a la del formulario"} placement='top' arrow>
                                    {duration === video_duration_formated ?
                                        <CheckCircle color='success' /> :
                                        <Cancel color='error' />}
                                </Tooltip>
                            </Typography>
                        </Grid>

                        <TimeForm ref={videoRef} />

                        {searchType === "tv" &&
                            <>
                                <Grid item xs={12} mt={1} children={<Typography variant='h6' children="Intro" />} />
                                <TimeForm ref={videoRef} intro />
                            </>
                        }
                    </Grid>

                    :
                    <TextField fullWidth type='file' inputProps={{ accept: "video/*" }} onChange={handleOnSelectVideo} />
                }
            </Grid>

            {openDialog &&
                <DeleteDialog open={openDialog} setOpen={setOpenDialog} dialog={dialog} setDialog={setDialog} />
            }
        </Grid>
    )
}

// TIME SECTION ELEMENT
const TimeForm = forwardRef(function ({ intro }, ref) {
    const { dataForm, setDataForm } = useContext(databaseContext)

    const { video_start, video_end, video_start_intro, video_end_intro } = dataForm

    const handleClickMark = (value) => {
        const currentTime = ref.current.currentTime * 1

        setDataForm({ ...dataForm, [value]: currentTime })
    }
    const handleClickGo = (value) => {
        const time = { video_start, video_end, video_start_intro, video_end_intro }

        ref.current.currentTime = time[value]
    }
    const handleChangeInput = (e) => {
        const value = e.target.value * 1 || 0
        const name = e.target.name

        setDataForm({ ...dataForm, [name]: value })
    }

    return (
        <Grid container item xs={12} spacing={1} my={2} alignItems="center">
            <InputItem
                label={!intro ? "Inicio" : "Intro inicio"}
                name={!intro ? "video_start" : "video_start_intro"}
                value={(!intro ? video_start : video_start_intro) || 0}
                onChange={handleChangeInput}
            />

            <ButtonsItem clickGo={handleClickGo} clickMark={handleClickMark} intro={intro || false} value="start" />

            <InputItem
                label={!intro ? "Fin" : "Intro fin"}
                name={!intro ? "video_end" : "video_end_intro"}
                value={(!intro ? video_end : video_end_intro) || 0}
                onChange={handleChangeInput}
            />

            <ButtonsItem clickGo={handleClickGo} clickMark={handleClickMark} intro={intro || false} value="end" />
        </Grid>
    )
})

// INPUT ITEM
function InputItem(props) {
    return <Grid item xs={12} sm={3}
        children={<TextField fullWidth {...props} />}
    />
}

// BUTTON ITEM
function ButtonsItem({ clickGo, clickMark, intro, value }) {
    const val = intro ? value + "_intro" : value

    return (
        <Grid item xs={12} sm={3} container spacing={.5}>
            {/* MARK BUTTON */}
            <Grid item>
                <Button
                    variant='contained'
                    size='small'
                    onClick={() => clickMark('video_' + val)}
                    color={value === "start" ? 'success' : "error"}
                    children={`Marcar ${value === "start" ? "inicio" : "fin"}`}
                />
            </Grid>
            {/* GO TO BUTTON */}
            <Grid item>
                <Button variant="outlined" size='small' color='info' onClick={() => clickGo('video_' + val)} children="Ir" />
            </Grid>
        </Grid>
    )
}