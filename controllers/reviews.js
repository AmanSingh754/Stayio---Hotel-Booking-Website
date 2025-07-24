const Listing = require("../models/listing");
const Review = require("../models/review");

// ✅ CREATE REVIEW
module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  const newReview = new Review(req.body.review);
  newReview.author = req.user._id;

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  req.flash("success", "New review created!");
  res.redirect(`/listings/${listing._id}`);
};

// ✅ DELETE REVIEW
module.exports.destroyReview = async (req, res) => {
  const { id, reviewID } = req.params; // ✅ Must match route param exactly!

  // Remove review ID from listing
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewID } });

  // Delete actual review document
  await Review.findByIdAndDelete(reviewID);

  req.flash("success", "Successfully deleted the review!");
  res.redirect(`/listings/${id}`);
};
