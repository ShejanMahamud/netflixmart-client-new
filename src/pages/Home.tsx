import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import CountUp from "react-countup";
import { BiUser } from "react-icons/bi";
import { BsCart2, BsCash, BsLightbulb } from "react-icons/bs";
import { FaArrowTrendUp } from "react-icons/fa6";
import { FiUserPlus } from "react-icons/fi";
import { GrGroup } from "react-icons/gr";
import { TbCalendarDue } from "react-icons/tb";
import useAxiosSecure from "../hooks/useAxiosSecure";
import { getDecodedToken } from "../utils/auth";

import { ApexOptions } from "apexcharts";
import Loading from "../components/Loading";
import Error from "./Error";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// interface Stats {
//   totalProducts: number;
//   totalCustomers: number;
//   totalSales: number;
//   totalSalesToday: number;
//   totalOrders: number;
//   pendingOrders: number;
//   completedOrders: number;
//   cancelOrders: number;
// }

// interface UserStats {
//   userPurchases: number;
//   walletBalance: number;
//   activeSubscriptions: number;
//   totalReferrals: number;
// }

interface TopProduct {
  title: string;
  price: number;
}

interface Report {
  date: string;
  totalPurchases: number;
}

// interface SalesTrend {
//   salesGrowthRate: number;
//   averageOrderValue: number;
// }

// interface UserReport {
//   dailyActiveUsers: number;
//   newSignUps: number;
// }

const Home = () => {
  const axiosSecure = useAxiosSecure();
  const user = getDecodedToken() as User | null;
  const [barChartSeries, setBarChartSeries] = useState<
    { name: string; data: number[] }[]
  >([]);
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [options, setOptions] = useState<ApexOptions>({
    chart: {
      height: 350,
      type: "area", // Correctly typed
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth" as const,
    },
    xaxis: {
      type: "datetime",
      categories: [] as string[],
    },
    tooltip: {
      x: {
        format: "dd/MM/yy HH:mm",
      },
    },
  });
  const [barChartOptions, setBarChartOptions] = useState({
    chart: {
      type: "bar" as const,
      height: 350,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: [] as string[], // This will hold the product titles
    },
  });
  const userReportOptions = {
    chart: {
      type: "bar" as const,
      height: 350,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: ["Daily Active Users", "New Sign Ups"],
    },
  };

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/stats/admin");
      return data;
    },
    enabled: user?.role === "admin",
  });
  const {
    data: userStats,
    isLoading: userStatsisLoading,
    error: userStatserror,
  } = useQuery({
    queryKey: ["user_stats"],
    queryFn: async () => {
      const { data } = await axiosSecure.get(`/auth/user/stats/${user?.id}`);
      return data;
    },
  });
  const {
    data: userPurchasereports,
    isLoading: userPurchaseReportsLoading,
    error: userPurchaseReportsError,
  } = useQuery({
    queryKey: ["user_purchase_report"],
    queryFn: async () => {
      const { data } = await axiosSecure.get(
        `/purchases/report/user/${user?.id}`
      );
      return data;
    },
  });
  const {
    data: reports,
    isLoading: reportLoading,
    error: reportsError,
  } = useQuery({
    queryKey: ["purchase_report"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/purchases/report/admin");
      return data;
    },
    enabled: user?.role === "admin",
  });
  const {
    data: topProducts = [],
    isLoading: topLoading,
    error: topError,
  } = useQuery({
    queryKey: ["top_products"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/products/top");
      return data.data;
    },
    enabled: user?.role === "admin",
  });
  const {
    data: userReport = [],
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["user_report"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/auth/user/admin/report");
      return data;
    },
    enabled: user?.role === "admin",
  });

  const {
    data: salesTrend = [],
    isLoading: salesTrendLoading,
    error: salesTrendError,
  } = useQuery({
    queryKey: ["sales_trends_reports"],
    queryFn: async () => {
      const { data } = await axiosSecure.get(
        "/purchases/report/admin/sales-trend"
      );
      return data;
    },
    enabled: user?.role === "admin",
  });
  const {
    data: subscriptionActive = [],
    isLoading: subscriptionActiveLoading,
    error: subscriptionActiveError,
  } = useQuery({
    queryKey: ["active-subscription-by-cat"],
    queryFn: async () => {
      const { data } = await axiosSecure.get(
        "/stats/active-subscription-by-cat"
      );
      return data;
    },
  });

  useEffect(() => {
    if (
      (reports && reports.length > 0) ||
      (userPurchasereports && userPurchasereports.length > 0)
    ) {
      const categories =
        user?.role === "admin"
          ? reports.map((report: Report) => report.date)
          : userPurchasereports.map((report: Report) => report.date);
      const values =
        user?.role === "admin"
          ? reports.map((report: Report) => report.totalPurchases)
          : userPurchasereports.map((report: Report) => report.totalPurchases);

      // Only update state if values have changed
      if (JSON.stringify(values) !== JSON.stringify(series[0]?.data)) {
        setSeries([
          {
            name: user?.role === "admin" ? "Sales" : "Purchases",
            data: values,
          },
        ]);
        setOptions((prevOptions) => ({
          ...prevOptions,
          xaxis: {
            ...prevOptions.xaxis,
            categories: categories,
          },
        }));
      }
    }
  }, [reports, series, userPurchasereports, user?.role]);

  useEffect(() => {
    if (topProducts && topProducts.length > 0) {
      const categories = topProducts.map(
        (product: TopProduct) => product.title
      );
      const values = topProducts.map((product: TopProduct) => product.price);

      // Only update state if values have changed
      if (JSON.stringify(values) !== JSON.stringify(barChartSeries[0]?.data)) {
        setBarChartSeries([{ name: "Price", data: values }]);
        setBarChartOptions((prevOptions) => ({
          ...prevOptions,
          xaxis: {
            ...prevOptions.xaxis,
            categories: categories,
          },
        }));
      }
    }
  }, [topProducts, barChartSeries]);

  const salesTrendOptions = {
    chart: {
      type: "pie" as const,
    },
    labels: ["Sales Growth Rate", "Average Order Value"],
    colors: ["#00E396", "#008FFB"],
    dataLabels: {
      enabled: true,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "50%",
        },
      },
    },
  };

  const salesTrendSeries = [
    salesTrend?.salesGrowthRate || 0,
    salesTrend?.averageOrderValue || 0,
  ];

  const subscriptionOptions = {
    chart: {
      type: "pie" as const,
    },
    labels: subscriptionActive?.map(
      (item: { category: string }) => item.category
    ), // Dynamically set labels based on category names
    colors: ["#00E396", "#008FFB", "#FEB019", "#FF4560"], // Add more colors if needed
    dataLabels: {
      enabled: true,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "50%",
        },
      },
    },
  };

  // Create the series data based on count values
  const subscriptionSeries =
    subscriptionActive?.map((item: { count: number }) => item.count) || [];

  const userReportSeries = [
    {
      name: "Users",
      data: [userReport?.dailyActiveUsers || 0, userReport?.newSignUps || 0],
    },
  ];

  if (
    isLoading ||
    reportLoading ||
    topLoading ||
    salesTrendLoading ||
    userLoading ||
    userStatsisLoading ||
    subscriptionActiveLoading ||
    userPurchaseReportsLoading
  ) {
    return <Loading />;
  }
  if (
    error ||
    reportsError ||
    topError ||
    salesTrendError ||
    userError ||
    userStatserror ||
    subscriptionActiveError ||
    userPurchaseReportsError
  ) {
    return <Error />;
  }

  return (
    <div className="w-full p-5 font-primary">
      <div className="flex items-start flex-col">
        <h1 className="text-xl font-medium text-[#092C4C]">
          Welcome {user?.name}!
        </h1>
        <p className="text-gray-500 text-sm">
          Here is the overview of your account
        </p>
      </div>
      {user?.role === "admin" ? (
        <>
          <div className="w-full grid lg:grid-cols-4 grid-cols- 1 row-auto items-center gap-6">
            <div className="bg-white py-6 px-4 border border-gray-300 rounded-lg flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-[#E1F9FC] rounded-full">
                <BsCart2 className="text-[#00CFE8] text-2xl" />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="font-bold text-lg text-[#092C4C]">
                  <CountUp
                    start={0}
                    end={stats?.totalProducts}
                    duration={2}
                    //
                  />
                </h1>
                <span className="text-gray-500 text-sm">Total Products</span>
              </div>
            </div>
            <div className="bg-white py-6 px-4 border border-gray-300 rounded-lg flex items-center  gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-[#FEECED] rounded-full">
                <BiUser className="text-[#FF9F43] text-2xl" />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="font-bold text-lg text-[#092C4C]">
                  <CountUp
                    start={0}
                    end={stats?.totalCustomers}
                    duration={2}
                    //
                  />
                </h1>
                <span className="text-gray-500 text-sm">Total Customers</span>
              </div>
            </div>
            <div className="bg-white py-6 px-4 border border-gray-300 rounded-lg flex items-center  gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-[#E2F8ED] rounded-full">
                <BsCash className="text-[#28C76F] text-2xl" />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="font-bold text-lg text-[#092C4C]">
                  <CountUp
                    start={0}
                    end={stats?.totalSales}
                    duration={2}
                    decimal={"."}
                    decimals={2}
                    prefix="৳ "
                  />
                </h1>
                <span className="text-gray-500 text-sm">Total Sales</span>
              </div>
            </div>
            <div className="bg-white py-6 px-4 border border-gray-300 rounded-lg flex items-center  gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-[#FCE8E9] rounded-full">
                <FaArrowTrendUp className="text-[#EA5455] text-lg" />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="font-bold text-lg text-[#092C4C]">
                  <CountUp
                    start={0}
                    end={stats?.totalSalesToday}
                    duration={2}
                    decimal={"."}
                    decimals={2}
                    prefix="৳ "
                  />
                </h1>
                <span className="text-gray-500 text-sm">Today Sales</span>
              </div>
            </div>
          </div>

          <div className="w-full grid lg:grid-cols-4 grid-cols-1 row-auto items-center gap-6 my-12">
            <div className="bg-[#1B2850] py-2 h-[100px] px-4 rounded-lg flex items-center gap-4 justify-between group">
              <div className="flex flex-col items-start text-white">
                <h1 className="font-bold text-xl group-hover:text-lg duration-500">
                  <CountUp
                    start={0}
                    end={stats?.totalOrders} // Assuming totalOrders is part of your stats
                    duration={2}
                  />
                </h1>
                <span className=" text-sm font-medium">Total Orders</span>
              </div>
              <BsCart2 className="text-5xl group-hover:text-6xl duration-500 text-white" />
            </div>

            <div className="bg-[#FF9F43] py-2 h-[100px] px-4 rounded-lg flex items-center gap-4 justify-between group">
              <div className="flex flex-col items-start text-white">
                <h1 className="font-bold text-xl group-hover:text-lg duration-500">
                  <CountUp
                    start={0}
                    end={stats?.pendingOrders} // Assuming pendingOrders is part of your stats
                    duration={2}
                  />
                </h1>
                <span className=" text-sm font-medium">Pending Orders</span>
              </div>
              <TbCalendarDue className="text-5xl group-hover:text-6xl duration-500 text-white" />
            </div>

            <div className="bg-[#1ECFE8] py-2 h-[100px] px-4 rounded-lg flex items-center gap-4 justify-between group">
              <div className="flex flex-col items-start text-white">
                <h1 className="font-bold text-xl group-hover:text-lg duration-500">
                  <CountUp
                    start={0}
                    end={stats?.completedOrders} // Assuming averageRating is part of your stats
                    duration={2}
                  />
                </h1>
                <span className=" text-sm font-medium">Completed Orders</span>
              </div>
              <GrGroup className="text-5xl group-hover:text-6xl duration-500 text-white" />
            </div>

            <div className="bg-[#4BC770] py-2 h-[100px] px-4 rounded-lg flex items-center gap-4 justify-between group">
              <div className="flex flex-col items-start text-white">
                <h1 className="font-bold text-xl group-hover:text-lg duration-500">
                  <CountUp
                    start={0}
                    end={stats?.cancelOrders} // Assuming monthlyRevenue is part of your stats
                    duration={2}
                  />
                </h1>
                <span className=" text-sm font-medium">Cancel Orders</span>
              </div>
              <BsCash className="text-5xl group-hover:text-6xl duration-500 text-white" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-full grid lg:grid-cols-4 grid-cols- 1 row-auto items-center gap-6">
            <div className="bg-white py-6 px-4 border border-gray-300 rounded-lg flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-[#E1F9FC] rounded-full">
                <BsCart2 className="text-[#00CFE8] text-2xl" />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="font-bold text-lg text-[#092C4C]">
                  <CountUp
                    start={0}
                    end={userStats?.completedOrders}
                    duration={2}
                  />
                </h1>
                <span className="text-gray-500 text-sm">Total Purchases</span>
              </div>
            </div>
            <div className="bg-white py-6 px-4 border border-gray-300 rounded-lg flex items-center  gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-[#FEECED] rounded-full">
                <BsCash className="text-[#FF9F43] text-2xl" />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="font-bold text-lg text-[#092C4C]">
                  <CountUp
                    start={0}
                    end={userStats?.walletBalance}
                    duration={2}
                  />
                </h1>
                <span className="text-gray-500 text-sm">Reward Balance</span>
              </div>
            </div>
            <div className="bg-white py-6 px-4 border border-gray-300 rounded-lg flex items-center  gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-[#E2F8ED] rounded-full">
                <BsLightbulb className="text-[#28C76F] text-2xl" />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="font-bold text-lg text-[#092C4C]">
                  <CountUp
                    start={0}
                    end={userStats?.activeSubscriptions}
                    duration={2}
                  />
                </h1>
                <span className="text-gray-500 text-sm">
                  Active Subscriptions
                </span>
              </div>
            </div>
            <div className="bg-white py-6 px-4 border border-gray-300 rounded-lg flex items-center  gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-[#FCE8E9] rounded-full">
                <FiUserPlus className="text-[#EA5455] text-2xl" />
              </div>
              <div className="flex flex-col items-start">
                <h1 className="font-bold text-lg text-[#092C4C]">
                  <CountUp
                    start={0}
                    end={userStats?.totalReferrals}
                    duration={2}
                  />
                </h1>
                <span className="text-gray-500 text-sm">Today Referrals</span>
              </div>
            </div>
          </div>
          <div className="w-full grid lg:grid-cols-4 grid-cols-1 row-auto items-center gap-6 my-12">
            <div className="bg-[#1B2850] py-2 h-[100px] px-4 rounded-lg flex items-center gap-4 justify-between group">
              <div className="flex flex-col items-start text-white">
                <h1 className="font-bold text-xl group-hover:text-lg duration-500">
                  <CountUp
                    start={0}
                    end={userStats?.totalOrders} // Assuming totalOrders is part of your stats
                    duration={2}
                  />
                </h1>
                <span className=" text-sm font-medium">Total Orders</span>
              </div>
              <BsCart2 className="text-5xl group-hover:text-6xl duration-500 text-white" />
            </div>

            <div className="bg-[#FF9F43] py-2 h-[100px] px-4 rounded-lg flex items-center gap-4 justify-between group">
              <div className="flex flex-col items-start text-white">
                <h1 className="font-bold text-xl group-hover:text-lg duration-500">
                  <CountUp
                    start={0}
                    end={userStats?.pendingOrders} // Assuming pendingOrders is part of your stats
                    duration={2}
                  />
                </h1>
                <span className=" text-sm font-medium">Pending Orders</span>
              </div>
              <TbCalendarDue className="text-5xl group-hover:text-6xl duration-500 text-white" />
            </div>

            <div className="bg-[#1ECFE8] py-2 h-[100px] px-4 rounded-lg flex items-center gap-4 justify-between group">
              <div className="flex flex-col items-start text-white">
                <h1 className="font-bold text-xl group-hover:text-lg duration-500">
                  <CountUp
                    start={0}
                    end={userStats?.completedOrders} // Assuming averageRating is part of your stats
                    duration={2}
                  />
                </h1>
                <span className=" text-sm font-medium">Completed Orders</span>
              </div>
              <GrGroup className="text-5xl group-hover:text-6xl duration-500 text-white" />
            </div>

            <div className="bg-[#4BC770] py-2 h-[100px] px-4 rounded-lg flex items-center gap-4 justify-between group">
              <div className="flex flex-col items-start text-white">
                <h1 className="font-bold text-xl group-hover:text-lg duration-500">
                  <CountUp
                    start={0}
                    end={userStats?.cancelOrders} // Assuming monthlyRevenue is part of your stats
                    duration={2}
                    decimal={"."}
                  />
                </h1>
                <span className=" text-sm font-medium">Cancel Orders</span>
              </div>
              <BsCash className="text-5xl group-hover:text-6xl duration-500 text-white" />
            </div>
          </div>
        </>
      )}

      {user?.role === "admin" && (
        <div className="w-full grid lg:grid-cols-2 grid-cols-1 row-auto items-center gap-5">
          <div className="bg-white border border-gray-300 p-6 rounded-lg w-full">
            <h2 className="font-bold text-lg text-[#092C4C]">Sales Report</h2>
            <ReactApexChart
              options={options}
              series={series}
              type="area"
              height={350}
            />
          </div>
          <div className="bg-white border border-gray-300 p-6 rounded-lg w-full">
            <h2 className="font-bold text-lg text-[#092C4C]">Top 5 Products</h2>
            <ReactApexChart
              options={barChartOptions}
              series={barChartSeries}
              type="bar"
              height={350}
            />
          </div>
          <div className="bg-white border border-gray-300 p-6 rounded-lg w-full">
            <h2 className="font-bold text-lg text-[#092C4C]">Sales Trends</h2>
            <ReactApexChart
              options={salesTrendOptions}
              series={salesTrendSeries}
              type="pie"
              height={350}
            />
          </div>
          <div className="bg-white border border-gray-300 p-6 rounded-lg w-full">
            <h2 className="font-bold text-lg text-[#092C4C]">User Reports</h2>
            <ReactApexChart
              options={userReportOptions}
              series={userReportSeries}
              type="bar"
              height={350}
            />
          </div>
        </div>
      )}
      {user?.role === "user" && (
        <div className="w-full grid lg:grid-cols-2 grid-cols-1 row-auto items-center gap-5">
          <div className="bg-white border border-gray-300 p-6 rounded-lg w-full">
            <h2 className="font-bold text-lg text-[#092C4C]">
              Purchase Report
            </h2>
            <ReactApexChart
              options={options}
              series={series}
              type="area"
              height={350}
            />
          </div>
          <div className="bg-white border border-gray-300 p-6 rounded-lg w-full">
            <h2 className="font-bold text-lg text-[#092C4C]">
              Subscription Active By Category
            </h2>
            <ReactApexChart
              options={subscriptionOptions}
              series={subscriptionSeries}
              type="pie"
              height={350}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
