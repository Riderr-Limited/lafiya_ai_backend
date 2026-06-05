const Community = require("../models/Community.model");
const User = require("../models/User.model");
const Post = require("../models/Post.model");
const AppError = require("../utils/AppError");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");
const { uploadFile } = require("../utils/cloudinary.utils");
const { createNotification } = require("../utils/notification.utils");

// GET /api/communities
exports.getAllCommunities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, search, language } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (language) filter.language = { $in: [language, "both"] };
    if (search) filter.name = { $regex: search, $options: "i" };

    const { skip, limit: lim } = paginate(null, page, limit);
    const [communities, total] = await Promise.all([
      Community.find(filter)
        .populate("moderators", "firstName lastName avatar role")
        .populate("doctors", "specialization")
        .skip(skip)
        .limit(lim)
        .sort("-totalMembers"),
      Community.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      communities,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/communities/:id
exports.getCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("moderators", "firstName lastName avatar role")
      .populate({ path: "doctors", populate: { path: "user", select: "firstName lastName avatar" } })
      .populate("pinnedPost");

    if (!community) return next(new AppError("Community not found", 404));
    res.status(200).json({ success: true, community });
  } catch (error) {
    next(error);
  }
};

// POST /api/communities  (admin/moderator)
exports.createCommunity = async (req, res, next) => {
  try {
    const { name, description, category, rules, isPrivate, language, tags } = req.body;

    const community = await Community.create({
      name,
      description,
      category,
      rules,
      isPrivate,
      language,
      tags,
      moderators: [req.user._id],
    });

    res.status(201).json({ success: true, message: "Community created", community });
  } catch (error) {
    next(error);
  }
};

// PUT /api/communities/:id
exports.updateCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return next(new AppError("Community not found", 404));

    // Only admins or moderators can update
    const isMod = community.moderators.some((m) => m.toString() === req.user._id.toString());
    if (!isMod && req.user.role !== "admin") {
      return next(new AppError("Not authorized", 403));
    }

    const allowed = ["name", "description", "rules", "isPrivate", "language", "tags"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) community[field] = req.body[field];
    });

    if (req.file) {
      const result = await uploadFile(req.file.path, "healthcommunity/communities");
      community.coverImage = result.url;
    }

    await community.save();
    res.status(200).json({ success: true, message: "Community updated", community });
  } catch (error) {
    next(error);
  }
};

// POST /api/communities/:id/join
exports.joinCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return next(new AppError("Community not found", 404));

    const alreadyMember = community.members.includes(req.user._id);
    if (alreadyMember) return next(new AppError("Already a member", 400));

    community.members.push(req.user._id);
    community.totalMembers = community.members.length;
    await community.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { communities: community._id },
    });

    res.status(200).json({ success: true, message: "Joined community successfully" });
  } catch (error) {
    next(error);
  }
};

// POST /api/communities/:id/leave
exports.leaveCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return next(new AppError("Community not found", 404));

    community.members = community.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    community.totalMembers = community.members.length;
    await community.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { communities: community._id },
    });

    res.status(200).json({ success: true, message: "Left community" });
  } catch (error) {
    next(error);
  }
};

// GET /api/communities/:id/members
exports.getCommunityMembers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const community = await Community.findById(req.params.id);
    if (!community) return next(new AppError("Community not found", 404));

    const { skip, limit: lim } = paginate(null, page, limit);
    const members = await User.find({ _id: { $in: community.members } })
      .select("firstName lastName avatar role isVerified")
      .skip(skip)
      .limit(lim);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(community.totalMembers, page, lim),
      members,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/communities/:id/add-doctor  (admin)
exports.addDoctorToCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return next(new AppError("Community not found", 404));

    community.doctors.addToSet(req.body.doctorId);
    await community.save();

    // Notify doctor
    await createNotification({
      recipient: req.body.userId,
      type: "community_invite",
      title: "Community Assignment",
      body: `You have been assigned as a moderating doctor for ${community.name}`,
      link: `/communities/${community._id}`,
    });

    res.status(200).json({ success: true, message: "Doctor added to community" });
  } catch (error) {
    next(error);
  }
};