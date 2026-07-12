import 'dotenv/config'
import { createServer } from './server.js'

const port = Number(process.env.PORT ?? 3000)
const app = createServer()

app.listen(port, () => {
  console.log(`Server is running at http://127.0.0.1:${port}`)
})
