import axios from "axios";
import { API_URL } from "./config";

/**
 * Récupère l'historique des messages depuis l'API
 */
export const fetchMessages = async () => {
  const res = await axios.get(`${API_URL}/ai/messages`);
  return res.data.messages;
};
