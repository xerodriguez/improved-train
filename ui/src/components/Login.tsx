import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Container,
    Paper,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Person,
    Lock,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { LoginFormData, ValidationErrors } from '../types';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

    const [formData, setFormData] = useState<LoginFormData>({
        username: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/products');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (error) {
            clearError();
        }
    }, [formData, clearError]);

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};

        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 3) {
            errors.password = 'Password must be at least 3 characters';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof LoginFormData) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: undefined,
            }));
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await login(formData.username, formData.password);
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleKeyUp = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSubmit(event as any);
        }
    };

    if (isLoading) {
        return (
            <Container maxWidth="sm">
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                >
                    <CircularProgress size={40} />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                py={3}
            >
                <Paper elevation={8} sx={{ width: '100%', maxWidth: 400 }}>
                    <Card>
                        <CardContent sx={{ p: 4 }}>
                            <Box mb={3} textAlign="center">
                                <Typography variant="h4" component="h1" gutterBottom>
                                    Welcome Back
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Sign in to access Northwind Products
                                </Typography>
                            </Box>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleInputChange('username')}
                                    onKeyUp={handleKeyUp}
                                    error={!!validationErrors.username}
                                    helperText={validationErrors.username}
                                    margin="normal"
                                    required
                                    autoComplete="username"
                                    autoFocus
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    disabled={isSubmitting}
                                />

                                <TextField
                                    fullWidth
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleInputChange('password')}
                                    onKeyUp={handleKeyUp}
                                    error={!!validationErrors.password}
                                    helperText={validationErrors.password}
                                    margin="normal"
                                    required
                                    autoComplete="current-password"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={handleTogglePasswordVisibility}
                                                    edge="end"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    disabled={isSubmitting}
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={isSubmitting}
                                    sx={{ mt: 3, mb: 2, py: 1.5 }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            Signing In...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>
                            </Box>

                            <Box mt={2} textAlign="center">
                                <Typography variant="body2" color="text.secondary">
                                    Use your Keycloak credentials to sign in
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;