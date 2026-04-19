import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

// @desc    Get user's private cart
// @route   GET /api/cart
// @access  Private
export const getMyCart = async (req, res) => {
  try {
    // 1. Ask MongoDB to find the cart linked to the logged-in user ID
    // We .populate() the product so the frontend gets the Image and Name, not just an ID!
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name image price' 
    });

    // 2. If the user doesn't have a cart in the database yet, physically build them a blank one!
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

// @desc    Add An Item to the Cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  // We expect the frontend to send us the Product ID, the Variant (like "Small/Red"), and Quantity
  const { productId, variantId, quantity } = req.body;

  try {
    // 1. Grab their cart, or build a new one if it's their first time clicking "Add to Cart"
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // 2. Fetch the Master Product from the DB to securely check its official price.
    // (Never trust the price sent from the frontend, hackers can spoof it to $0.00!)
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let activePrice = product.price;

    // 3. Array Logic: Check if they already have this EXACT item + variant in their cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.variantId === variantId
    );

    if (existingItemIndex >= 0) {
      // It exists! Just upgrade the quantity!
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // It's a brand new cart addition! Push it into the items array.
      cart.items.push({
        product: productId,
        variantId,
        quantity,
        price: activePrice, 
      });
    }

    // 4. Cart Math: Loop through all items and mathematically calculate the subtotal
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Save to Database
    await cart.save();
    res.json(cart);
    
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

// @desc    Remove an item from the Cart
// @route   POST /api/cart/remove
// @access  Private
export const removeFromCart = async (req, res) => {
  const { productId, variantId } = req.body;
  
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // 1. Array Logic: Keep everything EXCEPT the exact item they clicked "Delete" on
    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === productId && item.variantId === variantId)
    );

    // 2. Cart Math: Recalculate the subtotal since an item was removed!
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    await cart.save();
    res.json(cart);
    
  } catch (error) {
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
};
