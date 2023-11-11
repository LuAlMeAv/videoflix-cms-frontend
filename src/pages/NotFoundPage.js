import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <>
      <h1> 404 Not Found Page</h1>
      <Link to='/'>Go to home</Link>
    </>
  )
}
