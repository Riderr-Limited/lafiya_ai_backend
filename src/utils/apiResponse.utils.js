class ApiResponse {
  static success(res, data = {}, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, ...data });
  }

  static created(res, data = {}, message = "Created successfully") {
    return this.success(res, data, message, 201);
  }

  static error(res, message = "Something went wrong", statusCode = 500) {
    return res.status(statusCode).json({ success: false, message });
  }

  static notFound(res, message = "Resource not found") {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = "Unauthorized") {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = "Forbidden") {
    return this.error(res, message, 403);
  }

  static paginate(res, data, pagination, message = "Success") {
    return res.status(200).json({ success: true, message, pagination, ...data });
  }
}

module.exports = ApiResponse;