import { Container, Divider } from '@mui/material'
import SearchInputElement from '../components/SearchInputElement'
import UploadForm from '../components/UploadForm'
import { useParams } from 'react-router-dom'

export default function UploadPage() {
    const {id} = useParams()
    
    return (
        <Container>
            {!id && <>
                <SearchInputElement />
                <Divider />
            </>}
            <UploadForm />
        </Container>
    )
}