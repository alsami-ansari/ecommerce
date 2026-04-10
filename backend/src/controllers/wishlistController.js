import User from '../models/userModel.js';

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    // Fetch the user, but use .populate() to magically turn the ID array into actual Product data!
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    // --> NEW: Check if it's an older user without a wishlist array, and give them one!
    if (!user.wishlist) {
      user.wishlist = [];
    }

    // Check if it's already in the wishlist
    const alreadyAdded = user.wishlist.find((id) => id.toString() === productId.toString());

    if (alreadyAdded) {
      return res.status(400).json({ message: 'Product is already in your wishlist' });
    }

    user.wishlist.push(productId);
    await user.save();

    res.json({ message: 'Product added to wishlist' });
  } catch (error) {
    // I also added error.message here so if it crashes again, Postman will tell you exactly why!
    res.status(500).json({ message: 'Server error saving to wishlist', error: error.message });
  }
};


// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    // --> NEW: Fallback check
    if (!user.wishlist) {
      user.wishlist = [];
    }

    // Filter out the product ID we want to remove
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId.toString());
    await user.save();

    res.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Server error removing from wishlist', error: error.message });
  }
};
