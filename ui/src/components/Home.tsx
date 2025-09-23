import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md" sx={{ textAlign: 'center', mt: 5 }}>
            <Typography variant="h3" gutterBottom>
                Welcome to the Northwind Application
            </Typography>
            <Typography variant="body1" gutterBottom>
                This application allows you to manage products and suppliers efficiently.
            </Typography>
            <Box sx={{ mt: 4 }}>
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mr: 2 }}
                    onClick={() => navigate('/products')}
                >
                    Go to Products
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate('/suppliers')}
                >
                    Go to Suppliers
                </Button>
            </Box>
        </Container>
    );
};

export default Home;