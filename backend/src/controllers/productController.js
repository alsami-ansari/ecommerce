import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';


// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
// @desc    Fetch all products with Search & Filters
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    // 1. Check for a search keyword (e.g. ?keyword=phone).
    // We use $regex so that searching "phone" matches "iPhone 14 Pro"
      // 1. Enterprise Fix: ALWAYS require isDeleted to be false for public searches
  const keyword = req.query.keyword
    ? {
        name: { $regex: req.query.keyword, $options: 'i' },
        isDeleted: false 
      }
    : { isDeleted: false };

  const filter = {};
  if (req.query.category) {
    filter.category = req.query.category;
  }



  // Add these two lines back in!
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  const count = await Product.countDocuments({ ...keyword, ...filter });

  const products = await Product.find({ ...keyword, ...filter })
    .populate('category', 'name slug') 
    .limit(pageSize)
    .skip(pageSize * (page - 1));

    res.json({ 
        products, 
        page, 
        pages: Math.ceil(count / pageSize) // Change 'limit' to 'pageSize' here!
    });


  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};


// @desc    Fetch a single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    // 3. Populate category data here too!
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug parentCategory');

    // 4. Force a 404 Error if the product exists but is flagged as deleted!
    if (product && !product.isDeleted) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found or has been removed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching product', error: error.message });
  }
};


// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private (Must be logged in)
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      // Rule 1: Check if this specific user already left a review
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'You already reviewed this product' });
      }

      // Rule 2: Build the new review object
      const review = {
        name: req.user.name, // Grab name from the token
        rating: Number(rating),
        comment,
        user: req.user._id,  // Grab ID from the token
      };
     
            // ==========================================
      // Rule 1.5: THE ENTERPRISE TRUST GATEWAY
      // We physically verify their database history to prove they bought this exact item!
      // ==========================================
      const hasBought = await Order.findOne({
        user: req.user._id,
        'orderItems.product': product._id,
        isPaid: true
      });

      // The Bounce: Fake Reviewers get rejected here!
      if (!hasBought) {
        return res.status(400).json({ 
          message: 'Trust Gateway Rejected: You must purchase and pay for this product before leaving a review.' 
        });
      }

      // Add the review to the product's array
      product.reviews.push(review);

      // Rule 3: Auto-calculate the number of reviews and the new average rating
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      // Save the updated product back to the database
      await product.save();
      res.status(201).json({ message: 'Review added successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error saving review', error: error.message });
  }
};

