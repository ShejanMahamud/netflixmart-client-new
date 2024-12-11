import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Form, Input, InputNumber, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import React, { useEffect, useState } from "react";
import useAxiosSecure from "../hooks/useAxiosSecure";
import { decrypt } from "../utils/encryption";

const { Option } = Select;

interface CredentialFormProps {
  initialValues?: unknown;
  onFinish: (values: unknown) => unknown;
  onCancel: () => void;
  isEditing: boolean;
}

const CredentialForm: React.FC<CredentialFormProps> = ({
  initialValues,
  onFinish,
  onCancel,
  isEditing,
}) => {
  const [form] = Form.useForm();
  const axiosSecure = useAxiosSecure();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await axiosSecure.get(`/products`);
      return data.data;
    },
  });

  // Set initial form values when editing
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        product: initialValues.product?._id, // Set product ID
        variant: initialValues.product?.variant?._id,
        validity_type: initialValues?.validity_type,
        username: decrypt(initialValues?.username),
        password: decrypt(initialValues?.password),
        validity_duration: initialValues?.validity_duration,
      });

      // Set the selected product state for proper rendering of variants
      const selectedProduct = products.find(
        (product) => product._id === initialValues.product?._id
      );
      setSelectedProduct(selectedProduct || null);
    }
  }, [initialValues, form, products]);

  // Fetch products for the dropdown

  // Handle product selection to set the selected product data
  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    setSelectedProduct(product || null);
    form.setFieldsValue({ variant: undefined }); // Reset variant when changing product
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ...initialValues,
      }}
      onFinish={(values) => {
        onFinish(values);
      }}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: !isEditing, message: "Please input the name!" }]}
      >
        <Input placeholder="Ex: Netflix, Amazon, ChatGPT" />
      </Form.Item>

      <Form.Item
        name="username"
        label="Account/Email"
        rules={[
          { required: !isEditing, message: "Please input username/email!" },
        ]}
      >
        <Input placeholder="Enter account/email" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[
          { required: !isEditing, message: "Please input the password!" },
        ]}
      >
        <Input.Password
          placeholder="Enter password"
          iconRender={(visible) =>
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
        />
      </Form.Item>

      {/* Product Selection Dropdown */}
      <Form.Item
        name="product"
        label="Select Product"
        rules={[{ required: !isEditing, message: "Please select a product!" }]}
      >
        <Select
          placeholder="Select a product"
          onChange={handleProductChange}
          allowClear
        >
          {products.map((product) => (
            <Option key={product._id} value={product._id}>
              {product.title}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Variant Selection Dropdown, shown only if the selected product is variable */}
      {selectedProduct &&
        selectedProduct.product_type === "variable" &&
        selectedProduct.variants?.length > 0 && (
          <Form.Item
            name="variant"
            label="Select Variant"
            rules={[
              { required: !isEditing, message: "Please select a variant!" },
            ]}
          >
            <Select placeholder="Select a variant">
              {selectedProduct.variants.map((variant) => (
                <Option key={variant._id} value={variant._id}>
                  {variant.name} - ${variant.price}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

      {/* Validity Input */}
      <Form.Item
        name="validity_duration"
        label="Validity"
        rules={[{ required: !isEditing, message: "Please input validity!" }]}
      >
        <InputNumber
          placeholder="Enter validity duration"
          min={1}
          className="w-full"
        />
      </Form.Item>

      {/* Validity Type Selection */}
      <Form.Item
        name="validity_type"
        label="Select Validity Type"
        initialValue={"day"}
        rules={[
          { required: !isEditing, message: "Please select validity type!" },
        ]}
      >
        <Select placeholder="Select validity type">
          <Option value="month">Month(s)</Option>
          <Option value="day">Day(s)</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="max_activation"
        label="Max Activation"
        rules={[
          { required: !isEditing, message: "Please input max activation!" },
        ]}
      >
        <InputNumber
          placeholder="Enter max activation"
          min={1}
          className="w-full"
        />
      </Form.Item>

      <Form.Item
        name="rules"
        label="Rules"
        rules={[
          { required: !isEditing, message: "Please input account rules!" },
        ]}
      >
        <TextArea placeholder="Enter account rules" />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: !isEditing, message: "Please select status!" }]}
      >
        <Select>
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default CredentialForm;
