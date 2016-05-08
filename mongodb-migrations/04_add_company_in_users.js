companies = db.companies.find({});

while (companies.hasNext()) {
    var company = companies.next();

    db.users.update(
      { email: new RegExp(".+" + company.domain) },
      { $set: { "company": company._id } },
      { multi: true }
    );
}

