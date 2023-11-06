import { useContext, useState } from 'react'
import { Button, Grid, IconButton, TextField, Typography } from '@mui/material'
import { Delete } from '@mui/icons-material'
import { enqueueSnackbar } from 'notistack'
import { uploadContext } from '../contexts/UploadProvider'
import SelectImageModal from './SelectImageModal'

export default function ImagesElement() {
  const { dataForm, setDataForm, searchType, movieE, serieE, seasonE, episodeE, setPosterFile, setBackdropFile } = useContext(uploadContext)

  const [openModal, setOpenModal] = useState(false)
  const [images, setImages] = useState([])
  const [imagesType, setImagesType] = useState("")

  const { episode_number, season_number, poster_path, title, backdrop_path, } = dataForm

  const handleClickToChangeImage = (e) => {
    const type = e.target.attributes.name?.value || ""

    if (type === "") {
      return
    }

    setImagesType(type)

    let imgs;

    if (searchType === "movie") {
      imgs = type === "poster" ? movieE.images?.posters : movieE.images?.backdrops
    } else if (episodeE.episode_number) {
      imgs = episodeE.images.backdrops
    } else if (seasonE.season_number) {
      imgs = seasonE.images.posters
    } else if (searchType === "tv") {
      imgs = type === "poster" ? serieE.images?.posters : serieE.images?.backdrops
    } else {
      imgs = []
    }
    setImages(imgs)

    if (imgs?.length > 1) {
      setOpenModal(true)
    } else {
      enqueueSnackbar('No hay mas imágenes para mostrar', { variant: "warning" })
    }
  }
  const handleSelectFileToImage = (e, value) => {
    const file = e.target.files[0]

    const srcPath = window.URL.createObjectURL(file)

    setImages([])

    if (value === "poster") {
      setDataForm({ ...dataForm, poster_path: srcPath })
      setPosterFile(file)
    } else {
      setDataForm({ ...dataForm, backdrop_path: srcPath })
      setBackdropFile(file)
    }
  }
  const handleRemoveImage = (type) => {
    if (type === "poster") {
      setDataForm({ ...dataForm, poster_path: "" })
      setPosterFile({})
    } else {
      setDataForm({ ...dataForm, backdrop_path: "" })
      setBackdropFile({})
    }
  }

  return (
    <Grid container item xs={12} spacing={2}>
      {/* POSTER IMAGE */}
      {(searchType === "movie" || episode_number === "" || (episode_number === "" && season_number === "")) &&
        <Grid item xs={9} md={4} mx="auto" position="relative" >
          <Typography align='center' variant="h5">Poster</Typography>
          {poster_path ?
            <>
              {poster_path &&
                <IconButton onClick={() => handleRemoveImage("poster")} sx={{ position: 'absolute', right: 0 }} color='error' ><Delete /></IconButton>
              }
              <img
                width="100%"
                src={poster_path}
                alt={title + ' poster'}
                name="poster"
                onClick={handleClickToChangeImage}
              />
            </>
            :
            <>
              {images?.length > 0 &&
                <Button variant='text' name="poster" onClick={handleClickToChangeImage}>Más imágenes</Button>
              }
              <TextField fullWidth type='file' inputProps={{ accept: "image/*" }} onChange={(e) => handleSelectFileToImage(e, "poster")} />
            </>
          }
        </Grid>
      }
      {/* BACKDROP IMAGE */}
      {(searchType === "movie" || episode_number !== "" || (episode_number === "" && season_number === "")) &&
        <Grid item xs={12} md={8} mx="auto" position="relative">
          <Typography align='center' variant="h5">Fondo</Typography>
          {backdrop_path ?
            <>
              {backdrop_path &&
                <IconButton onClick={() => handleRemoveImage('backdrop')} sx={{ position: 'absolute', right: 0 }} color='error' ><Delete /></IconButton>
              }
              <img
                width="100%"
                name="backdrop"
                src={backdrop_path}
                alt={title + ' backdrop'}
                onClick={handleClickToChangeImage}
              />
            </>
            :
            <>
              {images.length > 0 &&
                <Button variant='text' name="backdrop" onClick={handleClickToChangeImage}>Más imágenes</Button>
              }
              <TextField fullWidth type='file' inputProps={{ accept: "image/*" }} onChange={(e) => handleSelectFileToImage(e, "backdrop")} />
            </>
          }
        </Grid>
      }
      {/* MODAL TO SELECT IMAGE */}
      {openModal && images?.length > 1 &&
        <SelectImageModal open={openModal} setOpen={setOpenModal} images={images} type={imagesType} />
      }
    </Grid >
  )
}