import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Alert,
    CircularProgress,
    Paper,
    Button,
    Chip,
    Card,
    CardContent,
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridRowsProp,
    GridValueGetterParams,
    GridRenderCellParams,
} from '@mui/x-data-grid';
import {
    ShoppingCart,
    Warning,
    CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ProductsService } from '../services/productsService';
import { Product } from '../types';
import Layout from './Layout';

const Products: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            loadProducts();
        }
    }, [isAuthenticated]);

    // Load products function
    const loadProducts = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const productsData = await ProductsService.getProducts();
            const formattedProducts = ProductsService.formatProductsForDisplay(productsData);

            setProducts(formattedProducts);
            setLastUpdated(new Date());
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
            setError(errorMessage);

            // If authentication error, redirect to login
            if (errorMessage.includes('Authentication') || errorMessage.includes('login')) {
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleMenuClose();
        await logout();
        navigate('/login');
    };

    // Handle refresh
    const handleRefresh = () => {
        loadProducts();
    };

    // Define DataGrid columns
    const columns: GridColDef[] = [
        {
            field: 'product_id',
            headerName: 'ID',
            width: 80,
            type: 'number',
        },
        {
            field: 'product_name',
            headerName: 'Product Name',
            width: 250,
            flex: 1,
            minWidth: 200,
        },
        {
            field: 'supplier_id',
            headerName: 'Supplier ID',
            width: 120,
            type: 'number',
            valueGetter: (params: GridValueGetterParams) =>
                params.row.supplier_id || 'N/A',
        },
        {
            field: 'category_id',
            headerName: 'Category ID',
            width: 120,
            type: 'number',
            valueGetter: (params: GridValueGetterParams) =>
                params.row.category_id || 'N/A',
        },
        {
            field: 'quantity_per_unit',
            headerName: 'Quantity/Unit',
            width: 150,
            valueGetter: (params: GridValueGetterParams) =>
                params.row.quantity_per_unit || 'N/A',
        },
        {
            field: 'unit_price',
            headerName: 'Unit Price',
            width: 120,
            type: 'number',
            valueGetter: (params: GridValueGetterParams) =>
                params.row.unit_price ? `$${params.row.unit_price.toFixed(2)}` : 'N/A',
        },
        {
            field: 'units_in_stock',
            headerName: 'In Stock',
            width: 100,
            type: 'number',
            renderCell: (params: GridRenderCellParams) => {
                const value = params.row.units_in_stock;
                if (value === null || value === undefined) return 'N/A';

                return (
                    <Chip
                        label={value}
                        size="small"
                        color={value === 0 ? 'error' : value < 10 ? 'warning' : 'success'}
                        variant="outlined"
                    />
                );
            },
        },
        {
            field: 'units_on_order',
            headerName: 'On Order',
            width: 100,
            type: 'number',
            valueGetter: (params: GridValueGetterParams) =>
                params.row.units_on_order || 0,
        },
        {
            field: 'reorder_level',
            headerName: 'Reorder Level',
            width: 120,
            type: 'number',
            valueGetter: (params: GridValueGetterParams) =>
                params.row.reorder_level || 0,
        },
        {
            field: 'discontinued',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => {
                const isDiscontinued = params.row.discontinued === 1;
                return (
                    <Chip
                        icon={isDiscontinued ? <Warning /> : <CheckCircle />}
                        label={isDiscontinued ? 'Discontinued' : 'Active'}
                        size="small"
                        color={isDiscontinued ? 'error' : 'success'}
                        variant={isDiscontinued ? 'filled' : 'outlined'}
                    />
                );
            },
        },
    ];

    // Prepare rows for DataGrid
    const rows: GridRowsProp = products.map(product => ({
        id: product.product_id,
        ...product,
    }));

    if (!isAuthenticated) {
        return null; // Will redirect via useEffect
    }

    return (
        <Layout>
            <Box sx={{ flexGrow: 1 }}>
                <Container maxWidth={false} sx={{ mt: 3, mb: 3 }}>
                    {/* Stats Cards */}
                    <Box sx={{ mb: 3 }}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="h4" component="div">
                                            {products.length}
                                        </Typography>
                                        <Typography color="text.secondary">
                                            Total Products
                                        </Typography>
                                    </Box>
                                    <Box textAlign="right">
                                        {lastUpdated && (
                                            <Typography variant="body2" color="text.secondary">
                                                Last updated: {lastUpdated.toLocaleTimeString()}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" color="text.secondary">
                                            {products.filter(p => p.discontinued === 0).length} Active Products
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                            action={
                                <Button color="inherit" size="small" onClick={handleRefresh}>
                                    Retry
                                </Button>
                            }
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Products Table */}
                    <Paper sx={{ height: 600, width: '100%' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            loading={isLoading}
                            sx={{
                                '& .MuiDataGrid-cell': {
                                    borderBottom: '1px solid #f0f0f0',
                                },
                                '& .MuiDataGrid-columnHeader': {
                                    backgroundColor: '#fafafa',
                                    fontWeight: 600,
                                },
                            }}
                            initialState={{
                                sorting: {
                                    sortModel: [{ field: 'product_name', sort: 'asc' }],
                                },
                            }}
                            components={{
                                NoRowsOverlay: () => (
                                    <Box
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                        height="100%"
                                        flexDirection="column"
                                    >
                                        {isLoading ? (
                                            <>
                                                <CircularProgress />
                                                <Typography variant="body2" sx={{ mt: 2 }}>
                                                    Loading products...
                                                </Typography>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                                <Typography variant="h6" color="text.secondary">
                                                    No products found
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Try refreshing the page or check your connection
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                ),
                            }}
                        />
                    </Paper>
                </Container>
            </Box>
        </Layout>
    );
};

export default Products;