import { createContext, useContext, useState } from "react";
import { enqueueSnackbar } from "notistack";
import { databaseContext } from "./DatabaseProvider";

export const tmdbContext = createContext();

const getCertificationValue = (response) => {
    if (response.results.length > 0) {
        const results = response.results.filter(r => r.iso_3166_1 === "MX" || r.iso_3166_1 === "US")
        const rating = results.length > 1 ? results[1].rating : results[0]?.rating
        const release_dates = results[0]?.release_dates !== "" ? results[0]?.release_dates : results[1].release_dates
        const certification = release_dates ? release_dates[0].certification : rating

        return certification
    }

    return ""
}

const orderImages = async (res) => {
    const response = await res.json()

    let orderImages = {};

    for (const [key, value] of Object.entries(response)) {
        if (key !== 'id') {
            orderImages[key] = value.sort((a, b) => {
                let fa = a.iso_639_1 === null ? "zzz" : a.iso_639_1,
                    fb = b.iso_639_1 === null ? "zzz" : b.iso_639_1;

                if (fa < fb) {
                    return -1;
                }
                if (fa > fb) {
                    return 1;
                }
                return 0;
            })
        }

        orderImages[key] = value
    };

    return orderImages
}

export default function TmdbProvider({ children }) {
    const { REACT_APP_TMDB_URL_API, REACT_APP_TMDB_API_KEY } = process.env
    const { elementType } = useContext(databaseContext)

    const [searchList, setSearchList] = useState([])

    // FETCH FUNCTIONS
    const getListOfSearchTMDB = (value, typeOfSearch) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/search/${typeOfSearch}?api_key=${REACT_APP_TMDB_API_KEY}&language=es-MX&query=${value}&page=1&include_adult=false`

        fetch(urlQuery)
            .then(async (res) => {
                const response = await res.json()
                const results = response.results.filter(e => e)
                createListSearch(results)
            })
            .catch(errorResponse)
    }
    const createListSearch = (values) => {
        if (elementType === 'movie') {
            setSearchList(values)
            return
        }

        const newValues = values.map(val => {
            val.title = val.name;
            val.original_title = val.original_name;
            return val;
        })
        setSearchList(newValues)
    }
    const getMoreInfoTMDB = async (id, typeOfSearch) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/${typeOfSearch}/${id}?api_key=${REACT_APP_TMDB_API_KEY}&language=es-MX`

        return fetch(urlQuery)
            .then(async (res) => await res.json())
            .catch(errorResponse)
    }
    const getMoreImagesTMDB = async (id, typeOfSearch) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/${typeOfSearch}/${id}/images?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(orderImages)
            .catch(errorResponse)
    }
    const getAlternativesTitlesTMDB = async (id, typeOfSearch) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/${typeOfSearch}/${id}/alternative_titles?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(async (res) => {
                const response = await res.json()
                const titles = typeOfSearch === 'movie' ? response.titles : response.results

                return titles.map(t => t.title)
            })
            .catch(errorResponse)
    }
    const getCertificationTMDB = async (id, typeOfSearch) => {
        const certification = typeOfSearch === "movie" ? "release_dates" : "content_ratings"

        const urlQuery = `${REACT_APP_TMDB_URL_API}/${typeOfSearch}/${id}/${certification}?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(async (res) => {
                const response = await res.json()
                return getCertificationValue(response)
            })
            .catch(errorResponse)
    }
    const getSeasonsTMDB = async (id) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/tv/${id}?api_key=${REACT_APP_TMDB_API_KEY}&language=es-MX`

        return fetch(urlQuery)
            .then(async (res) => await res.json())
            .catch(errorResponse)
    }
    const getMoreSeasonImagesTMDB = async (id, season) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/tv/${id}/season/${season}/images?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(orderImages)
            .catch(errorResponse)
    }
    const getEpisodesTMDB = async (id, season) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/tv/${id}/season/${season}?language=es-MX&api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(async (res) => await res.json())
            .catch(errorResponse)
    }
    const getMoreEpisodeImagesTMDB = async (id, season, episode) => {
        const urlQuery = `${REACT_APP_TMDB_URL_API}/tv/${id}/season/${season}/episode/${episode}/images?api_key=${REACT_APP_TMDB_API_KEY}`

        return fetch(urlQuery)
            .then(orderImages)
            .catch(errorResponse)
    }

    const errorResponse = (err) => {
        console.error(err)
        enqueueSnackbar('La consullta a TMB ha fallado', { variant: 'error' })
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
                getAlternativesTitlesTMDB,
                getSeasonsTMDB,
                getEpisodesTMDB,
            }}
        >
            {children}
        </tmdbContext.Provider>
    )
}