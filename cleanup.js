const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Review = require("./models/review");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

mongoose.connect(MONGO_URL)
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB connection error:", err));

async function cleanupOrphanReviews() {
  const listings = await Listing.find({}, "_id reviews");
  const validReviewIds = listings.flatMap(listing => listing.reviews.map(r => r.toString()));
  const allReviews = await Review.find({});
  const orphanReviews = allReviews.filter(review => !validReviewIds.includes(review._id.toString()));

  if (orphanReviews.length > 0) {
    const idsToDelete = orphanReviews.map(r => r._id);
    await Review.deleteMany({ _id: { $in: idsToDelete } });
    console.log(`✅ Deleted ${idsToDelete.length} orphaned reviews.`);
  } else {
    console.log("🎉 No orphaned reviews found.");
  }

  mongoose.connection.close();
}

cleanupOrphanReviews();

