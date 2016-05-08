companies = db.companies.find({});

var count = 1;
while (companies.hasNext()) {
    var company = companies.next();
    db.users.insert({
        company: company._id,
        username: "unknown" + count++,
        password: "123",
        name: {
            first: "unknown",
            last: "unknown"
        },
        email: "unknown" + company.domain,
        enabled: false,
        createdAt: Date()
    });
}