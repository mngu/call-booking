import axios, { AxiosInstance } from "axios";
import jwt from "jsonwebtoken";

const { ZOOM_API_URL, ZOOM_API_KEY, ZOOM_API_SECRET } = process.env;

function zoomRequest(): AxiosInstance {
  const token = jwt.sign(
    { iss: ZOOM_API_KEY, exp: new Date().getTime() + 5000 },
    ZOOM_API_SECRET
  );
  return axios.create({
    baseURL: ZOOM_API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default zoomRequest;
