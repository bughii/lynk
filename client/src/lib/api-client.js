import axios from "axios";
import { getApiConfig } from "@/api-config";

export const apiClient = axios.create(getApiConfig());
apiClient.defaults.withCredentials = true;
