import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { DataGrid, esES } from '@mui/x-data-grid';
import { Box, Container, IconButton, Tooltip, styled } from '@mui/material';
import { Cancel, CheckCircle, DeleteForeverOutlined, EditOutlined } from '@mui/icons-material';
import { databaseContext } from '../contexts/DatabaseProvider';
import { globalContext } from '../contexts/GlobalProvider';
import { filesContext } from '../contexts/FilesProvider';
import DeleteDialog2 from '../components/DeleteDialog';

const getFormatedDate = (p) => {
    const date = new Date(p.value)
    const year = date.getFullYear()
    const real_month = date.getMonth() + 1
    const month = real_month > 9 ? real_month : '0' + real_month
    const day = date.getDate() > 9 ? date.getDate() : '0' + date.getDate()

    return year > 1000 ? `${day}/${month}/${year}` : '00/00/00'
}

export default function AutoHeightOverlayNoSnap() {
    const { getAllMovies, allMovies, deleteData, getElementById } = useContext(databaseContext)
    const { loadingResponse } = useContext(globalContext)
    const { deleteFiles } = useContext(filesContext)

    const { REACT_APP_API_URL } = process.env

    const [openDialog, setOpenDialog] = useState(false)
    const [dialog, setDialog] = useState()

    const navigate = useNavigate()

    const handleClickDelete = async (data) => {
        const response = await getElementById('movie', data._id)

        if (response.element) {
            const element = response.element

            setOpenDialog(true)

            const handleDelete = async () => {
                const responseFiles = await deleteFiles(element)
                console.log(responseFiles)

                const responseDB = await deleteData('movie', element._id)

                enqueueSnackbar(responseDB.message, { variant: responseDB.resStatus })
            }

            return setDialog({
                title: "Desea eliminar la película?",
                content: "Estas seguro que quieres eliminar la película: " + data.title,
                actionFunction: handleDelete
            })
        }
        enqueueSnackbar('El elemento no fue encontrado', { variant: 'error' })
    }

    const renderPosterImage = (p) => {
        const { poster_path, title } = p.row

        return <img src={poster_path.includes('http') ? poster_path : `${REACT_APP_API_URL}/file/${poster_path}`} alt={title} height='100%' />
    }
    const renderButtonsAction = (p) => {
        return <>
            <Tooltip title='Editar'>
                <IconButton color='info' onClick={() => navigate("/movie/" + p.row._id)} >
                    <EditOutlined />
                </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar'>
                <IconButton color='error' onClick={() => handleClickDelete(p.row)}>
                    <DeleteForeverOutlined />
                </IconButton>
            </Tooltip>
        </>
    }
    const renderVideoOnline = (p) => {
        return (
            <Tooltip title='Video?'>
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
            <Tooltip title='En linea?'>
                {p.value ?
                    <CheckCircle fontSize='small' color='success' />
                    :
                    <Cancel fontSize='small' color='error' />
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

    useEffect(() => {
        getAllMovies()
        // eslint-disable-next-line
    }, [])

    return (
        <Container>
            <DataGrid
                autoHeight
                rowSelection={false}
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                columns={columns}
                getRowId={(row) => row._id}
                rows={allMovies}
                loading={loadingResponse}
                slots={{
                    noRowsOverlay: CustomNoRowsOverlay
                }}
                sx={{ '--DataGrid-overlayHeight': '300px' }}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 10,
                        },
                    },
                }}
            />
            {openDialog &&
                <DeleteDialog2 open={openDialog} setOpen={setOpenDialog} dialog={dialog} setDialog={setDialog} />
            }
        </Container>
    )
}

// Custome Overlay and self styles
function CustomNoRowsOverlay() {
    return (
        <StyledGridOverlay>
            <svg
                style={{ flexShrink: 0 }}
                width="240"
                height="200"
                viewBox="0 0 184 152"
                aria-hidden
                focusable="false"
            >
                <g fill="none" fillRule="evenodd">
                    <g transform="translate(24 31.67)">
                        <ellipse
                            className="ant-empty-img-5"
                            cx="67.797"
                            cy="106.89"
                            rx="67.797"
                            ry="12.668"
                        />
                        <path
                            className="ant-empty-img-1"
                            d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z"
                        />
                        <path
                            className="ant-empty-img-2"
                            d="M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z"
                        />
                        <path
                            className="ant-empty-img-3"
                            d="M42.678 9.953h50.237a2 2 0 0 1 2 2V36.91a2 2 0 0 1-2 2H42.678a2 2 0 0 1-2-2V11.953a2 2 0 0 1 2-2zM42.94 49.767h49.713a2.262 2.262 0 1 1 0 4.524H42.94a2.262 2.262 0 0 1 0-4.524zM42.94 61.53h49.713a2.262 2.262 0 1 1 0 4.525H42.94a2.262 2.262 0 0 1 0-4.525zM121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z"
                        />
                    </g>
                    <path
                        className="ant-empty-img-3"
                        d="M149.121 33.292l-6.83 2.65a1 1 0 0 1-1.317-1.23l1.937-6.207c-2.589-2.944-4.109-6.534-4.109-10.408C138.802 8.102 148.92 0 161.402 0 173.881 0 184 8.102 184 18.097c0 9.995-10.118 18.097-22.599 18.097-4.528 0-8.744-1.066-12.28-2.902z"
                    />
                    <g className="ant-empty-img-4" transform="translate(149.65 15.383)">
                        <ellipse cx="20.654" cy="3.167" rx="2.849" ry="2.815" />
                        <path d="M5.698 5.63H0L2.898.704zM9.259.704h4.985V5.63H9.259z" />
                    </g>
                </g>
            </svg>
            <Box sx={{ mt: 1 }}>No hay Elementos</Box>
        </StyledGridOverlay>
    );
}
const StyledGridOverlay = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    '& .ant-empty-img-1': {
        fill: theme.palette.mode === 'light' ? '#aeb8c2' : '#262626',
    },
    '& .ant-empty-img-2': {
        fill: theme.palette.mode === 'light' ? '#f5f5f7' : '#595959',
    },
    '& .ant-empty-img-3': {
        fill: theme.palette.mode === 'light' ? '#dce0e6' : '#434343',
    },
    '& .ant-empty-img-4': {
        fill: theme.palette.mode === 'light' ? '#fff' : '#1c1c1c',
    },
    '& .ant-empty-img-5': {
        fillOpacity: theme.palette.mode === 'light' ? '0.8' : '0.08',
        fill: theme.palette.mode === 'light' ? '#f5f5f5' : '#fff',
    },
}));