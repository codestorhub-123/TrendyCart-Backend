const Attributes = require("../models/attributes.model");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { deleteFile } = require("../../utils/deleteFile");
const { get_message } = require("../../utils/message");
const getApiBase = require("../../utils/getApiBase");

const config = { baseURL: getApiBase() };

exports.insertAttributes = async (req, res) => {
    try {
        console.log("req.body : ", req.body);

        let { subCategoryIds, name, fieldType, values, minLength, maxLength, isRequired, isActive } = req.body;

        // Handle subCategoryIds parsing (multipart/form-data sends single items as strings)
        if (subCategoryIds && typeof subCategoryIds === "string") {
            try {
                subCategoryIds = JSON.parse(subCategoryIds);
            } catch (error) {
                subCategoryIds = subCategoryIds.split(",").map(id => id.trim());
            }
        }
        if (!Array.isArray(subCategoryIds)) subCategoryIds = subCategoryIds ? [subCategoryIds] : [];

        if (subCategoryIds.length === 0) {
            if (req.file) deleteFile(req.file);
            return res.status(200).json({
                status: false,
                message: get_message(1047),
            });
        }

        // Handle values parsing
        if (values && typeof values === "string") {
            try {
                values = JSON.parse(values);
            } catch (error) {
                values = values.split(",").map(v => v.trim());
            }
        }

        for (let id of subCategoryIds) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                deleteFile(req.file);
                return res.status(200).json({ status: false, message: `Invalid ObjectId: ${id}` });
            }
        }

        if (!name || typeof name !== "string") {
            deleteFile(req.file);
            return res.status(200).json({
                status: false,
                message: get_message(1048),
            });
        }

        const fieldTypeNum = Number(fieldType);
        const validFieldTypes = [1, 2, 3, 4, 5, 6];

        if (!validFieldTypes.includes(fieldTypeNum)) {
            deleteFile(req.file);
            return res.status(200).json({
                status: false,
                message: get_message(1049),
            });
        }

        const existing = await Attributes.find({
            subCategory: { $in: subCategoryIds },
            "attributes.name": name.trim(),
        }).lean();

        if (existing.length > 0) {
            deleteFile(req.file);
            return res.status(200).json({
                status: false,
                message: get_message(1050),
            });
        }

        const preparedAttr = {
            name: name.trim(),
            image: req.file ? req.file.path : "",
            fieldType: fieldTypeNum,
            isRequired: String(isRequired).toLowerCase() === "true",
            isActive: String(isActive).toLowerCase() === "true",
            values: [],
            minLength: 0,
            maxLength: 0,
        };

        // For Dropdown/Radio/Checkboxes → expect values
        if ([4, 5, 6].includes(fieldTypeNum)) {
            if (!Array.isArray(values)) {
                deleteFile(req.file);
                return res.status(200).json({
                    status: false,
                    message: get_message(1051),
                });
            }

            preparedAttr.values = values.map((v) => v.trim());
        }

        // For Text Input / Number Input → expect min/max length
        if ([1, 2].includes(fieldTypeNum)) {
            if (Number(minLength) > Number(maxLength) && Number(maxLength) > 0) {
                deleteFile(req.file);
                return res.status(200).json({
                    status: false,
                    message: `In attribute "${preparedAttr.name}", minLength cannot be greater than maxLength.`,
                });
            }

            preparedAttr.minLength = minLength;
            preparedAttr.maxLength = maxLength;
        }

        console.log("preparedAttr: ", preparedAttr);

        const insertOps = subCategoryIds.map((id) => ({
            subCategory: id,
            attributes: [preparedAttr],
            isActive: true,
        }));

        await Attributes.insertMany(insertOps);

        const attributes = await Attributes.aggregate([
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subCategory",
                    foreignField: "_id",
                    as: "subCategoryInfo",
                },
            },
            {
                $unwind: {
                    path: "$subCategoryInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "subCategoryInfo.category",
                    foreignField: "_id",
                    as: "categoryInfo",
                },
            },
            {
                $unwind: {
                    path: "$categoryInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    subCategory: {
                        _id: "$subCategoryInfo._id",
                        name: "$subCategoryInfo.name",
                        category: {
                            _id: "$categoryInfo._id",
                            name: "$categoryInfo.name",
                        },
                    },
                    attributes: {
                        $map: {
                            input: "$attributes",
                            as: "attr",
                            in: {
                                $mergeObjects: [
                                    "$$attr",
                                    {
                                        fieldTypeName: {
                                            $switch: {
                                                branches: [
                                                    { case: { $eq: ["$$attr.fieldType", 1] }, then: "Text Input" },
                                                    { case: { $eq: ["$$attr.fieldType", 2] }, then: "Number Input" },
                                                    { case: { $eq: ["$$attr.fieldType", 3] }, then: "File Input" },
                                                    { case: { $eq: ["$$attr.fieldType", 4] }, then: "Radio" },
                                                    { case: { $eq: ["$$attr.fieldType", 5] }, then: "Dropdown" },
                                                    { case: { $eq: ["$$attr.fieldType", 6] }, then: "Checkboxes" },
                                                ],
                                                default: "",
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);

        return res.status(200).json({
            status: true,
            message: get_message(1052),
            attributes,
        });
    } catch (error) {
        deleteFile(req.file);
        console.error(error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error",
        });
    }
};

exports.updateAttributes = async (req, res) => {
    try {
        console.log("updateAttributes req.body : ", req.body);

        let { attributeId, subCategoryId, name, fieldType, values, minLength, maxLength, isRequired, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(attributeId)) {
            if (req.file) deleteFile(req.file);
            return res.status(400).json({ status: false, message: get_message(1053) });
        }

        // Handle values parsing
        if (values && typeof values === "string") {
            try {
                values = JSON.parse(values);
            } catch (error) {
                values = values.split(",").map(v => v.trim());
            }
        }

        if (subCategoryId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
                if (req.file) deleteFile(req.file);
                return res.status(200).json({
                    status: false,
                    message: `Invalid subCategoryId: ${subCategoryId}`,
                });
            }
        }

        let parsedFieldType = fieldType !== undefined ? Number(fieldType) : undefined;
        const validFieldTypes = [1, 2, 3, 4, 5, 6];

        if (parsedFieldType !== undefined && !validFieldTypes.includes(parsedFieldType)) {
            if (req.file) deleteFile(req.file);
            return res.status(200).json({
                status: false,
                message: get_message(1049),
            });
        }

        // Optimized lookup using index
        const existingAttr = await Attributes.findOne({
            $or: [{ "attributes._id": attributeId }, { _id: attributeId }]
        });

        if (!existingAttr) {
            if (req.file) deleteFile(req.file);
            return res.status(404).json({ status: false, message: get_message(1054) });
        }

        let attributeIndex = existingAttr.attributes.findIndex((attr) => attr._id.toString() === attributeId);

        // If not found by attributeId (meaning found by document _id), assume first attribute 
        if (attributeIndex === -1 && existingAttr._id.toString() === attributeId) {
            if (existingAttr.attributes.length > 0) {
                attributeIndex = 0;
            }
        }

        if (attributeIndex === -1) {
            if (req.file) deleteFile(req.file);
            return res.status(200).json({
                status: false,
                message: get_message(1054),
            });
        }

        const attribute = existingAttr.attributes[attributeIndex];

        // Update fields directly
        if (name !== undefined) attribute.name = name.trim();
        if (parsedFieldType !== undefined) attribute.fieldType = parsedFieldType;
        if (subCategoryId) existingAttr.subCategory = subCategoryId;

        if (typeof isRequired !== "undefined") {
            attribute.isRequired = String(isRequired).toLowerCase() === "true";
        }
        if (typeof isActive !== "undefined") {
            attribute.isActive = String(isActive).toLowerCase() === "true";
        }

        if ([4, 5, 6].includes(attribute.fieldType)) {
            if (Array.isArray(values)) {
                attribute.values = values.map((v) => v.trim());
            }
        }

        if ([1, 2].includes(attribute.fieldType)) {
            if (minLength !== undefined && !isNaN(minLength)) attribute.minLength = Number(minLength);
            if (maxLength !== undefined && !isNaN(maxLength)) attribute.maxLength = Number(maxLength);
        }

        if (req.file) {
            if (attribute.image) {
                const image = attribute.image.split("storage");
                if (image && image[1]) {
                    const params = "storage" + image[1];
                    if (fs.existsSync(params)) {
                        fs.unlinkSync(params);
                    }
                }
            }
            attribute.image = req.file.path;
        }

        await existingAttr.save();

        return res.status(200).json({
            status: true,
            message: "Attribute and subcategory updated successfully.",
            existingAttr,
        });
    } catch (error) {
        if (req.file) deleteFile(req.file);
        console.error("updateAttributes error:", error);
        return res.status(500).json({
            status: false,
            error: error.message || "Internal Server Error",
        });
    }
};

exports.listAllAttributes = async (req, res) => {
    try {
        const { subCategoryId, fieldType } = req.query;

        const filter = {};

        if (subCategoryId && subCategoryId !== "All" && mongoose.Types.ObjectId.isValid(subCategoryId)) {
            const sId = new mongoose.Types.ObjectId(subCategoryId);
            filter.$or = [
                { subCategory: sId },
                { _id: sId }
            ];
        }

        if (fieldType && fieldType !== "All" && !isNaN(Number(fieldType))) {
            filter["attributes.fieldType"] = Number(fieldType);
        }

        const attributes = await Attributes.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subCategory",
                    foreignField: "_id",
                    as: "subCategoryInfo",
                },
            },
            {
                $unwind: {
                    path: "$subCategoryInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "subCategoryInfo.category",
                    foreignField: "_id",
                    as: "categoryInfo",
                },
            },
            {
                $unwind: {
                    path: "$categoryInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    subCategory: {
                        _id: "$subCategoryInfo._id",
                        name: "$subCategoryInfo.name",
                        category: {
                            _id: "$categoryInfo._id",
                            name: "$categoryInfo.name",
                        },
                    },
                    attributes: {
                        $filter: {
                            input: {
                                $map: {
                                    input: "$attributes",
                                    as: "attr",
                                    in: {
                                        $mergeObjects: [
                                            "$$attr",
                                            {
                                                fieldTypeName: {
                                                    $switch: {
                                                        branches: [
                                                            { case: { $eq: ["$$attr.fieldType", 1] }, then: "Text Input" },
                                                            { case: { $eq: ["$$attr.fieldType", 2] }, then: "Number Input" },
                                                            { case: { $eq: ["$$attr.fieldType", 3] }, then: "File Input" },
                                                            { case: { $eq: ["$$attr.fieldType", 4] }, then: "Radio" },
                                                            { case: { $eq: ["$$attr.fieldType", 5] }, then: "Dropdown" },
                                                            { case: { $eq: ["$$attr.fieldType", 6] }, then: "Checkboxes" },
                                                        ],
                                                        default: "",
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                            as: "mappedAttr",
                            cond: (fieldType && fieldType !== "All" && !isNaN(Number(fieldType)))
                                ? { $eq: ["$$mappedAttr.fieldType", Number(fieldType)] }
                                : true
                        }
                    },
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);

        return res.status(200).json({
            status: true,
            message: get_message(1056),
            attributes,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
};

exports.destroyAttribute = async (req, res) => {
    try {
        const { attributeId } = req.query;

        const attribute = await Attributes.findOne({
            $or: [{ "attributes._id": attributeId }, { _id: attributeId }]
        });

        if (!attribute) {
            return res.status(404).json({ status: false, message: get_message(1054) });
        }

        // If found by Document ID, delete the whole document
        if (attribute._id.toString() === attributeId) {
            await attribute.deleteOne();
            return res.status(200).json({
                status: true,
                message: get_message(1055),
            });
        }

        // Otherwise (found by nested attribute ID), pull from array
        attribute.attributes.pull({ _id: attributeId });

        if (attribute.attributes.length === 0) {
            await attribute.deleteOne();
        } else {
            await attribute.save();
        }

        return res.status(200).json({
            status: true,
            message: get_message(1055),
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message || "Internal Server Error",
        });
    }
};
