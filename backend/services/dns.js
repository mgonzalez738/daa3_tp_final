const dns = require('dns');

exports.resolve = async (domain) => {
    return new Promise((resolve, reject) => {
        dns.lookup(domain, (err, address, family) => {
            if(err) reject(err);
            resolve(address);
        });
   });
};