// src/components/Products.tsx

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Checkbox,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { isWithinInterval, parseISO } from "date-fns";
import moment from "moment";
import React, { useState } from "react";
import LoadingSpinner from "../components/utils/LoadingSpinner";
import { queryClient } from "../constants/constants";
import useAxiosSecure from "../hooks/useAxiosSecure";
import usePhotoUpload from "../hooks/usePhotoUpload";
import Error from "./Error";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Credentials {
  _id: string;
  name: string;
  // Add other relevant fields from the Credentials model
}

interface Variant {
  _id?: string;
  duration: number;
  price: number;
  stock: number;
  credentials: string;
  subscription_start_date: string;
  subscription_end_date: string;
}

interface Product {
  _id: string;
  title: string;
  short_description: string;
  image: string;
  product_type: "simple" | "variable";
  delivery_type: "instant" | "manual";
  category: string;
  subscription_start_date: string;
  subscription_end_date: string;
  credentials?: Credentials; // For simple products
  variants?: Variant[]; // For variable products
}

const Products: React.FC = () => {
  const [viewModal, setViewModal] = useState(false);
  const { uploadProps, photo } = usePhotoUpload();
  const axiosSecure = useAxiosSecure();
  const [visible, setVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [dateRange, setDateRange] = useState<
    [moment.Moment | null, moment.Moment | null] | null
  >(null);
  const [newCategory, setNewCategory] = useState(null);

  // Fetch Products
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: productRefetch,
  } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/products");
      return data.data;
    },
  });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Credentials[], Error>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/category");
      return data.data;
    },
  });

  const { mutateAsync: addCategory } = useMutation({
    mutationFn: async () => {
      const { data } = await axiosSecure.post("/category", {
        category: newCategory,
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        message.success("Category added successfully");
      }
    },
  });

  // Mutation to Add Product
  const { mutateAsync: addProduct } = useMutation({
    mutationFn: async (values: any) => {
      const { data } = await axiosSecure.post("/products", {
        ...values,
        image: photo,
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        message.success("Product created successfully");
        productRefetch();
        setVisible(false);
      }
    },
    onError: () => {
      message.error("Failed to create product.");
    },
  });

  // Mutation to Edit Product
  const { mutateAsync: editProduct } = useMutation({
    mutationFn: async (values: any) => {
      if (currentProduct) {
        const { data } = await axiosSecure.patch(
          `/products/${currentProduct._id}`,
          values
        );
        return data;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        message.success("Product updated successfully");
        productRefetch();
        setVisible(false);
      }
    },
    onError: () => {
      message.error("Failed to update product.");
    },
  });

  // Mutation to Delete Product
  const { mutateAsync: deleteProduct } = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosSecure.delete(`/products/${id}`);
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        message.success("Product deleted successfully");
        form.resetFields();
        productRefetch();
      }
    },
    onError: () => {
      message.error("Failed to delete product.");
    },
  });

  const handleCreateOrUpdateProduct = async (values: any) => {
    try {
      console.log("Submitting Product:", values);

      if (editMode) {
        await editProduct(values);
      } else {
        await addProduct(values);
      }
    } catch (error) {
      console.log(error);
      message.error("Failed to save product.");
    }
  };

  const showModal = (product: Product | null = null) => {
    // Reset the form before populating it
    form.resetFields();

    setVisible(true);

    if (product) {
      // Edit Mode
      setEditMode(true);
      setCurrentProduct(product);

      // Populate form fields with the product data
      form.setFieldsValue({
        ...product,
        variants:
          product.product_type === "variable"
            ? product.variants?.map((variant) => ({
                ...variant,
              }))
            : undefined,
      });
    } else {
      // Add Mode
      setEditMode(false);
      setCurrentProduct(null);

      // Set default values for adding a new product
      form.setFieldsValue({
        product_type: "simple",
        delivery_type: "instant",
        renewable: false,
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
    } catch (error) {
      // Error handled in onError
    }
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      fixed: "left",
      width: 100,
      align: "center",
      render: (text: string) => (
        <img
          src={text}
          alt="Product"
          className="w-14 h-14 rounded-2xl object-cover"
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      align: "center",
    },
    {
      title: "Short Description",
      dataIndex: "short_description",
      key: "short_description",
      ellipsis: true,
      align: "center",
    },
    {
      title: "Category",
      render: (_, record) => {
        return <Tag color="blue">{record?.category?.category ?? "N/A"}</Tag>;
      },
      key: "category",
      align: "center",
    },
    {
      title: "Delivery Type",
      dataIndex: "delivery_type",
      key: "delivery_type",
      align: "center",
      render: (text: string) => text.charAt(0).toUpperCase() + text.slice(1),
    },
    {
      title: "Renewable",
      key: "renewable",
      align: "center",
      render: (_, record: Product) => {
        const isSimple = record.product_type === "simple";
        const renewableProduct = isSimple
          ? record?.renewable
          : record.variants?.[0]?.renewable;
        return renewableProduct ? "Yes" : "No";
      },
    },
    {
      title: "Product Type",
      dataIndex: "product_type",
      key: "product_type",
      align: "center",
      render: (text: string) => text.charAt(0).toUpperCase() + text.slice(1),
    },
    {
      title: "Actions",
      align: "center",
      key: "actions",
      render: (text: any, record: Product) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
            />
          </Tooltip>

          <Tooltip title="View">
            <Button
              type="link"
              onClick={() => {
                setCurrentProduct(record);
                setViewModal(true);
              }}
            >
              <EyeOutlined />
            </Button>
          </Tooltip>

          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDeleteProduct(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredProducts = products
    .filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((product) =>
      selectedCategory ? product.category === selectedCategory : true
    )
    .filter((product) => {
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [startDateRange, endDateRange] = dateRange;

        // Parse dates using date-fns
        const productCreatedAt = parseISO(product.createdAt);
        const startDate = new Date(startDateRange);
        const endDate = new Date(endDateRange);
        return isWithinInterval(productCreatedAt, {
          start: startDate,
          end: endDate,
        });
      }
      return true;
    });

  // Define Columns for the Variants Nested Table
  const variantColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Price (৳)",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `৳${price.toFixed(2)}`,
    },
    {
      title: "Renewable",
      key: "renewable",
      align: "center",
      render: (_, record: Product) => {
        // For variable products, render the renewable status for each variant
        return <Tag color="blue">{record.renewable ? "Yes" : "No"}</Tag>;
      },
    },
    {
      title: "Renewable Price",
      key: "renewable_price",
      align: "center",
      render: (_, record: Product) => {
        return <Tag color="blue">৳{record.renewable_price?.toFixed(2)}</Tag>;
      },
    },
  ];

  // Expandable Row Render Function
  const expandedRowRender = (record: Product) => {
    if (record.product_type !== "variable" || !record.variants) {
      return null;
    }

    return (
      <Table
        columns={variantColumns}
        dataSource={record.variants.map((variant) => ({
          ...variant,
          key: variant._id || Math.random(), // Unique key for each variant
        }))}
        pagination={false}
        rowKey={(variant) => variant._id || Math.random()} // Ensure each row has a unique key
      />
    );
  };

  const renderFilters = () => (
    <Space className="flex flex-col items-end gap-2 mb-5">
      <Button type="primary" onClick={() => showModal()}>
        Add Product
      </Button>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search by title"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 200 }}
      />

      <Select
        placeholder="Filter by category"
        value={selectedCategory}
        onChange={(value) => setSelectedCategory(value)}
        allowClear
        style={{ width: 200 }}
      >
        {categories.map((cat) => (
          <Option value={cat.category}>{cat.category}</Option>
        ))}
      </Select>

      <RangePicker
        onChange={(dates) => setDateRange(dates)}
        style={{ width: 300 }}
        placeholder={["Start Date", "End Date"]}
      />
    </Space>
  );

  if (productsLoading || categoriesLoading) {
    return <LoadingSpinner />;
  }

  if (productsError || categoriesError) {
    return <Error />;
  }
  // console.log(currentProduct)
  return (
    <div className="container mx-auto p-4">
      <div className="w-full flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-4">Products</h1>
        {renderFilters()}
      </div>
      {/* <MUIProductTable
        products={filteredProducts.map((product) => ({
          ...product,
          key: product._id,
        }))}
      /> */}
      <Table
        columns={columns}
        dataSource={filteredProducts.map((product) => ({
          ...product,
          key: product._id,
        }))}
        rowKey="_id"
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
        expandable={{
          expandedRowRender: expandedRowRender,
          rowExpandable: (record: Product) =>
            record.product_type === "variable",
        }}
      />

      {/* Product Modal */}
      <Modal
        title={editMode ? "Edit Product" : "Add Product"}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          // form={editMode ? editForm : form}
          // initialValues={
          //   currentProduct
          //     ? {
          //         ...currentProduct,
          //         variants:
          //           currentProduct.product_type === "variable"
          //             ? currentProduct.variants?.map((variant) => ({
          //                 ...variant,
          //               }))
          //             : undefined,
          //       }
          //     : {
          //         product_type: "simple",
          //         delivery_type: "instant",
          //         renewable: false,
          //       }
          // }
          // onFinish={(values) => {
          //   const formData = {
          //     ...values,
          //     variants:
          //       values.product_type === "variable"
          //         ? values.variants
          //         : undefined,
          //   };
          //   handleCreateOrUpdateProduct(formData);
          // }}
          // layout="vertical"
          form={form}
          initialValues={{
            category: currentProduct?.category?.category,
            product_type: "simple",
            delivery_type: "instant",
            renewable: false,
          }}
          onFinish={(values) => {
            const formData = {
              ...values,
              variants:
                values.product_type === "variable"
                  ? values.variants
                  : undefined,
            };
            handleCreateOrUpdateProduct(formData);
          }}
          layout="vertical"
        >
          <Form.Item
            label="Product Type"
            name="product_type"
            rules={[
              {
                required: !editMode,
                message: "Please select the product type!",
              },
            ]}
          >
            <Select
              onChange={(value) => {
                if (value !== "variable") {
                  form.setFieldsValue({ variants: [] });
                } else {
                  form.setFieldsValue({
                    lifetime_product: false,
                    renewable: false,
                  });
                }
              }}
            >
              <Option value="simple">Simple</Option>
              <Option value="variable">Variable</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[
              {
                required: !editMode,
                message: "Please select the category!",
              },
            ]}
          >
            <Select
              className="w-full"
              placeholder="Category Name"
              // defaultValue={editMode && currentProduct?.category?.category}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <Space style={{ padding: "0 8px 4px" }}>
                    <Input
                      placeholder="Please enter item"
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={addCategory}
                    >
                      Add Category
                    </Button>
                  </Space>
                </>
              )}
              options={categories.map((cat) => ({
                label: cat.category,
                value: cat._id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Title"
            name="title"
            rules={[
              { required: !editMode, message: "Please input the title!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Short Description"
            name="short_description"
            rules={[
              { required: !editMode, message: "Please input the description!" },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Image URL"
            name="image"
            rules={[
              { required: !editMode, message: "Please input the image URL!" },
            ]}
          >
            {editMode && (currentProduct?.image || photo) && (
              <div style={{ marginBottom: 16 }}>
                <img
                  src={photo || currentProduct?.image}
                  alt="Product Image"
                  className="w-20 h-20 rounded-xl object-cover"
                />
              </div>
            )}
            <Upload {...uploadProps} listType="picture">
              <Button type="primary" icon={<UploadOutlined />}>
                Upload
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="Delivery Type"
            name="delivery_type"
            rules={[
              {
                required: !editMode,
                message: "Please select the delivery type!",
              },
            ]}
          >
            <Select>
              <Option value="instant">Instant</Option>
              <Option value="manual">Manual</Option>
            </Select>
          </Form.Item>

          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.product_type !== currentValues.product_type ||
              prevValues.lifetime_product !== currentValues.lifetime_product ||
              prevValues.renewable !== currentValues.renewable
            }
            noStyle
          >
            {({ getFieldValue }) =>
              getFieldValue("product_type") === "simple" && (
                <>
                  {!getFieldValue("renewable") && (
                    <Form.Item
                      label="Lifetime Product"
                      name="lifetime_product"
                      valuePropName="checked"
                    >
                      <Checkbox>Lifetime Product</Checkbox>
                    </Form.Item>
                  )}
                  {!getFieldValue("lifetime_product") && (
                    <Form.Item
                      label="Renewable"
                      name="renewable"
                      valuePropName="checked"
                    >
                      <Checkbox>Renewable</Checkbox>
                    </Form.Item>
                  )}
                </>
              )
            }
          </Form.Item>

          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.product_type !== currentValues.product_type ||
              prevValues.delivery_type !== currentValues.delivery_type
            }
            noStyle
          >
            {({ getFieldValue }) =>
              getFieldValue("product_type") === "simple" ? (
                <Form.Item
                  label="Price (৳)"
                  name="price"
                  rules={[
                    { required: !editMode, message: "Please select price!" },
                  ]}
                >
                  <InputNumber
                    placeholder="Enter Price"
                    type="number"
                    min={1}
                    className="w-full"
                    step="0.01"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.product_type !== currentValues.product_type ||
              prevValues.renewable !== currentValues.renewable
            }
            noStyle
          >
            {({ getFieldValue }) =>
              getFieldValue("product_type") === "simple" &&
              getFieldValue("renewable") ? (
                <Form.Item
                  label="Renewable Price (৳)"
                  name="renewable_price"
                  rules={[
                    {
                      required: !editMode,
                      message: "Please input the renewable price!",
                    },
                  ]}
                >
                  <InputNumber
                    placeholder="Enter Renewable Price"
                    type="number"
                    className="w-full"
                    step="0.01"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {/* <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.product_type !== currentValues.product_type ||
              prevValues.renewable !== currentValues.renewable
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("product_type") === "simple" &&
              !getFieldValue("renewable") && (
                <Form.Item
                  label="Lifetime Product"
                  name="lifetime_product"
                  rules={[
                    {
                      required: true,
                      message: "Please input the renewable price!",
                    },
                  ]}
                >
                  <Checkbox>Lifetime Product</Checkbox>
                </Form.Item>
              )
            }
          </Form.Item> */}

          {/* Variants for Variable Products */}
          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.product_type !== currentValues.product_type
            }
            noStyle
          >
            {({ getFieldValue }) =>
              getFieldValue("product_type") === "variable" ? (
                <Form.List name="variants">
                  {(fields, { add, remove }) => (
                    <>
                      <Space
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                        align="start"
                      >
                        <h3>Variants</h3>
                        <Button type="dashed" onClick={() => add()} block>
                          Add Variant
                        </Button>
                      </Space>
                      {fields.map(({ key, name, ...restField }) => (
                        <div
                          key={key}
                          style={{
                            border: "1px solid #d9d9d9",
                            padding: 16,
                            marginBottom: 16,
                            borderRadius: 4,
                          }}
                        >
                          <Space
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                            align="start"
                          >
                            <h4>Variant {key + 1}</h4>
                            <Button
                              type="link"
                              danger
                              onClick={() => remove(name)}
                            >
                              Remove
                            </Button>
                          </Space>

                          <Form.Item
                            {...restField}
                            label="Price (৳)"
                            name={[name, "price"]}
                            rules={[
                              {
                                required: !editMode,
                                message: "Please input the variant price!",
                              },
                            ]}
                          >
                            <InputNumber
                              type="number"
                              min={0}
                              step="0.01"
                              className="w-full"
                            />
                          </Form.Item>

                          {/* <Form.Item
                            label="Lifetime Product"
                            name={[name, "lifetime_product"]}
                            rules={[
                              {
                                required: true,
                                message: "Please input the renewable price!",
                              },
                            ]}
                          >
                            <Checkbox>Lifetime Product</Checkbox>
                          </Form.Item> */}

                          <Form.Item
                            label="Variant Name"
                            name={[name, "name"]}
                            rules={[
                              {
                                required: !editMode,
                                message: "Please input the variant name!",
                              },
                            ]}
                          >
                            <Input />
                          </Form.Item>

                          <Form.Item
                            shouldUpdate={(prevValues, currentValues) =>
                              prevValues.product_type !==
                                currentValues.product_type ||
                              prevValues.variants?.[name]?.lifetime_product !==
                                currentValues.variants?.[name]
                                  ?.lifetime_product ||
                              prevValues.variants?.[name]?.renewable !==
                                currentValues.variants?.[name]?.renewable
                            }
                            noStyle
                          >
                            {({ getFieldValue }) =>
                              getFieldValue("product_type") === "variable" && (
                                <>
                                  {/* Show Lifetime Product if Renewable is not checked */}
                                  {!getFieldValue([
                                    "variants",
                                    name,
                                    "renewable",
                                  ]) && (
                                    <Form.Item
                                      label="Lifetime Product"
                                      name={[name, "lifetime_product"]}
                                      valuePropName="checked"
                                    >
                                      <Checkbox>Lifetime Product</Checkbox>
                                    </Form.Item>
                                  )}

                                  {/* Show Renewable if Lifetime Product is not checked */}
                                  {!getFieldValue([
                                    "variants",
                                    name,
                                    "lifetime_product",
                                  ]) && (
                                    <Form.Item
                                      label="Renewable"
                                      name={[name, "renewable"]}
                                      valuePropName="checked"
                                    >
                                      <Checkbox>Renewable</Checkbox>
                                    </Form.Item>
                                  )}
                                </>
                              )
                            }
                          </Form.Item>

                          <Form.Item
                            shouldUpdate={(prevValues, currentValues) =>
                              prevValues.variants?.[name]?.renewable !==
                              currentValues.variants?.[name]?.renewable
                            }
                            noStyle
                          >
                            {() =>
                              form.getFieldValue([
                                "variants",
                                name,
                                "renewable",
                              ]) ? (
                                <Form.Item
                                  label="Renewable Price (৳)"
                                  name={[name, "renewable_price"]}
                                  rules={[
                                    {
                                      required: !editMode,
                                      message:
                                        "Please input the renewable price!",
                                    },
                                  ]}
                                >
                                  <InputNumber
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    className="w-full"
                                  />
                                </Form.Item>
                              ) : null
                            }
                          </Form.Item>
                        </div>
                      ))}
                    </>
                  )}
                </Form.List>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editMode ? "Update Product" : "Create Product"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={currentProduct?.title}
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={null}
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Title">
            {currentProduct?.title}
          </Descriptions.Item>

          <Descriptions.Item label="Image">
            <img
              src={currentProduct?.image}
              className="w-20 h-20 object-cover rounded-2xl"
              alt={currentProduct?.title}
              style={{ borderRadius: 4 }}
            />
          </Descriptions.Item>

          <Descriptions.Item label="Short Description">
            {currentProduct?.short_description}
          </Descriptions.Item>

          <Descriptions.Item label="Category">
            <Tag color="blue">{currentProduct?.category}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Product Type">
            {currentProduct?.product_type?.charAt(0)?.toUpperCase() +
              currentProduct?.product_type?.slice(1)}
          </Descriptions.Item>

          <Descriptions.Item label="Delivery Type">
            {currentProduct?.delivery_type?.charAt(0)?.toUpperCase() +
              currentProduct?.delivery_type?.slice(1)}
          </Descriptions.Item>

          {/* Conditionally render fields based on product type */}
          {currentProduct?.product_type === "simple" ? (
            <>
              <Descriptions.Item label="Price">
                ৳{currentProduct?.price?.toFixed(2)}
              </Descriptions.Item>

              <Descriptions.Item label="Renewable">
                {currentProduct?.renewable ? (
                  <Tag color="green">Yes</Tag>
                ) : (
                  <Tag color="red">No</Tag>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Is Renewed">
                {currentProduct?.isRenewed ? (
                  <Tag color="green">Yes</Tag>
                ) : (
                  <Tag color="red">No</Tag>
                )}
              </Descriptions.Item>
            </>
          ) : (
            <Descriptions.Item label="Variants">
              <List
                itemLayout="vertical"
                dataSource={currentProduct?.variants}
                renderItem={(variant, index) => (
                  <List.Item key={variant._id}>
                    <Typography.Text strong>
                      Variant {index + 1}
                    </Typography.Text>
                    <Descriptions size="small" bordered column={1}>
                      <Descriptions.Item label="Name">
                        {variant?.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Price">
                        ৳{variant?.price?.toFixed(2)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Renewable">
                        {variant?.renewable ? (
                          <Tag color="green">Yes</Tag>
                        ) : (
                          <Tag color="red">No</Tag>
                        )}
                      </Descriptions.Item>
                    </Descriptions>
                  </List.Item>
                )}
              />
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Created At">
            {new Date(currentProduct?.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};

export default Products;
