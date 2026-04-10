import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    // --> Add this new line:
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  {
    timestamps: true,
  }
);


const productSchema = mongoose.Schema(
  {
    // Later we will link this to the Admin user who created the product
    // user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    
    name: { type: String, required: true },
    image: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
  },
  {
    // This automatically creates 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
