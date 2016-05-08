nearsoft = db.companies.findOne({ domain: "@nearsoft.com" });

db.moods.update(
  {},
  { $set: { "company": nearsoft._id } },
  { multi: true }
);