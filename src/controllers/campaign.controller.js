const Campaign = require("../models/Campaign.model");
const Community = require("../models/Community.model");
const AppError = require("../utils/AppError");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");
const { uploadFile } = require("../utils/cloudinary.utils");
const { createNotification } = require("../utils/notification.utils");

// GET /api/campaigns
exports.getAllCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, language, search } = req.query;
    const filter = { isPublished: true };
    if (type) filter.type = type;
    if (language) filter.language = { $in: [language, "both"] };
    if (search) filter.title = { $regex: search, $options: "i" };

    const { skip, limit: lim } = paginate(null, page, limit);
    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate("createdBy", "firstName lastName avatar role")
        .skip(skip).limit(lim).sort("-createdAt"),
      Campaign.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      campaigns,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/campaigns/:id
exports.getCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("createdBy", "firstName lastName avatar role");

    if (!campaign) return next(new AppError("Campaign not found", 404));
    res.status(200).json({ success: true, campaign });
  } catch (error) {
    next(error);
  }
};

// POST /api/campaigns  (admin/doctor)
exports.createCampaign = async (req, res, next) => {
  try {
    const { title, description, type, content, language, targetAudience, startDate, endDate, sponsor, communityIds } = req.body;

    let coverImage;
    if (req.file) {
      const result = await uploadFile(req.file.path, "healthcommunity/campaigns");
      coverImage = result.url;
    }

    const campaign = await Campaign.create({
      title,
      description,
      type,
      content,
      language,
      targetAudience,
      startDate,
      endDate,
      sponsor,
      coverImage,
      createdBy: req.user._id,
      communities: communityIds ? (Array.isArray(communityIds) ? communityIds : JSON.parse(communityIds)) : [],
    });

    res.status(201).json({ success: true, message: "Campaign created", campaign });
  } catch (error) {
    next(error);
  }
};

// PUT /api/campaigns/:id/publish  (admin)
exports.publishCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return next(new AppError("Campaign not found", 404));

    campaign.isPublished = true;
    await campaign.save();

    // Notify all members of targeted communities
    const io = req.app.get("io");
    if (campaign.communities.length > 0) {
      const communities = await Community.find({ _id: { $in: campaign.communities } });
      for (const community of communities) {
        const sample = community.members.slice(0, 100);
        for (const memberId of sample) {
          const notif = await createNotification({
            recipient: memberId,
            type: "campaign",
            title: `New Health Campaign: ${campaign.title}`,
            body: campaign.description.substring(0, 100),
            link: `/campaigns/${campaign._id}`,
          });
          if (io) io.to(`user:${memberId}`).emit("notification", notif);
        }
      }
    }

    res.status(200).json({ success: true, message: "Campaign published", campaign });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/campaigns/:id  (admin)
exports.deleteCampaign = async (req, res, next) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    next(error);
  }
};