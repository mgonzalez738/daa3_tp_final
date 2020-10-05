const dateFormat = require('dateformat');

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

exports.getUtcString = () => {
    var date = new Date(Date.now());
    var formatted_date = date.getDate().pad(2) + "/" + (date.getMonth() + 1).pad(2) + "/" +  date.getFullYear() + " " + date.getHours().pad(2) + ":" + date.getMinutes().pad(2) + ":" + date.getSeconds().pad(2);
    return "[" + formatted_date + "] ";
}