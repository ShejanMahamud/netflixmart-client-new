import cookies from "js-cookie";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LoginSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      cookies.set("token", token, {
        expires: 1,
        sameSite: "strict",
        secure: true,
      });
      setTimeout(() => {
        navigate("/");
      }, 100);
    } else {
      navigate("/auth/login");
    }
  }, [navigate]);

  return <div>Loading...</div>;
};

export default LoginSuccess;
