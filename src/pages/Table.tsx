import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";

const EnhancedProductTable = ({ products }) => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const theme = useTheme();

  const toggleRowExpansion = (productId: string) => {
    setExpandedRows((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleDeleteProduct = (id: string) => {
    console.log("Delete product with id:", id);
  };

  const handleViewProduct = (product: Product) => {
    console.log("View product:", product);
  };

  const handleEditProduct = (product: Product) => {
    console.log("Edit product:", product);
  };

  const columns = [
    { title: "Image", key: "image" },
    { title: "Title", key: "title" },
    { title: "Short Description", key: "short_description" },
    { title: "Category", key: "category" },
    { title: "Delivery Type", key: "delivery_type" },
    { title: "Renewable", key: "renewable" },
    { title: "Product Type", key: "product_type" },
    { title: "Actions", key: "actions" },
  ];

  return (
    <TableContainer component={Paper} elevation={3}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.grey[200] }}>
            {columns.map((col) => (
              <TableCell key={col.key} align="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  {col.title}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <Box component="tbody" key={product._id}>
              <TableRow>
                <TableCell align="center">
                  <Box
                    component="img"
                    src={product.image}
                    alt="Product"
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 1,
                      objectFit: "cover",
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography noWrap>{product.title}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography
                    noWrap
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 200 }}
                  >
                    {product.short_description}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={product?.category?.category ?? "N/A"}
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {product.delivery_type.charAt(0).toUpperCase() +
                      product.delivery_type.slice(1)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={
                      product.product_type === "simple"
                        ? product.renewable
                          ? "Yes"
                          : "No"
                        : product.variants?.[0]?.renewable
                        ? "Yes"
                        : "No"
                    }
                    color={
                      product.product_type === "simple" && product.renewable
                        ? "success"
                        : "default"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {product.product_type.charAt(0).toUpperCase() +
                      product.product_type.slice(1)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={1}>
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => handleEditProduct(product)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View">
                      <IconButton
                        onClick={() => handleViewProduct(product)}
                        color="info"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDeleteProduct(product._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    {product.product_type === "variable" && (
                      <Tooltip title="Expand">
                        <IconButton
                          onClick={() => toggleRowExpansion(product._id)}
                        >
                          {expandedRows.includes(product._id) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
              {expandedRows.includes(product._id) && product.variants && (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <Collapse in={expandedRows.includes(product._id)}>
                      <Box sx={{ margin: 2 }}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{ color: theme.palette.primary.main }}
                        >
                          Variants
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Price (৳)</TableCell>
                              <TableCell>Renewable</TableCell>
                              <TableCell>Renewable Price</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {product.variants.map((variant) => (
                              <TableRow key={variant._id}>
                                <TableCell>{variant.name}</TableCell>
                                <TableCell>
                                  ৳{variant.price.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={variant.renewable ? "Yes" : "No"}
                                    color={
                                      variant.renewable ? "success" : "default"
                                    }
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  ৳{variant.renewable_price?.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </Box>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EnhancedProductTable;
