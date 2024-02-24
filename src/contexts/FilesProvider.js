import { createContext, useContext, useState } from "react"
import { useSnackbar } from "notistack"
import { databaseContext } from "./DatabaseProvider"
import { globalContext } from "./GlobalProvider"

export const filesContext = createContext()

export default function FilesProvider({ children }) {
    const { REACT_APP_API_URL } = process.env
    const { dataForm, setDataForm } = useContext(databaseContext)
    const { setLoadingResponse } = useContext(globalContext)

    const { enqueueSnackbar } = useSnackbar();

    // FILE STATES
    const [videoFile, setVideoFile] = useState({})
    const [posterFile, setPosterFile] = useState({})
    const [backdropFile, setBackdropFile] = useState({})


    ////--- POST
    const uploadSingleFile = async (file_type, unique_title) => {
        setLoadingResponse(true)

        const formData = new FormData()

        const files = {
            'video': videoFile,
            'poster': posterFile,
            'backdrop': backdropFile
        }

        formData.append('file', files[file_type])

        const query = `${REACT_APP_API_URL}/file/upload/${file_type}/${unique_title}`

        return fetch(query, {
            method: 'POST',
            body: formData
        })
            .then(thenFuntion)
            .catch(catchFuntion)
    }
    const uploadFiles = async (unique_title) => {
        const responses = {}

        if (posterFile.name) {
            const uploadInfo = await uploadSingleFile('poster', unique_title)
            if (uploadInfo.resStatus === 'success') {
                responses.poster = uploadInfo._res._id
            } else {
                window.URL.revokeObjectURL(dataForm.poster_path)
                setDataForm({ ...dataForm, poster_path: '' })
                enqueueSnackbar(uploadInfo.message, { variant: uploadInfo.resStatus })
            }
        }
        if (backdropFile.name) {
            const uploadInfo = await uploadSingleFile('backdrop', unique_title)
            if (uploadInfo.resStatus === 'success') {
                responses.backdrop = uploadInfo._res._id
            } else {
                window.URL.revokeObjectURL(dataForm.backdrop_path)
                setDataForm({ ...dataForm, backdrop_path: '' })
                enqueueSnackbar(uploadInfo.message, { variant: uploadInfo.resStatus })
            }
        }
        if (videoFile.name) {
            const uploadInfo = await uploadSingleFile('video', unique_title)
            if (uploadInfo.resStatus === 'success') {
                responses.video = uploadInfo._res._id
            } else {
                window.URL.revokeObjectURL(dataForm.video_path)
                setDataForm({ ...dataForm, video_path: '' })
                enqueueSnackbar(uploadInfo.message, { variant: uploadInfo.resStatus })
            }
        }

        return responses
    }

    ////--- GET

    ////--- PUT
    const updateNameSingleFile = async (id, unique_title) => {
        setLoadingResponse(true)

        return fetch(`${REACT_APP_API_URL}/file/${id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ unique_title })
        })
            .then(thenFuntion)
            .catch(catchFuntion)
    }
    const updateNameFiles = async (unique_title) => {
        const responses = {};

        const { video_path, poster_path, backdrop_path } = dataForm;

        if (!poster_path.includes('http') && poster_path) {
            responses.poster_path = await updateNameSingleFile(poster_path, unique_title)
        }
        if (!backdrop_path.includes('http') && backdrop_path) {
            responses.backdrop_path = await updateNameSingleFile(backdrop_path, unique_title)
        }
        if (!video_path?.includes('http') && video_path) {
            responses.video_path = await updateNameSingleFile(video_path, unique_title)
        }

        return responses
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
        const files = ['poster', 'backdrop', 'video']

        const responses = { allOk: true }

        files.forEach(async (file) => {
            if (element[file + '_path'] && !element[file + '_path'].includes('http')) {
                const responseDelete = await deleteSingleFile(element[file + '_path'])

                responses[file + '_path'] = responseDelete

                if (responseDelete.resStatus === 'error') {
                    responses.allOk = false

                    enqueueSnackbar(responseDelete.message, { variant: responseDelete.resStatus })
                }
            }
        })

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
                deleteFiles,
                deleteSingleFile,
                updateNameFiles,
            }}
        >
            {children}
        </filesContext.Provider>
    )
}