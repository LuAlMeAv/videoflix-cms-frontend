import { useContext } from 'react';
import { Grid, Modal, Typography } from '@mui/material/';
import { databaseContext } from '../contexts/DatabaseProvider';

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

export default function SelectImageModal({ open, setOpen, images, type, setChange }) {
    const { REACT_APP_TMDB_URL_IMG_POSTER, REACT_APP_TMDB_URL_IMG_BACKDROP } = process.env
    const { dataForm, setDataForm } = useContext(databaseContext)

    const urlPath = type === "poster" ? REACT_APP_TMDB_URL_IMG_POSTER : REACT_APP_TMDB_URL_IMG_BACKDROP

    const handleImageSelect = (path) => {
        setDataForm({ ...dataForm, [type === 'poster' ? 'poster_path' : 'backdrop_path']: urlPath + path })
        setOpen(false)
        setChange(true)
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
                        sx={{ transition: 'ease all .3s', ':hover': { scale: '1.1' } }}
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
                                style={{ cursor: 'pointer' }}
                            />
                        </>}
                    />
                })}
            </Grid>
        </Modal>
    )
}