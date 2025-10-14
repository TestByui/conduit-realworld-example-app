      await appendFollowers(loggedUser, loggedUser);
      await appendFavorites(loggedUser, article);
      await article.addTagList(allTagInstances, { transaction: t });
    const slug = slugify(title);
    const slugInDB = await Article.findOne({ where: { slug } });
    if (slugInDB) throw new AlreadyTakenError("Title");
const {
  AlreadyTakenError,
  FieldRequiredError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} = require("../helper/customErrors");
const {
  appendFollowers,
  appendFavorites,
  appendTagList,
  slugify,
} = require("../helper/helpers");
const { Article, Tag, User } = require("../models");

const includeOptions = [
  { model: Tag, as: "tagList", attributes: ["name"] },
  { model: User, as: "author", attributes: { exclude: ["email"] } },
];

//? All Articles - by Author/by Tag/Favorited by user
const allArticles = async (req, res, next) => {
  try {
    const { loggedUser } = req;

    const { author, tag, favorited, limit = 3, offset = 0 } = req.query;
    const searchOptions = {
      include: [
        {
          model: Tag,
          as: "tagList",
          attributes: ["name"],
          ...(tag && { where: { name: tag } }),
        },
        {
          model: User,
          as: "author",
          attributes: { exclude: ["email"] },
          ...(author && { where: { username: author } }),
        },
      ],
      limit: parseInt(limit),
      offset: offset * limit,
      order: [["createdAt", "DESC"]],
    };

    let articles = { rows: [], count: 0 };
    if (favorited) {
      const user = await User.findOne({ where: { username: favorited } });

      articles.rows = await user.getFavorites(searchOptions);
      articles.count = await user.countFavorites();
    } else {
      articles = await Article.findAndCountAll(searchOptions);
    }

    for (let article of articles.rows) {
      const articleTags = await article.getTagList();

      appendTagList(articleTags, article);
      await appendFollowers(loggedUser, article);
      await appendFavorites(loggedUser, article);

      delete article.dataValues.Favorites;
    }

    res.json({ articles: articles.rows, articlesCount: articles.count });
    return res.status(201).json({ article: result });
  } catch (error) {
    next(error);
  }
};

//* Create Article
const createArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { title, description, body, tagList } = req.body.article || {};
    if (!title || typeof title !== "string" || !title.trim())
      throw new FieldRequiredError("A title");
    if (!description || typeof description !== "string" || !description.trim())
      throw new FieldRequiredError("A description");
    if (!body || typeof body !== "string" || !body.trim())
      throw new FieldRequiredError("An article body");

    // Validate and sanitize tagList
    if (
      !Array.isArray(tagList) ||
      tagList.some(tag => typeof tag !== "string" || tag.trim().length < 2)
    ) {
      throw new FieldRequiredError("A tagList (each tag must be at least 2 characters)");
    }
    // Remove duplicates, trim, filter short tags
    const sanitizedTags = [
      ...new Set(tagList.map(tag => tag.trim()).filter(t => t.length >= 2)),
    ];

    // Transaction for atomic insert
    const result = await Article.sequelize.transaction(async (t) => {
      const article = await Article.create(
        {
          slug,
          title: title.trim(),
          description: description.trim(),
          body: body.trim(),
        },
        { transaction: t }
      );

      // Fetch all existing tags at once
      const existingTags = await Tag.findAll({
        where: { name: sanitizedTags },
        transaction: t,
      });
      const existingTagNames = existingTags.map(tag => tag.name);

      // Create missing tags in one bulk insert
      const newTagsData = sanitizedTags
        .filter(tag => !existingTagNames.includes(tag))
        .map(tag => ({ name: tag }));
      let newTags = [];
      if (newTagsData.length > 0) {
        newTags = await Tag.bulkCreate(newTagsData, { transaction: t });
      }

      // Combine all tag instances
      const allTagInstances = [...existingTags, ...newTags];

      // Assign author and prepare response
      await article.setAuthor(loggedUser, { transaction: t });
      delete loggedUser.dataValues.token;

      article.dataValues.tagList = sanitizedTags;
      article.dataValues.author = loggedUser;

      return article;
    });
  } catch (error) {
    next(error);
  }
};

//* Feed
const articlesFeed = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { limit = 3, offset = 0 } = req.query;
    const authors = await loggedUser.getFollowing();

    const articles = await Article.findAndCountAll({
      include: includeOptions,
      limit: parseInt(limit),
      offset: offset * limit,
      order: [["createdAt", "DESC"]],
      where: { userId: authors.map((author) => author.id) },
    });

    for (const article of articles.rows) {
      const articleTags = await article.getTagList();

      appendTagList(articleTags, article);
      await appendFollowers(loggedUser, article);
      await appendFavorites(loggedUser, article);
    }

    res.json({ articles: articles.rows, articlesCount: articles.count });
  } catch (error) {
    next(error);
  }
};

// Single Article by slug
const singleArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;

    const { slug } = req.params;
    const article = await Article.findOne({
      where: { slug: slug },
      include: includeOptions,
    });
    if (!article) throw new NotFoundError("Article");

    appendTagList(article.tagList, article);
    await appendFollowers(loggedUser, article);
    await appendFavorites(loggedUser, article);

    res.json({ article });
  } catch (error) {
    next(error);
  }
};

//* Update Article
const updateArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { slug } = req.params;
    const article = await Article.findOne({
      where: { slug: slug },
      include: includeOptions,
    });
    if (!article) throw new NotFoundError("Article");

    if (loggedUser.id !== article.author.id) {
      throw new ForbiddenError("article");
    }

    const { title, description, body } = req.body.article;
    if (title) {
      article.slug = slugify(title);
      article.title = title;
    }
    if (description) article.description = description;
    if (body) article.body = body;
    await article.save();

    appendTagList(article.tagList, article);
    await appendFollowers(loggedUser, article);
    await appendFavorites(loggedUser, article);

    res.json({ article });
  } catch (error) {
    next(error);
  }
};

//* Delete Article
const deleteArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { slug } = req.params;
    const article = await Article.findOne({
      where: { slug: slug },
      include: includeOptions,
    });
    if (!article) throw new NotFoundError("Article");

    if (loggedUser.id !== article.author.id) {
      throw new ForbiddenError("article");
    }

    await article.destroy();

    res.json({ message: { body: ["Article deleted successfully"] } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  allArticles,
  createArticle,
  singleArticle,
  updateArticle,
  deleteArticle,
  articlesFeed,
};
