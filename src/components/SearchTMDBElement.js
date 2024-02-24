import { useContext, useEffect, useState } from 'react'
import { Autocomplete, Divider, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { filesContext } from '../contexts/FilesProvider'
import { tmdbContext } from '../contexts/TmdbProvider'
import { databaseContext } from '../contexts/DatabaseProvider'
import { useParams } from 'react-router-dom'
import { HideImage } from '@mui/icons-material'

const formatRuntime = (runtime) => {
    const hours = Math.floor(runtime / 60)
    const minutes = runtime % 60
    const minutesFormat = minutes < 10 ? "0" + minutes : minutes

    return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutesFormat + "m" : ""}`
}

export default function SearchTMDBElement() {
    const { REACT_APP_TMDB_URL_IMG_POSTER, REACT_APP_TMDB_URL_IMG_BACKDROP } = process.env
    const { searchList, setSearchList, getListOfSearchTMDB, getMoreSeasonImagesTMDB, getMoreEpisodeImagesTMDB, getMoreImagesTMDB, getMoreInfoTMDB, getCertificationTMDB, getAlternativesTitlesTMDB, getSeasonsTMDB, getEpisodesTMDB } = useContext(tmdbContext)
    const { clearData, setDataForm, dataForm, elementType } = useContext(databaseContext)
    const { clearFiles } = useContext(filesContext)

    const { element_type } = useParams()

    const [episodes, setEpisodes] = useState("")
    const [episode, setEpisode] = useState("")
    const [seasons, setSeasons] = useState([])
    const [season, setSeason] = useState("")

    const handleInputChange = (e) => {
        handleClear()

        const value = e.target.value
        const typeOfSearch = elementType === 'movie' ? 'movie' : 'tv'

        if (value?.length > 3) {
            getListOfSearchTMDB(value, typeOfSearch)
        }
    }
    const handleSelectOption = async (e, value) => {
        handleClear()

        if (!value || value === undefined) {
            return
        }

        const typeOfSearch = elementType === 'movie' ? 'movie' : 'tv'

        let moreInfo, year, images, duration, certification, alternative_titles, tmdb_id;

        moreInfo = await getMoreInfoTMDB(value.id, typeOfSearch)
        images = await getMoreImagesTMDB(value.id, typeOfSearch)
        certification = await getCertificationTMDB(value.id, typeOfSearch) || ""
        alternative_titles = await getAlternativesTitlesTMDB(value.id, typeOfSearch)
        tmdb_id = value.id

        delete value.id
        delete moreInfo.id

        if (elementType === 'movie') {
            year = value.release_date.split("-")[0]
            duration = formatRuntime(moreInfo.runtime)
        } else {
            year = value.first_air_date.split("-")[0]
            duration = ""
        }

        setDataForm({
            ...dataForm,
            ...value,
            ...moreInfo,
            year,
            images,
            tmdb_id,
            duration,
            certification,
            alternative_titles,
            seasons: [],
            online: false,
            poster_path: value.poster_path && REACT_APP_TMDB_URL_IMG_POSTER + value.poster_path,
            backdrop_path: value.backdrop_path && REACT_APP_TMDB_URL_IMG_BACKDROP + value.backdrop_path,
        })
    }
    const handleChangeSeason = async (e) => {
        const value = e.target.value

        setSeason(value)

        const images = await getMoreSeasonImagesTMDB(dataForm.tmdb_id, value.season_number)
        const year = value.air_date.split("-")[0]

        setDataForm({
            ...dataForm,
            ...value,
            online: false,
            images,
            year,
            poster_path: REACT_APP_TMDB_URL_IMG_POSTER + value.poster_path,
        })
    }
    const handleChangeEpisode = async (e) => {
        const value = e.target.value

        setEpisode(value)

        const year = value.air_date?.split("-")[0]
        const images = await getMoreEpisodeImagesTMDB(dataForm.tmdb_id, value.season_number, value.episode_number)
        const duration = formatRuntime(value.runtime)

        images.backdrops = images.stills
        delete images.stills

        setDataForm({
            ...dataForm,
            ...value,
            year,
            images,
            duration,
            online: false,
            video_path: "",
            episode_name: value.name,
            backdrop_path: REACT_APP_TMDB_URL_IMG_BACKDROP + value.still_path
        })
    }

    const getSeasons = async () => {
        const element = await getSeasonsTMDB(dataForm.tmdb_id)

        setSeasons(element.seasons)
    }
    const getEpisodes = async () => {
        const element = await getEpisodesTMDB(dataForm.tmdb_id, dataForm.season_number)

        setEpisodes(element.episodes)
    }

    const handleClear = () => {
        clearFiles()
        clearData()
        setSeason("")
        setEpisode("")
    }


    useEffect(() => {
        setSearchList([])
        if (element_type === 'season' && dataForm.tmdb_id) {
            getSeasons()
        }
        if (element_type === 'episode' && dataForm.tmdb_id) {
            getEpisodes()
        }

        // eslint-disable-next-line
    }, [dataForm.tmdb_id])

    return (<>
        <Grid container spacing={2} mb={5} maxWidth={"720px"} mx={"auto"} pr={3}>
            {(elementType === 'movie' || elementType === 'serie') &&
                <Grid item xs={12} sm={9}>
                    <Autocomplete
                        options={searchList}
                        renderOption={(props, options) => <OptionElement props={props} options={options} />}
                        getOptionLabel={(option) => option.title}
                        renderInput={(params) => <TextField {...params} label="Buscar en TMDB" />}
                        onInputChange={handleInputChange}
                        onChange={handleSelectOption}
                        onBlur={() => setSearchList([])}
                    />
                </Grid>
            }
            {seasons?.length > 0 &&
                <Grid item xs={7}>
                    <FormControl fullWidth>
                        <InputLabel id='season'>Temporada</InputLabel>
                        <Select
                            label="Temporada"
                            labelId='season'
                            value={season}
                            onChange={handleChangeSeason}
                        >
                            {
                                seasons.map(se => {
                                    return <MenuItem key={se.id} value={se} >{se.name}</MenuItem>
                                })
                            }
                        </Select>
                    </FormControl>
                </Grid>
            }
            {episodes?.length > 0 &&
                <Grid item xs={5}>
                    <FormControl fullWidth>
                        <InputLabel id='episode'>Episodio</InputLabel>
                        <Select
                            label="Episodio"
                            labelId='episode'
                            value={episode}
                            onChange={handleChangeEpisode}
                        >
                            {
                                episodes.map(ep => {
                                    return <MenuItem key={ep.id} value={ep} >{ep.episode_number}</MenuItem>
                                })
                            }
                        </Select>
                    </FormControl>
                </Grid>
            }
        </Grid>
        <Divider />
    </>)
}

const OptionElement = ({ props, options }) => {
    const { REACT_APP_TMDB_URL_IMG_POSTER } = process.env
    const { searchType } = useContext(filesContext)

    const date = searchType === "tv" ? options.first_air_date : options.release_date;
    const year = date?.split("-")[0]

    return (
        <Grid {...props} container columnSpacing={2} key={`${options.id}/${Math.random()}`} >
            <Grid item xs={2}>
                {options.poster_path ?
                    <img loading='lazy' alt={options.title} src={REACT_APP_TMDB_URL_IMG_POSTER + options.poster_path} width="100%" />
                    :
                    <HideImage fontSize='large' sx={{ width: '100%', color: 'gray' }} />
                }
            </Grid>
            <Grid item xs={9}>
                <div>{options.title}</div>
            </Grid>
            <Grid item xs={1}>
                <Typography>{year}</Typography>
            </Grid>
        </Grid>
    )
}