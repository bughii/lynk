import { User } from "../models/UserModel.js";

export const SearchContacts = async (req, res) => {
  try {
    const { searchTerm } = req.body;
    if (searchTerm === undefined || searchTerm === null) {
      return res.status(400).json({ mesage: "Search term required" });
    }

    // Sanitize the search term
    const sanitizedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    // The new search term is sanitized and case insensitive
    const regex = new RegExp(sanitizedSearchTerm, "i");

    // Search for userNames that match the regex string, excluding yourself
    const contacts = await User.find({
      $and: [
        { _id: { $ne: req.userId } },
        {
          $or: [{ userName: regex }],
        },
      ],
    });

    return res.status(200).json({ contacts });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal server error");
  }
};
