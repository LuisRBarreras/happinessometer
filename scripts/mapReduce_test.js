var nearsoft = db.companies.find({ domain: "@nearsoft.com "});

db.moods.mapReduce(
    function () {
        emit(this.user, this.mood);
    },
    function (key, values) {
        return values.join(",");
    },
    {
        query: {},
        out: "test",
        finalize: function (key, reducedValue) {
            var obj = {}, res = reducedValue.split(",");
            for (var i = 0; i < res.length; ++i) {
                obj[res[i].trim()] = (obj[res[i].trim()] || 0) + 1;
            }
            return obj;
        }
    }
);

var results = db.test.find({});
while (results.hasNext()) {
    printjson(results.next());
}