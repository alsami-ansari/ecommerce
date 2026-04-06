import Order from '../models/orderModel.js';

// @desc    Create a new order from a shopping cart
// @route   POST /api/orders
// @access  Private (You must be logged in)
export const addOrderItems = async (req, res) => {
  try {
    const { 
      orderItems, 
      shippingAddress, 
      paymentMethod, 
      itemsPrice, 
      taxPrice, 
      shippingPrice, 
      totalPrice 
    } = req.body;

    // Check if the cart is empty
    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    } else {
      // Create a new order object mapped to the logged-in user
      const order = new Order({
        orderItems,
        user: req.user._id, // This comes from our 'protect' middleware!
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      // Save it to MongoDB
      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error trying to create order', error: error.message });
  }
};

// @desc    Get an order by its ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    // We use .populate() to also fetch the buying User's name and email!
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching order', error: error.message });
  }
};

// @desc    Get logged in user's past orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    // Find all orders where the user ID matches the currently logged-in user
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error getting your orders' });
  }
};

// @desc    Update order to paid once Payment Gateway confirms success
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      
      // These details will be sent from Razorpay/Stripe from the frontend
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating payment status' });
  }
};

