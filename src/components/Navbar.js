import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <div style={{ margin: "14px"}}>
            <Link to='/' style={{padding: "5px"}}>Upload</Link>
            &nbsp;
            <Link to='/movies' style={{padding: "5px"}}>Movies</Link>
            &nbsp;
            {/* <Link to='/304838203' style={{padding: "5px"}}>ID</Link>
            &nbsp; */}
        </div>
    )
}
