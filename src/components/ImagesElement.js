import { useContext, useState } from 'react'
import { enqueueSnackbar } from 'notistack'
import { Button, Grid, IconButton, TextField, Typography } from '@mui/material'
import { Delete } from '@mui/icons-material'
import { databaseContext } from '../contexts/DatabaseProvider'
import { filesContext } from '../contexts/FilesProvider'
import SelectImageModal from './SelectImageModal'
import DeleteDialog from './DeleteDialog'

export default function ImagesElement() {
  const { elementType } = useContext(databaseContext)

  return (
    <Grid container item xs={12} spacing={2}>
      {elementType !== 'episode' &&
        <Image type='poster' />
      }
      {elementType !== 'season' &&
        <Image type='backdrop' />
      }
    </Grid >
  )
}

const Image = ({ type }) => {
  const { REACT_APP_API_URL } = process.env
  const { setPosterFile, setBackdropFile, deleteSingleFile } = useContext(filesContext)
  const { dataForm, setDataForm, updateData } = useContext(databaseContext)

  const [openModal, setOpenModal] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialog, setDialog] = useState({})
  const [images, setImages] = useState([])

  const image_path = dataForm[type + '_path']
  const setFile = {
    'backdrop': setBackdropFile,
    'poster': setPosterFile,
  }

  const handleSelectFileImage = (e) => {
    const file = e.target.files[0]
    const newPath = window.URL.createObjectURL(file)

    setFile[type](file)
    setDataForm({ ...dataForm, [type + '_path']: newPath })
  }

  const handleRemoveImage = () => {
    if (image_path.includes('blob:')) {
      window.URL.revokeObjectURL(image_path)
      setDataForm({ ...dataForm, [type + '_path']: '' })
      setFile[type]({})
      return
    }

    const external_path = image_path.includes('http')

    const handleDelete = async () => {
      if (!external_path) {
        const responseFile = await deleteSingleFile(image_path)

        if (responseFile.resStatus === 'error') {
          return
        }
      }

      const response = await updateData({ [type + '_path']: '' })

      if (response.resStatus === 'success') {
        setDataForm({ ...dataForm, [type + '_path']: '' })
        enqueueSnackbar('El ' + type + ' fue eliminado', { variant: 'success' })
      }
    }

    setOpenDialog(true)

    setDialog({
      ...dialog,
      title: "Desea eliminar la imagen?",
      content: `El ${type} de: ${dataForm.title} sera eliminado${external_path ? '' : ', así como el archivo en el sistema'}`,
      actionFunction: handleDelete
    })
  }

  const handleMoreImages = () => {
    if (!dataForm.images || dataForm.images[type + 's'].length <= 1) {
      return enqueueSnackbar('No hay más imágenes para mostrar', { variant: 'warning' })
    }
    setOpenModal(true)
    setImages(dataForm.images[type + 's'])
  }

  return (
    <Grid item xs={type === 'poster' ? 9 : 12} md={type === 'poster' ? 4 : 8} mx="auto" position="relative" textAlign='center' >
      <Typography align='center' variant="h6">{type === 'poster' ? 'Poster' : 'Fondo'}</Typography>
      {image_path ?
        <>
          <IconButton
            color='error'
            onClick={handleRemoveImage}
            sx={{ position: 'absolute', right: 0 }}
            children={<Delete />}
          />

          <img
            width="100%"
            style={{ cursor: 'pointer' }}
            src={image_path.includes('http') ? image_path : `${REACT_APP_API_URL}/file/` + image_path}
            alt={dataForm.title}
            onClick={handleMoreImages}
          />
        </>
        :
        <>
          {(dataForm.images && dataForm.images[type + 's'].length > 1) &&
            <Button variant='outlined' size='small' sx={{ mb: 1 }} name="poster" onClick={handleMoreImages}>Más imágenes</Button>
          }
          <TextField fullWidth type='file' inputProps={{ accept: "image/*" }} onChange={handleSelectFileImage} />
        </>
      }

      {openModal &&
        <SelectImageModal open={openModal} setOpen={setOpenModal} images={images} type={type} />
      }

      {openDialog &&
        <DeleteDialog open={openDialog} setOpen={setOpenDialog} dialog={dialog} setDialog={setDialog} />
      }
    </Grid >
  )
}