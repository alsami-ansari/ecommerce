import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';

// @desc    Get main dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    // Ask MongoDB for the total counts
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Find all paid orders and add up their total prices to get Revenue
    const paidOrders = await Order.find({ isPaid: true });
    const totalRevenue = paidOrders.reduce((acc, order) => acc + order.totalPrice, 0);

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue: totalRevenue.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching admin stats' });
  }
};

// @desc    Get recent sales for a revenue chart
// @route   GET /api/admin/sales
// @access  Private/Admin
export const getSalesData = async (req, res) => {
  try {
    // Fetch the 10 most recent paid orders and only grab their Date and Price
    const recentOrders = await Order.find({ isPaid: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('totalPrice createdAt');

    res.json(recentOrders);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching sales data' });
  }
};

// @desc    Get top rated products
// @route   GET /api/admin/top-products
// @access  Private/Admin
export const getTopProducts = async (req, res) => {
  try {
    // Sort products by rating (highest first), and grab the top 5
    const products = await Product.find({}).sort({ rating: -1 }).limit(5);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching top products' });
  }
};
