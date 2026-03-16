import mongoose from "mongoose";
import "dotenv/config";
import Product from "./models/Product.js";

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const products = await Product.find({}, "name category").sort({ category: 1, name: 1 });

    // Group by category
    const grouped = {};
    for (const p of products) {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p.name);
    }

    // Print
    for (const [category, names] of Object.entries(grouped)) {
        console.log(`📦 ${category} (${names.length})`);
        names.forEach((name, i) => console.log(`   ${i + 1}. ${name}`));
        console.log();
    }

    console.log(`Total: ${products.length} products`);
    await mongoose.connection.close();
    process.exit(0);
}

main();
