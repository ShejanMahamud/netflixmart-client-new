import { AiOutlineLoading3Quarters } from "react-icons/ai";

function LoadingSpinner() {
  return (
    <div className="h-screen w-full flex justify-center items-center">
      <AiOutlineLoading3Quarters className="animate-spin text-green-500 w-[10%] h-[10%] m-auto" />
    </div>
  );
}

export default LoadingSpinner;