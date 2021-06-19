import express from "express"
import cors from "cors";
import path from 'path';
import {fileURLToPath} from 'url';
import cookieParser from "cookie-parser";
import {registerRoutes} from "./src/router/spotifyRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());

registerRoutes(app)

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
