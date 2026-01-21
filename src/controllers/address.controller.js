const { default: mongoose } = require("mongoose");
const Address = require("../models/address.model");
const User = require("../models/user.model");
const { get_message } = require("../../utils/message");

exports.store = async (req, res) => {
  try {
    if (!req.body.userId) {
      return res.status(400).json({ status: false, message: get_message(1018) });
    }

    const user = await User.findOne({ _id: req.body.userId });
    if (!user) {
      return res.status(404).json({ status: false, message: get_message(1019) });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: get_message(1017) });
    }

    if (!req.body.name) {
      return res.status(400).json({ status: false, message: get_message(1020) });
    }

    const address = new Address();

    address.userId = user._id;
    address.name = req.body.name;
    address.country = req.body.country || address.country;
    address.state = req.body.state || address.state;
    address.city = req.body.city || address.city;
    address.zipCode = parseInt(req.body.zipCode) || address.zipCode;
    address.address = req.body.address.trim() || address.address;
    await address.save();

    return res.status(200).json({
      status: true,
      message: get_message(1021),
      address,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};


exports.update = async (req, res) => {
  try {
    if (!req.query.addressId) {
      return res.status(400).json({ status: false, message: get_message(1022) });
    }

    if (!req.body.userId) {
      return res.status(400).json({ status: false, message: get_message(1018) });
    }

    const [user, address] = await Promise.all([
      User.findOne({ _id: req.body.userId }),
      Address.findOne({ _id: req.query.addressId, userId: req.body.userId }).populate("userId", "firstName lastName"),
    ]);

    if (!user) {
      return res.status(404).json({ status: false, message: get_message(1019) });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: get_message(1017) });
    }

    if (!address)
      return res.status(404).json({
        status: false,
        message: get_message(1023),
      });

    address.userId = req.body.userId ? user._id : address.userId;
    address.name = req.body.name ? req.body.name : address.name;
    address.country = req.body.country ? req.body.country : address.country;
    address.state = req.body.state ? req.body.state : address.state;
    address.city = req.body.city ? req.body.city : address.city;
    address.zipCode = req.body.zipCode ? parseInt(req.body.zipCode) : address.zipCode;
    address.address = req.body.address.trim() ? req.body.address.trim() : address.address;

    await address.save();

    return res.status(200).json({
      status: true,
      message: get_message(1024),
      address,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

exports.getAllAddress = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(400).json({ status: false, message: get_message(1018) });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, address] = await Promise.all([User.findOne({ _id: userId }), Address.find({ userId: userId }).populate("userId", "firstName lastName").sort({ createdAt: -1 })]);

    if (!user) {
      return res.status(404).json({ status: false, message: get_message(1019) });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: get_message(1017) });
    }

    return res.status(200).json({
      status: address.length > 0 ? true : false,
      message: get_message(1025),
      address: address.length > 0 ? address : [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//the address is selected true
exports.selectedOrNot = async (req, res) => {
  try {
    if (!req.query.addressId || !req.query.userId) {
      return res.status(400).json({ status: false, massage: get_message(1026) });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const addressId = new mongoose.Types.ObjectId(req.query.addressId);

    await Address.updateMany({ userId: userId }, { $set: { isSelect: false } }, { new: true });

    const [user, address] = await Promise.all([User.findOne({ _id: userId }), Address.findByIdAndUpdate(addressId, { isSelect: true }, { new: true }).populate("userId", "firstName lastName")]);

    if (!user) {
      return res.status(404).json({ status: false, message: get_message(1019) });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: get_message(1017) });
    }

    if (!address) {
      return res.status(404).json({ status: false, message: get_message(1023) });
    }

    return res.status(200).json({
      status: true,
      message: "Success",
      address,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all isSelect address for users
exports.getSelectedAddress = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(400).json({ status: false, message: get_message(1018) });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, address] = await Promise.all([User.findOne({ _id: userId }), Address.findOne({ userId: userId, isSelect: true }).populate("userId", "firstName lastName").sort({ createdAt: -1 })]);

    if (!user) {
      return res.status(404).json({ status: false, message: get_message(1019) });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: get_message(1017) });
    }

    if (!address) {
      return res.status(404).json({ status: false, message: get_message(1023) });
    }

    return res.status(200).json({
      status: true,
      message: get_message(1027),
      address,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};


//delete address by user
exports.deleteAddress = async (req, res) => {
  try {
    if (!req.query.addressId || !req.query.userId) {
      return res.status(400).json({ status: false, massage: get_message(1026) });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const addressId = new mongoose.Types.ObjectId(req.query.addressId);

    const [user, address] = await Promise.all([User.findOne({ _id: userId }), Address.findOne({ _id: addressId, userId: userId })]);

    if (!user) {
      return res.status(404).json({ status: false, message: get_message(1019) });
    }

    if (user.isBlock) {
      return res.status(404).json({ status: false, message: get_message(1017) });
    }

    if (!address) {
      return res.status(404).json({ status: false, message: get_message(1023) });
    }

    await address.deleteOne();

    return res.status(200).json({ status: true, message: get_message(1028) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};