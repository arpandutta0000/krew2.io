const mongoose = require(`mongoose`);

const url = `mongodb://localhost:27017`;
const db = `krewDB`;

module.exports = mongoose.connect(`${url}/${db}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log(`Succesfully connected to database.`));
