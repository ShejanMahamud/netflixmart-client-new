import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const useUser = () => {
  const token = Cookies.get("token") as string;
  const user = jwtDecode(token);

  return user;
};

export default useUser;
