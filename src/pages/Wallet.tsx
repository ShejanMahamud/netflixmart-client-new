import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, InputNumber, Modal, Table } from "antd";
import moment from "moment";
import React, { useState } from "react";
import CountUp from "react-countup";
import { BsPiggyBank } from "react-icons/bs";
import Swal from "sweetalert2";
import Loading from "../components/Loading";
import useAxiosSecure from "../hooks/useAxiosSecure";
import useUser from "../hooks/useUser";
import Error from "./Error";

const Wallet: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  console.log(user);

  const {
    isPending,
    error,
    data: walletReports,
    refetch,
  } = useQuery({
    queryKey: ["walletReport"],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User ID is not available");
      }
      const { data } = await axiosSecure.get(
        `${import.meta.env.VITE_SERVER_URL}/wallet/report/${user.id}`
      );
      return data;
    },
  });

  const transactionsColumns = [
    {
      key: "createdAt",
      render: (_, record) => {
        return moment(record?.createdAt).format("YYYY-MM-DD");
      },
      title: "Date",
      align: "center",
    },
    {
      key: "amount",
      dataIndex: "amount",
      title: "Amount",
      align: "center",
    },
    {
      key: "status",
      dataIndex: "status",
      title: "Status",
      align: "center",
    },
    {
      key: "payment_method",
      dataIndex: "payment_method",
      title: "Payment Method",
      align: "center",
    },
    {
      key: "action",
      render: (_, record) => {
        if (record.status === "Initiated") {
          return (
            <button
              type="submit"
              className="px-4 py-2  rounded-lg bg-red-600 text-white text-sm"
            >
              Pay Now
            </button>
          );
        }
        return null;
      },
      title: "Actions",
      align: "center",
    },
  ];

  const { mutateAsync } = useMutation({
    mutationFn: async (info) => {
      const { data } = await axiosSecure.post("/wallet/add", info);
      return data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const handleBalanceAdd = async (values) => {
    try {
      const { balance } = values;
      const info = {
        userId: user?.id,
        amount: balance.toString(),
        payment_method: "bKash",
      };
      const data = await mutateAsync(info);
      if (data.success) {
        window.location.href = data?.bkashURL;
        setOpen(false);
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        title: "The Internet?",
        text: "That thing is still around?",
        icon: "question",
      });
    }
  };

  if (isPending) return <Loading />;

  if (error) return <Error />;
  return (
    <div className="w-full p-10">
      <h1 className="font-medium text-xl">Wallet</h1>
      <p>Manage your wallet and loyalty rewards</p>
      <div className="w-full flex items-center justify-end mt-20 mb-5">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-3  rounded-lg bg-[#1B2850] text-white text-sm"
        >
          Add Balance
        </button>
      </div>
      <div className="w-full flex items-center gap-5 ">
        <div className="bg-white py-3 px-6 rounded-xl flex items-center gap-2">
          <div className="bg-[#FFF5D9] p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 30 30"
              fill="none"
            >
              <g clip-path="url(#clip0_152_659)">
                <path
                  d="M9.99013 5.625H20.0101L22.1726 3.895C22.9089 3.3075 23.1839 2.35375 22.8726 1.46375C22.5614 0.57375 21.7526 0 20.8126 0H9.18763C8.24763 0 7.43888 0.575 7.12763 1.46375C6.81638 2.3525 7.09138 3.3075 7.82638 3.89375L9.99013 5.625Z"
                  fill="#FFBB38"
                />
                <path
                  d="M20.1813 7.5H9.81875C6.405 10.8512 3.75 16.7312 3.75 21.5625C3.75 25.7612 5.9725 30 10.9375 30H19.375C23.6162 30 26.25 26.7663 26.25 21.5625C26.25 16.7312 23.595 10.8512 20.1813 7.5ZM14.525 17.8125H15.475C16.9362 17.8125 18.125 19.0013 18.125 20.4625C18.125 21.7763 17.1775 22.8575 15.9375 23.0775V24.0613C15.9375 24.5788 15.5175 24.9988 15 24.9988C14.4825 24.9988 14.0625 24.5788 14.0625 24.0613V23.125H12.8125C12.295 23.125 11.875 22.705 11.875 22.1875C11.875 21.67 12.295 21.25 12.8125 21.25H15.475C15.9025 21.25 16.25 20.9025 16.25 20.475C16.25 20.035 15.9025 19.6875 15.475 19.6875H14.525C13.0638 19.6875 11.875 18.4987 11.875 17.0375C11.875 15.7238 12.8225 14.6425 14.0625 14.4225V13.4375C14.0625 12.92 14.4825 12.5 15 12.5C15.5175 12.5 15.9375 12.92 15.9375 13.4375V14.375H17.1875C17.705 14.375 18.125 14.795 18.125 15.3125C18.125 15.83 17.705 16.25 17.1875 16.25H14.525C14.0975 16.25 13.75 16.5975 13.75 17.025C13.75 17.465 14.0975 17.8125 14.525 17.8125Z"
                  fill="#FFBB38"
                />
              </g>
              <defs>
                <clipPath id="clip0_152_659">
                  <rect width="30" height="30" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col items-start gap-y-0">
            <h1 className="text-gray-600 text-xs font-normal">Balance</h1>
            <p className="font-medium text-lg">
              <CountUp
                start={0}
                end={walletReports?.wallet_balance}
                duration={2}
                decimal={"."}
                decimals={2}
                prefix="৳ "
              />
            </p>
          </div>
        </div>
        <div className="bg-white py-3 px-6 rounded-xl flex items-center gap-2">
          <div className="bg-[#E7EDFF] p-2 rounded-full">
            <BsPiggyBank className="text-3xl text-blue-600" />
          </div>
          <div className="flex flex-col items-start gap-y-0">
            <h1 className="text-gray-600 text-xs font-normal">
              Total Referral
            </h1>
            <p className="font-medium text-lg">
              <CountUp
                start={0}
                end={walletReports?.total_referral}
                duration={2}
                decimal={"."}
                decimals={2}
                prefix="৳ "
              />
            </p>
          </div>
        </div>
        <div className="bg-white py-3 px-6 rounded-xl flex items-center gap-2">
          <div className="bg-[#FFE0EB] p-3 rounded-full">
            <BsPiggyBank className="text-4xl text-pink-600" />
          </div>
          <div className="flex flex-col items-start gap-y-0">
            <h1 className="text-gray-600 text-xs font-normal">Referral Earn</h1>
            <p className="font-medium text-lg">
              <CountUp
                start={0}
                end={walletReports?.total_referral_earned}
                duration={2}
                decimal={"."}
                decimals={2}
              />
            </p>
          </div>
        </div>
      </div>

      <Table
        dataSource={walletReports.transactions}
        pagination
        className="mt-20"
        columns={transactionsColumns}
      />
      <Modal
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        title={
          <div className="w-full flex items-center justify-center">
            <h1 className="font-medium py-2">Add Balance</h1>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleBalanceAdd}>
          <Form.Item
            name={"balance"}
            label={<h1 className="font-normal">Balance</h1>}
          >
            <InputNumber
              className="w-full p-1 rounded-lg"
              placeholder="Enter Balance"
            />
          </Form.Item>

          <div className="w-full flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2  rounded-lg border border-gray-300 text-gray-500 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2  rounded-lg bg-[#1B2850] text-white text-sm"
            >
              Add Balance
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Wallet;
