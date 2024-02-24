import { useContext, useState } from 'react'
import { enqueueSnackbar } from 'notistack'
import { Button, Grid, IconButton, TextField, Typography } from '@mui/material'
import { Delete } from '@mui/icons-material'
import { databaseContext } from '../contexts/DatabaseProvider'
import { filesContext } from '../contexts/FilesProvider'
import SelectImageModal from './SelectImageModal'
import DeleteDialog from './DeleteDialog'

export default function ImagesElement({ setChange }) {
  const { elementType } = useContext(databaseContext)

  return (
    <Grid container item xs={12} spacing={2}>
      {elementType !== 'episode' &&
        <Image setChange={setChange} type='poster' />
      }
      {elementType !== 'season' &&
        <Image setChange={setChange} type='backdrop' />
      }
    </Grid >
  )
}

const Image = ({ type, setChange }) => {
  const { REACT_APP_API_URL } = process.env
  const { setPosterFile, setBackdropFile } = useContext(filesContext)
  const { dataForm, setDataForm } = useContext(databaseContext)

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
    setDataForm({ ...dataForm, [type + '_path']: "" })

    window.URL.revokeObjectURL(image_path)

    setFile[type]({})

    setChange(true)
  }

  const handleMoreImages = () => {
    if (!dataForm.images || dataForm.images[type + 's'].length <= 1) {
      return enqueueSnackbar('No hay más imágenes para mostrar', { variant: 'warning' })
    }

    setOpenModal(true)
    setImages(dataForm.images[type + 's'])
  }

  const handleErrorImage = async () => {
    if (dataForm[type + '_path'].includes('http')) {
      return console.log("La imagen no pertenece al servidor")
    }

    const imageStatus = await fetch(REACT_APP_API_URL + '/file/' + dataForm[type + '_path']).then(async r => await r.json()).catch(e => e)

    if (imageStatus.message === 'Archivo no encontrado') {
      console.log("La imagen no está en el servidor")
      setDataForm({ ...dataForm, [type + '_path']: "" })
    } else {
      console.log("Error al cargar la imagen")
    }

    console.log(imageStatus)
  }

  return (
    <Grid item xs={type === 'poster' ? 9 : 12} md={type === 'poster' ? 4 : 8} mx="auto" position="relative" textAlign='center' onChange={() => console.log("Anything change")}>
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
            onError={handleErrorImage}
          />
        </>
        :
        <>
          {(dataForm.images && dataForm.images[type + 's']?.length > 1) &&
            <Button variant='outlined' size='small' sx={{ mb: 1 }} name="poster" onClick={handleMoreImages}>Más imágenes</Button>
          }
          <TextField fullWidth type='file' inputProps={{ accept: "image/*" }} onChange={handleSelectFileImage} />
        </>
      }

      {openModal &&
        <SelectImageModal open={openModal} setOpen={setOpenModal} images={images} type={type} setChange={setChange} />
      }

      {openDialog &&
        <DeleteDialog open={openDialog} setOpen={setOpenDialog} dialog={dialog} setDialog={setDialog} />
      }
    </Grid >
  )
}