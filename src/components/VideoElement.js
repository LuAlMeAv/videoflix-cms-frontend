import { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { Button, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import { Cancel, CheckCircle, Delete } from '@mui/icons-material'
import { filesContext } from '../contexts/FilesProvider'
import DeleteDialog2 from './DeleteDialog'

const formatRuntime = (runtime) => {
    const hours = Math.floor(runtime / 60)
    const minutes = Math.floor(runtime % 60)
    const minutesFormat = minutes < 10 ? "0" + minutes : minutes

    return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutesFormat + "m" : ""}`
}

const initialState = { data: {}, title: "", content: "", actionFunction: () => { } }

export default function VideoElement({ videoState, setVideoState }) {
    const { dataForm, setDataForm, setVideoFile, searchType, deleteFile } = useContext(filesContext)

    const { video_duration_formated, video_path, duration } = dataForm;

    const [openDialog, setOpenDialog] = useState(false)
    const [dialog, setDialog] = useState(initialState)

    const videoRef = useRef(null)

    const handleOnSelectVideo = (e) => {
        setVideoState('play')

        const file = e.target.files[0]

        const srcPath = window.URL.createObjectURL(file)

        setDataForm({ ...dataForm, video_path: srcPath })
        setVideoFile(file)
    }
    const handleOnLoadVideo = (e) => {
        const video = e.target

        const video_duration = video.duration
        const video_duration_formated = formatRuntime(video_duration / 60)

        setDataForm({ ...dataForm, video_duration, video_duration_formated, video_end: video_duration })
    }
    const handleDeleteVideoFile = () => {
        setOpenDialog(true)

        const handleDelete = async () => {
            const fileID = dataForm.video_path.split('/').reverse()[0]

            const response = await deleteFile(fileID)

            if (response.resStatus === "success") {
                setDataForm({ ...dataForm, video_path: "", video_start: 0, video_end: 0, video_start_intro: 0, video_end_intro: 0 })
                setVideoFile({})
            }
        }

        setDialog({
            title: "Desea eliminar el video?",
            content: "Estas seguro que quieres eliminar el video perteneciente a: " + dataForm.title,
            actionFunction: handleDelete
        })
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
                            <IconButton color='error' sx={{ position: "absolute", right: 0, zIndex: "99" }} onClick={handleDeleteVideoFile}><Delete fontSize="large" /></IconButton>
                            <video
                                controls
                                width="100%"
                                src={video_path}
                                ref={videoRef}
                                onLoadedData={handleOnLoadVideo}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography width="auto" display="flex">
                                Duración real: {video_duration_formated}
                                <Tooltip title={duration !== video_duration_formated && "La duració del video no es igual a la del formulario"} placement='top' arrow>
                                    {duration === video_duration_formated ?
                                        <CheckCircle color='success' /> :
                                        <Cancel color='error' />}
                                </Tooltip>
                            </Typography>
                        </Grid>

                        <TimeModule ref={videoRef} />

                        {searchType === "tv" && <>
                            <Grid item xs={12} mt={1} children={<Typography variant='h6' children="Intro" />} />
                            <TimeModule ref={videoRef} type="intro" />
                        </>}
                    </Grid>
                    :
                    <TextField fullWidth type='file' inputProps={{ accept: "video/*" }} onChange={handleOnSelectVideo} />
                }
            </Grid>

            {openDialog &&
                <DeleteDialog2 open={openDialog} setOpen={setOpenDialog} dialog={dialog} setDialog={setDialog} />
            }
        </Grid>
    )
}

const TimeModule = forwardRef(function ({ type }, ref) {
    const { dataForm, setDataForm } = useContext(filesContext)

    const [videoForm, setVideoForm] = useState({ start: 0, end: 0, start_intro: 0, end_intro: 0 })

    const { start, end, start_intro, end_intro, } = videoForm

    const handleClickMark = (value) => {
        const currentTime = ref.current.currentTime * 1
        const name = value
        const name2 = 'video_' + value

        setVideoForm({ ...videoForm, [name]: currentTime })
        setDataForm({ ...dataForm, [name2]: currentTime })
    }
    const handleClickGo = (value) => {
        const example = { start, end, start_intro, end_intro }

        ref.current.currentTime = example[value]
    }
    const handleChangeInput = (e) => {
        const value = e.target.value * 1 || 0
        const name = e.target.name
        const name2 = 'video_' + name

        setVideoForm({ ...videoForm, [name]: value })
        setDataForm({ ...dataForm, [name2]: value })
    }

    useEffect(() => {
        setVideoForm({ ...videoForm, end: dataForm.video_duration })
        // eslint-disable-next-line
    }, [dataForm.video_duration])

    return (
        <Grid container item xs={12} spacing={1} my={2} alignItems="center">
            <InputItem
                label={type ? "Inicio intro" : "Inicio"}
                name={type ? "start_intro" : "start"}
                value={type ? start_intro : start}
                onChange={handleChangeInput}

            />

            <ButtonsItem clickGo={handleClickGo} clickMark={handleClickMark} type={type} value="start" />

            <InputItem
                label={type ? "Fin intro" : "Fin"}
                name={type ? "end_intro" : "end"}
                value={type ? end_intro : end}
                onChange={handleChangeInput}
            />

            <ButtonsItem clickGo={handleClickGo} clickMark={handleClickMark} type={type} value="end" />
        </Grid>
    )
})

function InputItem(props) {
    return <Grid item xs={12} sm={3}
        children={<TextField fullWidth {...props} />}
    />
}

function ButtonsItem(props) {
    const { clickGo, clickMark, type, value } = props

    const val = type === "intro" ? value + "_intro" : value

    return (
        <Grid item xs={12} sm={3} container spacing={.5}>
            {/* MARK BUTTON */}
            <Grid item>
                <Button
                    variant='contained'
                    onClick={() => clickMark(val)}
                    color={value === "start" ? 'success' : "error"}
                    children={`Marcar ${value === "start" ? "inicio" : "fin"}`}
                />
            </Grid>
            {/* GO TO BUTTON */}
            <Grid item>
                <Button variant="outlined" color='info' onClick={() => clickGo(val)} children="Ir" />
            </Grid>
        </Grid>
    )
}