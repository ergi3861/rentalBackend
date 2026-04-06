const validationMiddleware = (fields = []) => {
    return (req, res, next) => {
        const missingFields = fields.filter(
            field => !req.body[field]
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Missing required fields',
                fields: missingFields
            });
        }

        next();
    };
};

module.exports = validationMiddleware;