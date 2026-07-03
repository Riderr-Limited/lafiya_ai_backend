const paginate = (query, page = 1, limit = 20) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return query.skip(skip).limit(parseInt(limit));
};

const getPaginationMeta = (total, page = 1, limit = 20) => ({
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  pages: Math.ceil(total / parseInt(limit)),
});

module.exports = { paginate, getPaginationMeta };
