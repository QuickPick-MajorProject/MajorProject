import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
import Product from "./models/Product.js";

// ============================================================
//  BULK PRODUCT UPLOAD SCRIPT
//  --------------------------
//  1. Fill in the `products` array below with up to 10 (or more) products.
//  2. For the image field, provide the direct URL of the image.
//     Cloudinary will fetch & host it automatically.
//  3. Run:  node bulkAddProducts.js
// ============================================================

// ──────────────────────────────────────────────
//  👇  PASTE / EDIT YOUR PRODUCTS HERE  👇
// ──────────────────────────────────────────────
const products = [
    {
        category: "Frozen",
        name: "Frozen Pizza",
        price: 220,
        offerPrice: 199,
        description: ["Ready bake frozen pizza."],
        image: ["https://cdn.zeptonow.com/production/tr:w-312,ar-1500-1500,pr-true,f-auto,,q-40/cms/product_variant/dbc2f868-a23a-4609-a01d-e88045f22dd4.jpeg"],
    },
    {
        category: "Frozen",
        name: "Frozen Paratha",
        price: 120,
        offerPrice: 105,
        description: ["Ready cook layered paratha."],
        image: ["https://cdn.zeptonow.com/production/ik-seo/tr:w-312,ar-5757-6000,pr-true,f-auto,,q-40/cms/product_variant/9d38f115-4323-4c1e-8b76-a21ad521eea3/Aashirvaad-Malabar-Paratha-Heat-Eat.jpeg"],
    },
    {
        category: "Frozen",
        name: "Frozen Spring Rolls",
        price: 180,
        offerPrice: 160,
        description: ["Crispy vegetable spring rolls."],
        image: ["https://cdn.zeptonow.com/production/tr:w-312,ar-1000-1000,pr-true,f-auto,,q-40/cms/product_variant/7572b45f-fde7-49d5-9ba2-8bbcf51d3a64.jpeg"],
    },
    {
        category: "Frozen",
        name: "Frozen Corn",
        price: 130,
        offerPrice: 115,
        description: ["Sweet frozen corn kernels."],
        image: ["https://cdn.zeptonow.com/production/tr:w-312,ar-1000-1000,pr-true,f-auto,q-40/cms/product_variant/2ee34d82-3bb9-4e85-b4d6-e27a121c5bf5.jpeg"],
    },
];

// ──────────────────────────────────────────────
//  ⛔  DO NOT EDIT BELOW THIS LINE  ⛔
// ──────────────────────────────────────────────

async function uploadImageToCloudinary(url) {
    try {
        const result = await cloudinary.uploader.upload(url, {
            resource_type: "image",
        });
        return result.secure_url;
    } catch (err) {
        console.error(`  ✖ Cloudinary upload failed for: ${url}`);
        console.error(`    ${err.message}`);
        return null;
    }
}

async function main() {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("✅ Cloudinary configured\n");

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        console.log(`[${i + 1}/${products.length}] Adding: ${p.name} ...`);

        // Upload each image URL to Cloudinary
        const cloudinaryUrls = [];
        for (const imgUrl of p.image) {
            const hosted = await uploadImageToCloudinary(imgUrl);
            if (hosted) {
                cloudinaryUrls.push(hosted);
            }
        }

        if (cloudinaryUrls.length === 0) {
            console.log(`  ✖ Skipped "${p.name}" — no images uploaded successfully.\n`);
            failCount++;
            continue;
        }

        try {
            await Product.create({
                name: p.name,
                description: p.description,
                price: p.price,
                offerPrice: p.offerPrice,
                image: cloudinaryUrls,
                category: p.category,
                inStock: true,
            });
            console.log(`  ✔ "${p.name}" added successfully.\n`);
            successCount++;
        } catch (err) {
            console.log(`  ✖ Failed to save "${p.name}": ${err.message}\n`);
            failCount++;
        }
    }

    console.log("════════════════════════════════════════");
    console.log(`  Done!  ✔ ${successCount} added  |  ✖ ${failCount} failed`);
    console.log("════════════════════════════════════════");

    await mongoose.connection.close();
    process.exit(0);
}

main();
