import { Container, Divider } from '@mui/material'
import SearchInputElement from '../components/SearchInputElement'
import UploadForm from '../components/UploadForm'

export default function UploadPage() {
    return (
        <Container>
            <SearchInputElement />
            <Divider />
            <UploadForm />
        </Container>
    )
}