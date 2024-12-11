import { useQuery } from "@tanstack/react-query";
import useAxiosCommon from "../hooks/useAxiosCommon";
import Error from "../pages/Error";
import Loading from "./Loading";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = () => {
  const axios = useAxiosCommon();
  const {
    data: systemDetails,
    isLoading: systemDetailsLoading,
    error: systemDetailsError,
  } = useQuery({
    queryKey: ["system"],
    queryFn: async () => {
      const { data } = await axios.get(`/system/info`);
      return data.data;
    },
  });

  if (systemDetailsLoading) return <Loading />;
  if (systemDetailsError) return <Error />;

  return (
    <div className="w-full flex items-center justify-between lg:justify-end px-4 py-4">
      <div className="flex lg:hidden md:hidden items-center justify-start w-full">
        <img
          src={systemDetails?.logo}
          alt="logo"
          className="w-full object-contain max-w-[200px]"
        />
      </div>
      <NotificationDropdown />
    </div>
  );
};

export default Navbar;
