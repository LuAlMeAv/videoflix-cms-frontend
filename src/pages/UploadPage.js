import SearchTMDBElement from '../components/SearchTMDBElement'
import DataFormElement from '../components/DataFormElement'
import { useParams } from 'react-router-dom'

export default function UploadPage() {
    const { id } = useParams()

    return (
        <>
            {!id &&
                <SearchTMDBElement />
            }
            <DataFormElement />
        </>
    )
}