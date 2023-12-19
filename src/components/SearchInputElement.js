import { useContext, useState } from 'react'
import { Autocomplete, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { filesContext } from '../contexts/FilesProvider'
import { tmdbContext } from '../contexts/TmdbProvider'

const formInitialState = {
    title: "",
    original_title: "",
    tagline: "",
    episode_name: "",
    episode_number: "",
    season_number: "",
    year: "",
    certification: "",
    genres: "",
    genre_ids: "",
    overview: "",
    backdrop_path: "",
    poster_path: "",
    video_path: ""
}

const formatRuntime = (runtime) => {
    const hours = Math.floor(runtime / 60)
    const minutes = runtime % 60
    const minutesFormat = minutes < 10 ? "0" + minutes : minutes

    return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutesFormat + "m" : ""}`
}

export default function SearchInputElement() {
    const { getListOfSearchTMDB, setSearchList, getMoreSeasonImagesTMDB, getMoreEpisodeImagesTMDB, getSeasonEpisodesTMDB, getMoreImagesTMDB, getMoreInfoTMDB, getCertificationTMDB, searchList, getAlternativesTitlesTMDB } = useContext(tmdbContext)
    const { setDataForm, clearData, searchType, setSearchType, setMovieE, serieE, setSerieE, seasonE, setSeasonE, setEpisodeE } = useContext(filesContext)
    const { REACT_APP_TMDB_URL_IMG_POSTER, REACT_APP_TMDB_URL_IMG_BACKDROP } = process.env

    const [epi, setEpi] = useState("")
    const [sea, setSea] = useState("")

    // HANDLE CHANGE FUNCTIONS
    const handleChangeTypeOfSearch = (e) => {
        clearData()
        setEpi("")
        setSea("")
        setSearchType(e.target.value)
    }
    const handleInputChange = (e) => {
        clearData()
        setEpi("")
        setSea("")

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

        clearData()
        setEpi("")
        setSea("")

        const images = await getMoreImagesTMDB(value.id)
        const alternative_titles = await getAlternativesTitlesTMDB(value.id)

        if (searchType === "movie") {
            const year = value.release_date.split("-")[0]
            const moreInfo = await getMoreInfoTMDB(value.id)
            const duration = formatRuntime(moreInfo.runtime)
            const certification = await getCertificationTMDB(value.id)

            const { title, original_title, genre_ids, overview, backdrop_path, poster_path } = value

            setDataForm({
                ...formInitialState,
                title,
                original_title,
                tagline: moreInfo.tagline,
                year,
                certification,
                duration,
                genres: moreInfo.genres,
                genre_ids,
                overview,
                backdrop_path: REACT_APP_TMDB_URL_IMG_BACKDROP + backdrop_path,
                poster_path: REACT_APP_TMDB_URL_IMG_POSTER + poster_path
            })
            setMovieE({ ...value, ...moreInfo, images, alternative_titles })
        } else {
            const year = value.first_air_date.split("-")[0]
            const moreInfo = await getMoreInfoTMDB(value.id)
            const certification = await getCertificationTMDB(value.id)

            const { title, original_title, genre_ids, overview, backdrop_path, poster_path } = value;

            setDataForm({
                ...formInitialState,
                title,
                original_title,
                tagline: moreInfo.tagline,
                year,
                certification,
                genres: moreInfo.genres,
                genre_ids,
                overview,
                backdrop_path: REACT_APP_TMDB_URL_IMG_BACKDROP + backdrop_path,
                poster_path: REACT_APP_TMDB_URL_IMG_POSTER + poster_path
            })
            setSerieE({ ...value, ...moreInfo, images, certification, alternative_titles })
        }
    }
    const handleChangeSeason = async (e) => {
        setSeasonE({})
        setEpisodeE({})
        setEpi("")

        const value = e.target.value
        setSea(value)

        const year = value.air_date.split("-")[0]
        const images = await getMoreSeasonImagesTMDB(serieE.id, value.season_number)
        const episodes = await getSeasonEpisodesTMDB(serieE.id, value.season_number)

        const { season_number, overview, poster_path } = value;

        setDataForm({
            ...formInitialState,
            title: serieE.title,
            original_title: serieE.original_title,
            tagline: serieE.tagline,
            season_number,
            year,
            certification: serieE.certification,
            genres: serieE.genres,
            genre_ids: serieE.genre_ids,
            overview,
            poster_path: REACT_APP_TMDB_URL_IMG_POSTER + poster_path,
        })
        setSeasonE({ ...value, images, episodes: episodes.episodes })
    }
    const handleChangeEpisode = async (e) => {
        setEpisodeE({})

        const value = e.target.value
        setEpi(value)

        const year = value.air_date?.split("-")[0]
        const images = await getMoreEpisodeImagesTMDB(serieE.id, value.season_number, value.episode_number)
        const duration = formatRuntime(value.runtime)

        const { name, episode_number, season_number, overview, still_path } = value

        setDataForm({
            ...formInitialState,
            title: serieE.title,
            original_title: serieE.original_title,
            tagline: serieE.tagline,
            episode_name: name,
            episode_number,
            season_number,
            year,
            certification: serieE.certification,
            duration,
            genres: serieE.genres,
            genre_ids: serieE.genre_ids,
            overview,
            backdrop_path: REACT_APP_TMDB_URL_IMG_BACKDROP + still_path
        })
        setEpisodeE({ ...value, images: { backdrops: images.stills } })
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

            {serieE.seasons?.length > 0 &&
                <Grid item xs={7}>
                    <FormControl fullWidth>
                        <InputLabel id='season'>Temporada</InputLabel>
                        <Select
                            label="Temporada"
                            labelId='season'
                            value={sea}
                            onChange={handleChangeSeason}
                        >
                            {
                                serieE.seasons?.map(se => {
                                    return <MenuItem key={se.id} value={se} >{se.name}</MenuItem>
                                })
                            }
                        </Select>
                    </FormControl>
                </Grid>
            }
            {seasonE.episodes?.length > 0 &&
                <Grid item xs={5}>
                    <FormControl fullWidth>
                        <InputLabel id='episode'>Episodio</InputLabel>
                        <Select
                            label="Episodio"
                            labelId='episode'
                            value={epi}
                            onChange={handleChangeEpisode}
                        >
                            {
                                seasonE.episodes?.map(ep => {
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