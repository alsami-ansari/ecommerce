import mongoose from 'mongoose';
import dotenv from 'dotenv';
import products from './data/products.js';
import Product from './models/productModel.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const importData = async () => {
  try {
    // 1. Clear out existing data to avoid duplicates
    await Product.deleteMany();

    // 2. Insert out dummy products array
    await Product.insertMany(products);

    console.log('Data Imported! 🟢');
    process.exit();
  } catch (error) {
    console.error(`Error with seeding: ${error.message} 🔴`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Product.deleteMany();
    console.log('Data Destroyed! 🔴');
    process.exit();
  } catch (error) {
    console.error(`Error deleting data: ${error.message} 🔴`);
    process.exit(1);
  }
};

// If we run `node seeder.js -d` in terminal, delete data. Otherwise insert it.
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
