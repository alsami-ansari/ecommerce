import Product from '../models/productModel.js';

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
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i', // 'i' makes it case-insensitive (Phone = phone)
          },
        }
      : {};

    // 2. Check for a specific category (e.g. ?category=Electronics)
    const category = req.query.category ? { category: req.query.category } : {};

    // 3. Check for price filters (e.g. ?price[lte]=500)
    // We convert the incoming query like 'lte' into MongoDB's format '$lte'
    let filterQuery = JSON.stringify(req.query);
    filterQuery = filterQuery.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let priceFilters = JSON.parse(filterQuery);

    // Clean out the keyword and category from priceFilters so they don't clash
    delete priceFilters.keyword;
    delete priceFilters.category;

    delete priceFilters.page;
    delete priceFilters.limit;


    // 4. Combine all the rules into one massive database search query!
    const query = { ...keyword, ...category, ...priceFilters };

      // 5. Pagination System
    const page = Number(req.query.page) || 1; // What page are they on? Default to 1
    const limit = Number(req.query.limit) || 10; // Number of products per page
    const skipAmount = (page - 1) * limit;

    // Count how many total products match the query
    const count = await Product.countDocuments(query);
    
    // Fetch the products, skipping the ones from previous pages!
    const products = await Product.find(query).limit(limit).skip(skipAmount);

    // Send the products AND the pagination math data back to the frontend
    res.json({ 
      products, 
      page, 
      pages: Math.ceil(count / limit) // Calculate total pages (e.g. 23 items / 10 = 3 pages)
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
    // req.params.id gets the ID from the URL (e.g. /api/products/12345)
    const product = await Product.findById(req.params.id);
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
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

