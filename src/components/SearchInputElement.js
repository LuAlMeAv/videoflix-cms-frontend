import { useContext, useState } from 'react'
import { Autocomplete, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { filesContext } from '../contexts/FilesProvider'
import { tmdbContext } from '../contexts/TmdbProvider'
import { databaseContext } from '../contexts/DatabaseProvider'

const formatRuntime = (runtime) => {
    const hours = Math.floor(runtime / 60)
    const minutes = runtime % 60
    const minutesFormat = minutes < 10 ? "0" + minutes : minutes

    return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutesFormat + "m" : ""}`
}

export default function SearchInputElement() {
    const { REACT_APP_TMDB_URL_IMG_POSTER, REACT_APP_TMDB_URL_IMG_BACKDROP } = process.env
    const { getListOfSearchTMDB, setSearchList, getMoreSeasonImagesTMDB, getMoreEpisodeImagesTMDB, getSeasonEpisodesTMDB, getMoreImagesTMDB, getMoreInfoTMDB, getCertificationTMDB, searchList, getAlternativesTitlesTMDB } = useContext(tmdbContext)
    const { clearData, setDataForm, dataForm, searchType, setSearchType, setElementType } = useContext(databaseContext)
    const { clearFiles } = useContext(filesContext)

    const [season, setSeason] = useState("")
    const [episode, setEpisode] = useState("")

    // HANDLE CHANGE FUNCTIONS
    const handleChangeTypeOfSearch = (e) => {
        const value = e.target.value
        handleClear()
        setSearchType(value)
        setElementType(value === 'tv' ? 'serie' : value)
    }
    const handleInputChange = (e) => {
        handleClear()

        const query = e.target.value

        if (query === undefined || query === null) {
            setSearchList([])
            return
        }
        if (query.length > 3) {
            getListOfSearchTMDB(query)
        }
    }
    const handleSelectOption = async (e, value) => {
        if (value === null || value.title === undefined) {
            return
        }

        handleClear()

        const images = await getMoreImagesTMDB(value.id)
        const alternative_titles = await getAlternativesTitlesTMDB(value.id)

        if (searchType === "movie") {
            const year = value.release_date.split("-")[0]
            const moreInfo = await getMoreInfoTMDB(value.id)
            const duration = formatRuntime(moreInfo.runtime)
            const certification = await getCertificationTMDB(value.id)

            setElementType('movie')
            setDataForm({
                ...dataForm,
                ...value,
                ...moreInfo,
                year,
                images,
                duration,
                certification,
                tmdb_id: value.id,
                alternative_titles,
                poster_path: REACT_APP_TMDB_URL_IMG_POSTER + value.poster_path,
                backdrop_path: REACT_APP_TMDB_URL_IMG_BACKDROP + value.backdrop_path,
            })
        } else {
            const year = value.first_air_date.split("-")[0]
            const moreInfo = await getMoreInfoTMDB(value.id)
            const certification = await getCertificationTMDB(value.id)

            setElementType('serie')
            setDataForm({
                ...dataForm,
                ...value,
                ...moreInfo,
                year,
                images,
                certification,
                tmdb_id: value.id,
                alternative_titles,
                poster_path: REACT_APP_TMDB_URL_IMG_POSTER + value.poster_path,
                backdrop_path: REACT_APP_TMDB_URL_IMG_BACKDROP + value.backdrop_path,
            })
        }
    }
    const handleChangeSeason = async (e) => {
        setEpisode("")

        const value = e.target.value
        value.tmdb_id_serie = dataForm.tmdb_id

        setSeason(value)

        const year = value.air_date.split("-")[0]
        const images = await getMoreSeasonImagesTMDB(value.tmdb_id_serie, value.season_number)
        const episodes = await getSeasonEpisodesTMDB(value.tmdb_id_serie, value.season_number)

        setElementType('season')
        setDataForm({
            ...dataForm,
            ...value,
            episodes: episodes.episodes,
            images,
            year,
            poster_path: REACT_APP_TMDB_URL_IMG_POSTER + value.poster_path,
            episode_number: "",
            duration: ""
        })
    }
    const handleChangeEpisode = async (e) => {
        const value = e.target.value

        setEpisode(value)

        const year = value.air_date?.split("-")[0]
        const images = await getMoreEpisodeImagesTMDB(season.tmdb_id_serie, value.season_number, value.episode_number)
        const duration = formatRuntime(value.runtime)

        images.backdrops = images.stills
        delete images.stills

        setElementType('episode')
        setDataForm({
            ...dataForm,
            ...value,
            year,
            images,
            duration,
            episode_name: value.name,
            backdrop_path: REACT_APP_TMDB_URL_IMG_BACKDROP + value.still_path
        })
    }

    const handleClear = () => {
        clearFiles()
        clearData()
        setSeason("")
        setEpisode("")
    }

    return (
        <Grid container spacing={2} mb={5} maxWidth={"720px"} mx={"auto"} pr={3}>
            <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                    <InputLabel id='type-search'>Tipo</InputLabel>
                    <Select
                        label="tipo"
                        labelId='type-search'
                        value={searchType}
                        onChange={handleChangeTypeOfSearch}
                    >
                        <MenuItem value="movie">Peliculas</MenuItem>
                        <MenuItem value="tv">Series</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} sm={9}>
                <Autocomplete
                    options={searchList}
                    renderOption={(props, options) => <OptionElement props1={props} options={options} />}
                    getOptionLabel={(option) => { return option.title }}
                    renderInput={(params) => <TextField {...params} label="Buscar en TMDB" />}
                    onInputChange={handleInputChange}
                    onChange={handleSelectOption}
                    onBlur={() => setSearchList([])}
                />
            </Grid>

            {dataForm.seasons?.length > 0 &&
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
                                dataForm.seasons?.map(se => {
                                    return <MenuItem key={se.id} value={se} >{se.name}</MenuItem>
                                })
                            }
                        </Select>
                    </FormControl>
                </Grid>
            }
            {dataForm.episodes?.length > 0 &&
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
                                dataForm.episodes?.map(ep => {
                                    return <MenuItem key={ep.id} value={ep} >{ep.episode_number}</MenuItem>
                                })
                            }
                        </Select>
                    </FormControl>
                </Grid>
            }
        </Grid>
    )
}

const OptionElement = ({ props1, options }) => {
    const { REACT_APP_TMDB_URL_IMG_POSTER } = process.env
    const { searchType } = useContext(filesContext)

    const date = searchType === "tv" ? options.first_air_date : options.release_date;
    const year = date?.split("-")[0]

    return (
        <Grid container columnSpacing={2} key={new Date() * 1 + options.title + options.id} {...props1} >
            <Grid item xs={2}>
                <img loading='lazy' alt={options.title} src={options.poster_path && REACT_APP_TMDB_URL_IMG_POSTER + options.poster_path} width="100%" />
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