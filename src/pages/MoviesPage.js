import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { IconButton, Tooltip } from '@mui/material';
import { Cancel, CheckCircle, Delete, Visibility, WebAsset, WebAssetOff } from '@mui/icons-material';
import { databaseContext } from '../contexts/DatabaseProvider';
import { filesContext } from '../contexts/FilesProvider';
import DeleteDialog2 from '../components/DeleteDialog';
import TableElement from '../components/TableElement';

const getFormatedDate = (p) => {
    const date = new Date(p.value)
    const year = date.getFullYear()
    const real_month = date.getMonth() + 1
    const month = real_month > 9 ? real_month : '0' + real_month
    const day = date.getDate() > 9 ? date.getDate() : '0' + date.getDate()

    return year > 1000 ? `${day}/${month}/${year}` : '00/00/00'
}

export default function AutoHeightOverlayNoSnap() {
    const { getAllMovies, allMovies, deleteData } = useContext(databaseContext)
    const { deleteFiles } = useContext(filesContext)

    const { REACT_APP_API_URL } = process.env

    const [openDialog, setOpenDialog] = useState(false)
    const [dialog, setDialog] = useState()
    const [width, setWidth] = useState(0)

    const navigate = useNavigate()

    const handleClickDelete = async (data) => {
        setOpenDialog(true)

        const handleDelete = async () => {
            const responseDeleteFiles = await deleteFiles(data)
            if (!responseDeleteFiles.allOk) {
                return enqueueSnackbar('Error al eliminar los archivos, intente de nuevo', { variant: 'error' })
            }

            const responseDB = await deleteData('movie', data._id)

            enqueueSnackbar(responseDB.message, { variant: responseDB.resStatus })
        }

        return setDialog({
            title: "Desea eliminar la película?",
            content: "Estas seguro que quieres eliminar la película: " + data.title,
            actionFunction: handleDelete
        })
    }

    const renderPosterImage = (p) => {
        const { poster_path, title } = p.row

        return <img src={poster_path.includes('http') ? poster_path : `${REACT_APP_API_URL}/file/${poster_path}`} alt={title} height='95%' />
    }
    const renderButtonsAction = (p) => {
        return <>
            <Tooltip title='Ver detalles'>
                <IconButton color='info' onClick={() => navigate("/view/movie/" + p.row._id)} >
                    <Visibility />
                </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar'>
                <IconButton color='error' onClick={() => handleClickDelete(p.row)}>
                    <Delete />
                </IconButton>
            </Tooltip>
        </>
    }
    const renderVideoOnline = (p) => {
        return (
            <Tooltip title={p.row.video_status === 'success' ? 'Video' : 'Sin video'}>
                {p.row.video_status === 'success' ?
                    <CheckCircle fontSize='small' color='success' />
                    :
                    <Cancel fontSize='small' color='error' />
                }
            </Tooltip>
        )
    }
    const renderOnline = (p) => {
        return (
            <Tooltip title={p.value ? 'En linea' : 'Fuera de línea'}>
                {p.value ?
                    <WebAsset fontSize='small' color='success' />
                    :
                    <WebAssetOff fontSize='small' color='error' />
                }
            </Tooltip>
        )
    }

    const columns = [
        {
            field: 'poster_path',
            headerName: 'Poster',
            width: 70,
            headerAlign: 'center',
            align: 'center',
            disableColumnMenu: true,
            sortable: false,
            renderCell: renderPosterImage,
        },
        { field: 'title', headerName: 'Título', width: 270, headerAlign: 'center' },
        { field: 'views', headerName: 'Vistas', width: 90, headerAlign: 'center', align: 'center' },
        {
            field: 'createdAt',
            headerName: 'Fecha de creación',
            width: 120,
            headerAlign: 'center',
            align: 'center',
            valueGetter: getFormatedDate,
        },
        {
            field: 'updatedAt',
            headerName: 'Última edición',
            width: 120,
            headerAlign: 'center',
            align: 'center',
            valueGetter: getFormatedDate,
        },
        {
            field: 'online',
            headerName: 'En linea',
            width: 80,
            headerAlign: 'center',
            align: 'center',
            renderCell: renderOnline
        },
        {
            field: 'video_status',
            headerName: 'Video',
            width: 80,
            headerAlign: 'center',
            align: "center",
            renderCell: renderVideoOnline
        },
        {
            field: 'action',
            headerName: 'Acciones',
            width: 100,
            headerAlign: 'center',
            align: 'center',
            disableColumnMenu: true,
            sortable: false,
            renderCell: renderButtonsAction,
        },
    ]
    const autoWidth = () => {
        let suma = 0;

        columns.forEach(column => {
            suma += column.width
        })

        setWidth(suma + 5)
    }

    useEffect(() => {
        getAllMovies()
        autoWidth()

        // eslint-disable-next-line
    }, [])

    return <>
        <TableElement columns={columns} rows={allMovies} width={width} title='Películas' />

        {openDialog &&
            <DeleteDialog2 open={openDialog} setOpen={setOpenDialog} dialog={dialog} setDialog={setDialog} />
        }
    </>
}