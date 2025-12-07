// src/routes/userRoute.js
import express from 'express';
import userAdminController from '../controllers/userAdminController.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { adminAuth } from '../middleware/adminAuth.js';

const userAdminRoute = express.Router();

// Register user baru (hanya admin)
userAdminRoute.post('/register', adminAuth, isAdmin, userAdminController.register);

// Login user
userAdminRoute.post('/login', userAdminController.login);

// Ambil semua user
userAdminRoute.get('/', userAdminController.getAllUsers);

// Hapus user (hanya admin)
userAdminRoute.delete('/:id', adminAuth ,userAdminController.userDelete);

// Delete Customer
userAdminRoute.delete('/customer/:id',adminAuth, userAdminController.deleteCustomer);

userAdminRoute.get('/customer', userAdminController.getAllCustomer);


export default userAdminRoute;