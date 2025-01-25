import { ShoppingCartOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  notification,
  Pagination,
  Select,
  Space,
  Typography,
} from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { getDecodedToken } from "../../utils/auth";
import Error from "../Error";

const { Option } = Select;
const { Text } = Typography;

interface Product {
  _id: string;
  title: string;
  short_description: string;
  image: string;
  product_type: "simple" | "variable";
  price?: number;
  renewable_price?: number;
  delivery_type?: string;
  category?: {
    category: string;
  };
  renewable?: boolean;
  isRenewed?: boolean;
  variants?: Variant[];
}

interface Variant {
  _id: string;
  name: string;
  price: number;
  renewable_price?: number;
  renewable?: boolean;
  isRenewed?: boolean;
}

interface WalletReport {
  wallet_balance: number;
}

interface PurchaseData {
  product: string;
  variant?: string;
  total_price: number;
  userId: string;
  payment_method: "bkash" | "wallet";
  wallet_deduction: number;
  remaining_amount: number;
}

const ProductsUser: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getDecodedToken();
  const axiosSecure = useAxiosSecure();

  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string | null>
  >({});
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    Record<string, "bkash" | "wallet">
  >({});
  const [useWalletBalance, setUseWalletBalance] = useState<
    Record<string, boolean>
  >({});

  const {
    data: walletReports = { wallet_balance: 0 },
    isLoading: walletLoading,
    error: walletError,
  } = useQuery<WalletReport>({
    queryKey: ["walletReport"],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID is not available");
      const { data } = await axiosSecure.get(`/wallet/report/${user.id}`);
      return data;
    },
  });

  const fetchProducts = async (): Promise<Product[]> => {
    const { data } = await axiosSecure.get("/products");
    return data.data;
  };

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const paginatedProducts = products.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  const createPurchase = async (purchaseData: PurchaseData) => {
    const { data } = await axiosSecure.post("/purchases", purchaseData);
    return data;
  };

  const { mutateAsync: handlePurchase } = useMutation({
    mutationFn: createPurchase,
    onSuccess: (data) => {
      // notification.success({
      //   message: "Purchase Successful",
      //   description: "Your purchase has been completed successfully.",
      // });

      setTimeout(() => {
        if (data.success) {
          if (data?.payment_method === "bkash") {
            window.location.href = data.data.bkashURL;
          } else if (data?.payment_method === "wallet") {
            notification.success({
              message: "Wallet Purchase Successful",
              description: "Your purchase has been completed successfully.",
            });
            navigate("/orders");
          }
        }
      }, 1000);
    },
    onError: () => {
      notification.error({
        message: "Purchase Failed",
        description: "There was an error processing your purchase.",
      });
    },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dataParam = searchParams.get("data");
    if (dataParam === "Payment successful") {
      notification.success({
        message: "Purchase Successful",
        description: "Your purchase has been completed successfully.",
      });
    }
  }, [location]);

  const handleBuyNow = (product: Product) => {
    if (!user?.id) {
      notification.error({
        message: "User Error",
        description: "User ID is not available.",
      });
      return;
    }

    const productPrice =
      product.product_type === "simple"
        ? product.price ?? 0
        : product.variants?.find((v) => v._id === selectedVariants[product._id])
            ?.price || 0;

    const walletBalance = walletReports.wallet_balance;
    const walletDeduction = useWalletBalance[product._id]
      ? Math.min(walletBalance, productPrice)
      : 0;

    const amountToPay = productPrice - walletDeduction;

    console.log({
      productPrice,
      walletBalance,
      walletDeduction,
      amountToPay,
      selectedPaymentMethod: selectedPaymentMethods[product._id],
      useWalletBalance: useWalletBalance[product._id],
    });

    const purchasedProduct: PurchaseData = {
      product: product._id,
      variant:
        product.product_type === "variable"
          ? selectedVariants[product._id] || undefined
          : undefined,
      total_price: productPrice,
      userId: user?.id,
      payment_method: selectedPaymentMethods[product._id] || "bkash",
      wallet_deduction: walletDeduction,
      remaining_amount: amountToPay,
    };

    if (selectedPaymentMethods[product._id] === "wallet") {
      if (walletBalance >= productPrice) {
        handlePurchase({ ...purchasedProduct, payment_method: "wallet" });
      } else {
        notification.error({
          message: "Insufficient Balance",
          description: "You don't have enough balance in your wallet.",
        });
      }
    } else if (selectedPaymentMethods[product._id] === "bkash") {
      handlePurchase({ ...purchasedProduct, payment_method: "bkash" });
    } else {
      notification.error({
        message: "Payment Error",
        description: "Please select a valid payment method.",
      });
    }
  };

  const handleVariantChange = (productId: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: value }));
  };

  const handlePaymentMethodChange = (
    productId: string,
    value: "bkash" | "wallet"
  ) => {
    setSelectedPaymentMethods((prev) => ({ ...prev, [productId]: value }));
  };

  const handleWalletCheckboxChange = (
    productId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUseWalletBalance((prev) => ({ ...prev, [productId]: e.target.checked }));
  };

  useEffect(() => {
    products.forEach((product) => {
      const productPrice =
        product.product_type === "simple"
          ? product.price || 0
          : product.variants?.find(
              (v) => v._id === selectedVariants[product._id]
            )?.price || 0;

      const walletBalance = walletReports.wallet_balance;

      if (walletBalance >= productPrice) {
        setSelectedPaymentMethods((prev) => ({
          ...prev,
          [product._id]: "wallet",
        }));
      } else if (!selectedPaymentMethods[product._id]) {
        setSelectedPaymentMethods((prev) => ({
          ...prev,
          [product._id]: "bkash",
        }));
      }
    });
  }, [products, walletReports, selectedVariants]);

  if (isLoading || walletLoading) return <Loading />;
  if (walletError) return <Error />;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-gray-900 px-10">Products</h1>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {products.map((product: Product) => {
          const productPrice =
            product.product_type === "simple"
              ? product.price || 0
              : product.variants?.find(
                  (v) => v._id === selectedVariants[product._id]
                )?.price || 0;

          const walletBalance = walletReports.wallet_balance;
          const amountToPay = useWalletBalance[product._id]
            ? Math.max(productPrice - walletBalance, 0)
            : productPrice;

          return (
            <Card
              key={product._id}
              hoverable
              cover={
                <>
                  <div className="relative">
                    <img
                      alt={product.title}
                      src={product.image || "/placeholder.svg"}
                      className="h-[200px] w-full object-cover"
                    />
                    <div
                      className="absolute bottom-2 right-2 bg-black text-white px-4 py-2 rounded-lg text-sm"
                      style={{ zIndex: 10 }}
                    >
                      ৳{productPrice}
                    </div>
                  </div>
                </>
              }
              className="shadow-lg rounded-lg overflow-hidden px-0"
            >
              <Card.Meta
                title={
                  <Text className="text-xl font-semibold text-gray-900 px-0">
                    {product.title}
                  </Text>
                }
                description={
                  <Text className="text-gray-600">
                    {product.short_description}
                  </Text>
                }
              />
              <div className="mt-4 flex flex-col items-start">
                {product.product_type === "simple" ? (
                  <>
                    <Space direction="vertical" className="mt-2 w-full">
                      <Select
                        onChange={(value) =>
                          handlePaymentMethodChange(product._id, value)
                        }
                        className="w-full"
                        value={selectedPaymentMethods[product._id] || "bkash"}
                      >
                        <Option value="bkash">bKash</Option>
                        <Option
                          value="wallet"
                          disabled={walletBalance < productPrice}
                        >
                          Reward (Balance: ৳{walletBalance})
                        </Option>
                      </Select>
                    </Space>
                    <button
                      className="mt-2 bg-black text-white hover:bg-black w-full py-2 rounded-md flex items-center justify-center gap-2"
                      onClick={() => handleBuyNow(product)}
                      disabled={
                        selectedPaymentMethods[product._id] === "wallet" &&
                        walletBalance < productPrice
                      }
                    >
                      <ShoppingCartOutlined />
                      <span>Pay Now</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Select
                      onChange={(value) =>
                        handleVariantChange(product._id, value)
                      }
                      className="w-full"
                      placeholder="Select Variant"
                      value={selectedVariants[product._id] || null}
                    >
                      {product.variants?.map((variant) => (
                        <Option key={variant._id} value={variant._id}>
                          {variant.name} - ৳{variant.price}
                        </Option>
                      ))}
                    </Select>
                    <Space direction="vertical" className="mt-2 w-full">
                      <Select
                        onChange={(value) =>
                          handlePaymentMethodChange(product._id, value)
                        }
                        className="w-full"
                        value={selectedPaymentMethods[product._id] || "bkash"}
                      >
                        <Option value="bkash">Pay with bKash</Option>
                        <Option
                          value="wallet"
                          disabled={walletBalance < productPrice}
                        >
                          Pay with Reward (Balance: ৳{walletBalance})
                        </Option>
                      </Select>
                    </Space>
                    <button
                      className="mt-2 bg-black text-white hover:bg-black w-full py-2 rounded-md flex items-center justify-center gap-2"
                      onClick={() => handleBuyNow(product)}
                      disabled={
                        selectedPaymentMethods[product._id] === "wallet" &&
                        walletBalance < productPrice
                      }
                    >
                      <ShoppingCartOutlined />
                      <span>Pay Now</span>
                    </button>
                    {/* <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      className="mt-2 bg-black text-white hover:bg-black w-full"
                      onClick={() => handleBuyNow(product)}
                      disabled={
                        selectedPaymentMethods[product._id] === "wallet" &&
                        walletBalance < productPrice
                      }
                    >
                      Pay Now
                    </Button> */}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <div className="w-full flex items-center justify-center">
        <Pagination
          className="my-6 text-center"
          current={currentPage}
          pageSize={pageSize}
          total={products.length}
          showSizeChanger
          onChange={handlePageChange}
          pageSizeOptions={["10", "20", "30"]}
        />
      </div>
    </div>
  );
};

export default ProductsUser;
