export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Videoflix</h1>
      <h5>Estadisticas</h5>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Online</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Peliculas</td>
            <td style={{ textAlign: 'center' }}>83</td>
            <td style={{ textAlign: 'center' }}>69</td>
          </tr>
          <tr>
            <td>Series</td>
            <td style={{ textAlign: 'center' }}>15</td>
            <td style={{ textAlign: 'center' }}>12</td>
          </tr>
          <tr>
            <td>Usuarios</td>
            <td style={{ textAlign: 'center' }}>15</td>
          </tr>
          <tr>
            <td>Videos</td>
            <td style={{ textAlign: 'center' }}>15</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
