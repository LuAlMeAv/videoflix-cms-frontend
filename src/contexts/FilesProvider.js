import { createContext, useContext, useState } from "react"
import { useSnackbar } from "notistack"
import { databaseContext } from "./DatabaseProvider"
import { globalContext } from "./GlobalProvider"

export const filesContext = createContext()

export default function FilesProvider({ children }) {
    const { REACT_APP_API_URL } = process.env
    const { dataForm, setDataForm, uniqueTitle, elementType } = useContext(databaseContext)
    const { setLoadingResponse } = useContext(globalContext)

    const { enqueueSnackbar } = useSnackbar();

    // FILE STATES
    const [videoFile, setVideoFile] = useState({})
    const [posterFile, setPosterFile] = useState({})
    const [backdropFile, setBackdropFile] = useState({})


    ////--- POST
    const uploadSingleFile = async (file_type) => {
        setLoadingResponse(true)

        const formData = new FormData()

        const files = {
            'video': videoFile,
            'poster': posterFile,
            'backdrop': backdropFile
        }

        formData.append('file', files[file_type])

        const query = `${REACT_APP_API_URL}/file/upload/${file_type}/${uniqueTitle()}`

        return fetch(query, {
            method: 'POST',
            body: formData
        })
            .then(thenFuntion)
            .catch(catchFuntion)
    }
    const uploadFiles = async () => {
        let responses = {}

        // Upload video file
        const uploadVideo = dataForm.video_path.includes('blob:')
        if ((elementType === 'movie' || elementType === 'episode') && uploadVideo) {
            const response = await uploadSingleFile('video')

            if (response.resStatus === 'success') {
                responses.video = response._res._id
            } else {
                enqueueSnackbar(response.message, { variant: response.resStatus })
            }
        }
        // Upload poster file
        const uploadPoster = dataForm.poster_path.includes('blob:')
        if ((elementType === 'movie' || elementType === 'serie' || elementType === 'season') && uploadPoster) {
            const response = await uploadSingleFile('poster')

            if (response.resStatus === 'success') {
                responses.poster = response._res._id
            } else {
                enqueueSnackbar(response.message, { variant: response.resStatus })
            }
        }
        // Upload backdrop file
        const uploadBackdrop = dataForm.backdrop_path.includes('blob:')
        if ((elementType === 'movie' || elementType === 'serie' || elementType === 'episode') && uploadBackdrop) {
            const response = await uploadSingleFile('backdrop')

            if (response.resStatus === 'success') {
                responses.backdrop = response._res._id
            } else {
                enqueueSnackbar(response.message, { variant: response.resStatus })
            }
        }

        setDataForm({
            ...dataForm,
            video_path: responses.video ? responses.video : dataForm.video_path,
            poster_path: responses.poster ? responses.poster : dataForm.poster_path,
            backdrop_path: responses.backdrop ? responses.backdrop : dataForm.backdrop_path
        })

        return responses
    }

    ////--- GET

    ////--- PUT
    const updateSingleFile = async (id) => {
        setLoadingResponse(true)

        return fetch(`${REACT_APP_API_URL}/file/${id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ unique_title: uniqueTitle() })
        })
            .then(thenFuntion)
            .catch(catchFuntion)
    }
    const updateFiles = async () => {
        const responseFiles = await uploadFiles()

        const responses = {};

        const { video_path, poster_path, backdrop_path } = dataForm;

        if (!poster_path.includes('http') && poster_path) {
            responses.poster_path = await updateSingleFile(poster_path)
        }
        if (!backdrop_path.includes('http') && backdrop_path) {
            responses.backdrop_path = await updateSingleFile(backdrop_path)
        }
        if (!video_path.includes('http') && video_path) {
            responses.video_path = await updateSingleFile(video_path)
        }

        console.log(responses)
        return responseFiles
    }

    ////--- DELETE
    const deleteSingleFile = async (id) => {
        setLoadingResponse(true)

        return fetch(`${REACT_APP_API_URL}/file/${id}`, {
            method: 'DELETE'
        })
            .then(thenFuntion)
            .catch(catchFuntion)
    }
    const deleteFiles = async (element) => {
        const { poster_path, backdrop_path, video_path } = element

        const responses = {}

        if (!poster_path.includes('http')) {
            responses.poster_path = await deleteSingleFile(poster_path)
        }
        if (!backdrop_path.includes('http')) {
            responses.backdrop_path = await deleteSingleFile(backdrop_path)
        }
        if (!video_path.includes('http')) {
            responses.video_path = await deleteSingleFile(video_path)
        }

        return responses
    }

    const clearFiles = () => {
        setVideoFile({})
        setPosterFile({})
        setBackdropFile({})
        window.URL.revokeObjectURL(dataForm.video_path)
        window.URL.revokeObjectURL(dataForm.poster_path)
        window.URL.revokeObjectURL(dataForm.backdrop_path)
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
        <filesContext.Provider
            value={{
                clearFiles,
                setVideoFile,
                setPosterFile,
                setBackdropFile,

                uploadFiles,
                updateFiles,
                deleteFiles,
                deleteSingleFile,
            }}
        >
            {children}
        </filesContext.Provider>
    )
}