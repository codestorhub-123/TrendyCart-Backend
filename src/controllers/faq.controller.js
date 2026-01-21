const FAQ = require("../models/FAQ.model");
const { get_message } = require("../../utils/message");

exports.getFAQs = async (req, res) => {
  try {
    const FaQ = await FAQ
      .find({})
      .sort({ createdAt: 1 })
      .lean(); // 🚀 BIG performance boost

    return res.status(200).json({
      status: true,
      message: get_message(1100),
      FaQ
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server error"
    });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.question || !req.body.answer) {
      return res.status(400).json({ status: false, message: get_message(1074) });
    }

    const faq = new FAQ({
      question: req.body.question,
      answer: req.body.answer
    });

    await faq.save();

    return res.status(200).json({ status: true, message: get_message(1101), faq });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.query.faqId) {
      return res.status(400).json({ status: false, message: get_message(1102) });
    }

    const updateData = {};
    if (req.body.question) updateData.question = req.body.question;
    if (req.body.answer) updateData.answer = req.body.answer;

    const faq = await FAQ.findByIdAndUpdate(
      req.query.faqId,
      { $set: updateData },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ status: false, message: get_message(1103) });
    }

    return res.status(200).json({ status: true, message: get_message(1104), faq });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

exports.delete = async (req, res) => {
  try {
    if (!req.query.faqId) {
      return res.status(400).json({ status: false, message: get_message(1102) });
    }

    const faq = await FAQ.findByIdAndDelete(req.query.faqId);

    if (!faq) {
      return res.status(404).json({ status: false, message: get_message(1103) });
    }

    return res.status(200).json({ status: true, message: get_message(1105) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
