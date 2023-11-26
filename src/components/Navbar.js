import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <div>
            <Link to='/'>Home</Link>
            &nbsp;
            <Link to='/movies'>Movies</Link>
            &nbsp;
        </div>
    )
}
