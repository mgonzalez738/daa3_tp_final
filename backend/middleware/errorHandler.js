module.exports = (error, req, res, next) => {
    res.status(error.statusCode || 500).json({
        Success: false,
        Message: error.message || 'Server error',
        //Data: error.data
    });
};