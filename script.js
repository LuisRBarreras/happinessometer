var c = db.moods.find({});

while(c.hasNext()) {
    printjson(c.next());
}