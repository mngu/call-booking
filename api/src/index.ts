require("dotenv").config();
import getServer from "./server";
const { PORT } = process.env;

const app = getServer();

app.listen(PORT, () => {
  console.log(`server is listening on ${PORT}`);
});
