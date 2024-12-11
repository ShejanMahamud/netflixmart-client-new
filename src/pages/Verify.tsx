import { message, Spin } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const EmailVerifyContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const navigate = useNavigate();

  // Function to verify OTP
  const verifyEmail = async () => {
    const token = params.get("token");
    const email = params.get("email");

    if (!token || !email) {
      message.error("Invalid verification link.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/auth/user/verify`,
        {
          otp: token,
          email,
        }
      );

      if (data.success) {
        message.success("Email verified successfully!");
        navigate("/auth/login");
      } else {
        message.error(data.message || "Email verification failed.");
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      message.error(error.message || "Error verifying email.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyEmail();
  }, []); // Run only once on mount

  return (
    <div className="flex items-center justify-center h-screen">
      {loading ? (
        <Spin tip="Verifying your email..." size="large" />
      ) : (
        <p>If not redirected, please try again later.</p>
      )}
    </div>
  );
};

const Verify: React.FC = () => {
  return <EmailVerifyContent />;
};

export default Verify;
