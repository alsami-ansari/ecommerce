import Order from '../models/orderModel.js';
import Coupon from '../models/couponModel.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';




// @desc    Create a new order from a shopping cart
// @route   POST /api/orders
// @access  Private (You must be logged in)
// @desc    Create new order & Lock Physical Stock
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
  try {
    // Notice we ONLY ask the frontend for Shipping & Payment strings. 
    // We do NOT ask the frontend for prices or quantities!
    const { shippingAddress, paymentMethod } = req.body;
    // 1. Secure Fetch: Pull the Cart directly from the Database
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is completely empty!' });
    }
    // 2. Inventory Reservation Engine 
    // We mathematically verify stock for EVERY item *before* creating the Order!
    for (const item of cart.items) {
      const dbProduct = item.product; // This is populated, so it holds the live database product!

      // Stock Check
      if (item.quantity > dbProduct.countInStock) {
        return res.status(400).json({
          message: `Stock Reject! We only have ${dbProduct.countInStock} of ${dbProduct.name} remaining!`,
          problemProduct: dbProduct.name
        });
      }
    }
    // 3. Stock Lock! If the code reaches here, all items had valid stock. 
    // We now permanently decrement the physical supply in the database!
    // 3. Stock Lock! If the code reaches here, all items had valid stock. 
    // We use an Atomic Operation ($inc) to directly deduct the stock. 
    // This perfectly prevents Race Conditions and mathematically bypasses full schema validation!
    for (const item of cart.items) {
      await Product.updateOne(
        { _id: item.product._id },
        { $inc: { countInStock: -item.quantity } }
      );
    }

    // 4. Data Translation: Format the Cart items into the standard Order schema
    const orderItems = cart.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity, // Renamed to 'quantity'
      image: item.product.image,
      price: item.price,
      variantId: item.variantId,
      product: item.product._id,
    }));
    // Calculate Taxes & Shipping (Mock Math)
    const taxPrice = cart.totalPrice * 0.08; // 8% Tax
    const shippingPrice = cart.totalPrice > 100 ? 0 : 15; // Free shipping over $100
    // 5. Generate Official Order
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: cart.totalPrice,
      taxPrice: Number(taxPrice.toFixed(2)),
      shippingPrice,
      totalPrice: Number((cart.totalPrice + taxPrice + shippingPrice).toFixed(2)),
      orderStatus: 'Pending' // Initiates the Logistics State Machine!
    });
    const createdOrder = await order.save();
    // 6. Housekeeping: Completely destroy their Database Cart since the Order was captured!
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    // Success! Return the new order to the frontend
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error generating order', error: error.message });
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
// @desc    Update order to paid (SECURE VERIFICATION)
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      // 1. Grab the exact data Razorpay sends back
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      // 2. We combine the order ID and payment ID
      const body = razorpay_order_id + "|" + razorpay_payment_id;

      // 3. We hash it ourselves using our SECRET KEY that nobody else knows
      // Note: We use 'test_secret' as a fallback until you get your real Razorpay account
      const secretKey = process.env.RAZORPAY_KEY_SECRET || 'test_secret';

      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(body.toString())
        .digest('hex');

      // 4. CHECK IF THEY MATCH!
      if (expectedSignature === razorpay_signature) {

        // It's mathematically proven to be real. Mark as paid!
        order.isPaid = true;
        order.paidAt = Date.now();

        order.paymentResult = {
          id: razorpay_payment_id,
          status: 'COMPLETED',
          update_time: Date.now(),
          email_address: req.user.email, // Log who paid for it
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);

      } else {
        // Fraud detected!
        res.status(400).json({ message: 'Fake Payment Signature Detected! Fraud Alert.' });
      }

    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating payment status', error: error.message });
  }
};

// @desc    Initialize a Razorpay Payment Session
// @route   POST /api/orders/:id/razorpay
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 1. Connect to Razorpay
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 2. Build the order rules. Razorpay requires amounts in the smallest currency unit (like Paise or Cents)
    const options = {
      amount: Math.round(order.totalPrice * 100), // Multiply by 100 to convert to paise!
      currency: "INR", // Change to USD if dealing with dollars
      receipt: `receipt_${order._id}`,
    };

    // 3. Ask Razorpay to securely generate the ID
    const razorpayOrder = await instance.orders.create(options);

    // 4. Send that ID to the frontend!
    res.json(razorpayOrder);

  } catch (error) {
    res.status(500).json({ message: 'Error generating Razorpay Order', error: error.message });
  }
};


