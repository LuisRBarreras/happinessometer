unknownUser = db.users.findOne({ email: "unknown@nearsoft.com"} );

cursor = db.moods.find();
while (cursor.hasNext()) {
    var obj = cursor.next();
    if (obj.user && typeof obj.user === "string") {
        db.moods.update({ _id: obj._id }, { $set: { "user_str" : obj.user }});
        db.moods.update({ _id: obj._id }, { $unset: { "user" : 1 }});
    }
}

db.moods.update({}, {
    $set: {
        user: unknownUser._id
    }
}, {
    multi: true
});