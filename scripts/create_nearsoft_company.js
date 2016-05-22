var nearsoft = db.companies.find({ domain: "@nearsoft.com "});

if (nearsoft.hasNext()) {
    print("Nearsoft already exists.");
    printjson(nearsoft.next());
} else {
    db.companies.insert({
        name: 'Nearsoft, Inc',
        domain: '@nearsoft.com'
    });
    print("Nearsoft created.");
}

print("Done.");