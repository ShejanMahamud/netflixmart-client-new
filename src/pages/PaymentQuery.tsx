import { useMutation } from "@tanstack/react-query";
import { Button, Card, Form, Input, message, Spin, Typography } from "antd";
import React, { useState } from "react";
import Swal from "sweetalert2";
import useAxiosSecure from "../hooks/useAxiosSecure";

const { Text } = Typography;

const PaymentQuery: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const [queryResponse, setQueryResponse] = useState<any>(null);
  const [searchResponse, setSearchResponse] = useState<any>(null);

  const { mutateAsync: queryPayment, isPending: queryPaymentLoading } =
    useMutation({
      mutationFn: async (paymentID: string) => {
        const { data } = await axiosSecure.post(`/bkash/query/${paymentID}`);
        return data;
      },
      onSuccess: (data) => {
        if (data.success) {
          setQueryResponse(data.data);
          Swal.fire({
            icon: "success",
            title: "Successfully Queried Payment!",
            text: "Operation Successful!",
          });
        } else {
          message.error("Failed to query payment.");
        }
      },
      onError: () => {
        message.error("An error occurred while querying the payment.");
      },
    });

  const { mutateAsync: searchPayment, isPending: searchPaymentLoading } =
    useMutation({
      mutationFn: async (trxID: string) => {
        const { data } = await axiosSecure.post(`/bkash/search/${trxID}`);
        return data;
      },
      onSuccess: (data) => {
        if (data.success) {
          setSearchResponse(data.data);
          Swal.fire({
            icon: "success",
            title: "Successfully Searched Payment!",
            text: "Operation Successful!",
          });
        } else {
          message.error("Failed to search payment.");
        }
      },
      onError: () => {
        message.error("An error occurred while searching the payment.");
      },
    });

  const handleQuerySubmit = (values: { paymentID: string }) => {
    queryPayment(values.paymentID);
  };

  const handleSearchSubmit = (values: { tnxID: string }) => {
    searchPayment(values.tnxID);
  };

  return (
    <div className="w-full p-2">
      <h1 className="mb-5">Search/ Query Payment</h1>
      <div className="w-full grid grid-cols-2 row-auto items-start justify-center gap-5">
        <div>
          <Form layout="vertical" onFinish={handleQuerySubmit}>
            <Form.Item
              label="Payment ID"
              name="paymentID"
              rules={[
                { required: true, message: "Please input the Payment ID!" },
              ]}
            >
              <Input placeholder="Enter Payment ID" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={queryPaymentLoading}
                block
              >
                Query Payment
              </Button>
            </Form.Item>
          </Form>
          <Form layout="vertical" onFinish={handleSearchSubmit}>
            <Form.Item
              label="Transaction ID"
              name="tnxID"
              rules={[
                { required: true, message: "Please input the Transaction ID!" },
              ]}
            >
              <Input placeholder="Enter Transaction ID" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={searchPaymentLoading}
                block
              >
                Search Payment
              </Button>
            </Form.Item>
          </Form>
        </div>
        <Spin spinning={queryPaymentLoading || searchPaymentLoading}>
          {queryResponse && (
            <Card
              title="Query Payment Response"
              type="inner"
              style={{ marginTop: 20 }}
            >
              {Object.entries(queryResponse).map(([key, value]) => (
                <Text key={key}>
                  <strong>{key}: </strong>
                  {value}
                  <br />
                </Text>
              ))}
            </Card>
          )}
          {searchResponse && (
            <Card
              title="Search Payment Response"
              type="inner"
              style={{ marginTop: 20 }}
            >
              {Object.entries(searchResponse).map(([key, value]) => (
                <Text key={key}>
                  <strong>{key}: </strong>
                  {value}
                  <br />
                </Text>
              ))}
            </Card>
          )}
          {(!searchResponse ||
            (!queryResponse && !searchPaymentLoading) ||
            !queryPaymentLoading) ?? <Text>No Result Found!</Text>}
        </Spin>
      </div>
    </div>
  );
};

export default PaymentQuery;
