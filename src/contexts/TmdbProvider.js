import { createContext, useContext, useState } from "react";
import { enqueueSnackbar } from "notistack";
import { databaseContext } from "./DatabaseProvider";

export const tmdbContext = createContext();

const getCertificationValue = (response) => {
    const results = response.results.filter(r => r.iso_3166_1 === "MX" || r.iso_3166_1 === "US")
    const rating = results.length > 1 ? results[1].rating : results[0].rating
    const release_dates = results.length > 1 ? results[1].release_dates : results[0].release_dates
    const certification = release_dates ? release_dates[0].certification : rating

    return certification
}

export default function TmdbProvider({ children }) {
    const { REACT_APP_TMDB_URL_API, REACT_APP_TMDB_API_KEY } = process.env
    const { searchType } = useContext(databaseContext)

    const [searchList, setSearchList] = useState([])

    // FETCH FUNCTIONS
    const getListOfSearchTMDB = (query) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/search/${searchType}?api_key=${REACT_APP_TMDB_API_KEY}&language=es-MX&query=${query}&page=1&include_adult=false`

        fetch(urlQuery)
            .then(async res => {
                const response = await res.json()
                const results = response.results.filter(e => e.id !== null)
                createListSearch(results)
            })
            .catch(err => errorResponse(err))
    }
    const getMoreInfoTMDB = async (id) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/${searchType}/${id}?api_key=${REACT_APP_TMDB_API_KEY}&language=es-MX`

        return fetch(urlQuery)
            .then(async (res) => await res.json())
            .catch(err => errorResponse(err))
    }
    const getMoreImagesTMDB = async (id) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/${searchType}/${id}/images?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(async (res) => await res.json())
            .catch(err => errorResponse(err))
    }
    const getAlternativesTitlesTMDB = async (id) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/${searchType}/${id}/alternative_titles?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(async (res) => {
                const response = await res.json()
                const titles = searchType === "tv" ? response.results : response.titles

                return titles.map(t => {
                    return t.title
                })
            })
            .catch(err => errorResponse(err))
    }
    const getCertificationTMDB = async (id) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/${searchType}/${id}/${searchType === "movie" ? "release_dates" : "content_ratings"}?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(async (res) => {
                const response = await res.json()
                return getCertificationValue(response)
            })
            .catch(err => errorResponse(err))
    }
    const getSeasonEpisodesTMDB = async (id, season) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/tv/${id}/season/${season}?language=es-MX&api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(async (res) => await res.json())
            .catch(err => errorResponse(err))
    }
    const getMoreSeasonImagesTMDB = async (id, season) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/${searchType}/${id}/season/${season}/images?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(async (res) => await res.json())
            .catch(err => errorResponse(err))
    }
    const getMoreEpisodeImagesTMDB = async (id, season, episode) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/tv/${id}/season/${season}/episode/${episode}/images?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(async (res) => await res.json())
            .catch(err => errorResponse(err))
    }

    const createListSearch = (values) => {
        if (searchType === 'movie') {
            setSearchList(values)
            return
        }
        if (searchType === 'tv') {
            const newValues = values.map(val => {
                val.title = val.name;
                val.original_title = val.original_name;
                return val;
            })
            setSearchList(newValues)
            return
        }
    }

    const errorResponse = (err) => {
        console.error(err)
        enqueueSnackbar('La conexión a TMB ha fallado', { variant: 'error' })
    }

    return (
        <tmdbContext.Provider
            value={{
                searchList,
                setSearchList,
                getListOfSearchTMDB,
                getMoreInfoTMDB,
                getMoreImagesTMDB,
                getMoreSeasonImagesTMDB,
                getMoreEpisodeImagesTMDB,
                getCertificationTMDB,
                getSeasonEpisodesTMDB,
                getAlternativesTitlesTMDB,
            }}
        >
            {children}
        </tmdbContext.Provider>
    )
}
