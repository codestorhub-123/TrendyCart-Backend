const express = require('express');
const route = express.Router();
const userRoute = require('./user.route.js');

const addressRoute = require('./address.route.js');
const auctionBidRoute = require('./auctionBid.route.js');
const bankRoute = require('./bank.route.js');
const cartRoute = require('./cart.route.js');
const categoryRoute = require('./category.route.js');
const currencyRoute = require('./currency.route.js');

const faqRoute = require('./faq.route.js');
const favoriteRoute = require('./favorite.route.js');
const followerRoute = require('./follower.route.js');
const liveSellerRoute = require('./liveSeller.route.js');
const notificationRoute = require('./notification.route.js');

const orderRoute = require('./order.route.js');
const otpRoute = require('./otp.route.js');
const productRoute = require('./product.route.js');
const productRequestRoute = require('./productRequest.route.js');
const promoCodeCheckRoute = require('./promoCodeCheck.route.js');
const promoCodeRoute = require('./promocode.route.js');
const ratingRoute = require('./rating.route.js');
const reelRoute = require('./reel.route.js');
const reportReasonRoute = require('./reportReason.route.js');
const reportReelRoute = require('./reportReel.route.js');
const reviewRoute = require('./review.route.js');
const settingRoute = require('./setting.route.js');
const sellerRoute = require('./seller.route.js');
const sellerRequestRoute = require('./sellerRequest.route.js');
const sellerWalletRoute = require('./sellerWallet.route.js');
const subCategoryRoute = require('./subCategory.route.js');
const withdrawRequestRoute = require('./withdrawRequest.route.js');
const withdrawRoute = require('./withdraw.route.js');


route.use('/', userRoute);
route.use('/request', sellerRequestRoute);
route.use('/address', addressRoute);
route.use('/auctionBid', auctionBidRoute);
route.use('/bank', bankRoute);
route.use('/cart', cartRoute);
route.use('/category', categoryRoute);
route.use('/currency', currencyRoute);

route.use('/FAQ', faqRoute);
route.use('/favorite', favoriteRoute);
route.use('/follower', followerRoute);
route.use('/liveSeller', liveSellerRoute);
route.use('/notification', notificationRoute);

route.use('/order', orderRoute);
route.use('/otp', otpRoute);
route.use('/product', productRoute);
route.use('/productRequest', productRequestRoute);
route.use('/promoCodeCheck', promoCodeCheckRoute);
route.use('/promoCode', promoCodeRoute);
route.use('/rating', ratingRoute);
route.use('/reel', reelRoute);
route.use('/reportReason', reportReasonRoute);
route.use('/reportoReel', reportReelRoute);
route.use('/review', reviewRoute);
route.use('/seller', sellerRoute);
route.use('/sellerWallet', sellerWalletRoute);
route.use('/setting', settingRoute);
route.use('/subCategory', subCategoryRoute);
route.use('/withdrawRequest', withdrawRequestRoute);
route.use('/withdraw', withdrawRoute);
module.exports = route;
