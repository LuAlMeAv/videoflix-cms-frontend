import { useContext } from 'react';
import { Grid, Modal, Typography } from '@mui/material/';
import { filesContext } from '../contexts/FilesProvider';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "90%",
    maxHeight: "80vh",
    maxWidth: "760px",
    overflow: "auto",
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    pr: 2,
};

export default function SelectImageModal({ open, setOpen, images, type }) {
    const { REACT_APP_TMDB_URL_IMG_POSTER, REACT_APP_TMDB_URL_IMG_BACKDROP } = process.env
    const { dataForm, setDataForm } = useContext(filesContext)

    const urlPath = type === "poster" ? REACT_APP_TMDB_URL_IMG_POSTER : REACT_APP_TMDB_URL_IMG_BACKDROP

    const handleImageSelect = (path) => {
        if (type === "poster") {
            setDataForm({ ...dataForm, poster_path: urlPath + path })
        } else {
            setDataForm({ ...dataForm, backdrop_path: urlPath + path })
        }
        setOpen(false)
    }

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Grid container sx={style} spacing={2}>
                <Grid item xs={12}><Typography variant='h4' textAlign="center">{type.toUpperCase()}</Typography></Grid>
                {images.map((img, key) => {
                    key++
                    return <Grid
                        item
                        key={key}
                        xs={type === "poster" ? 6 : 12}
                        sm={type === "poster" ? 4 : 6}
                        md={type === "poster" ? 3 : 4}
                        onClick={() => handleImageSelect(img.file_path)}
                        children={<>
                            {img.iso_639_1 &&
                                <Typography
                                    sx={{ position: "absolute", bgcolor: "#000000c2", color: "white", p: 1 }}
                                    children={img.iso_639_1}
                                />
                            }
                            <img
                                width="100%"
                                loading='lazy'
                                src={urlPath + img.file_path}
                                alt={img.file_path}
                            />
                        </>}
                    />
                })}
            </Grid>
        </Modal>
    )
}