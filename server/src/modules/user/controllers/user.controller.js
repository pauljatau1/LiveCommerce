const listService = require('../services/list.service');
const indexService = require('../services/index.service');
const userCreateService = require('../services/create.service');
const userUpdateService = require('../services/update.service');
const userDeleteService = require('../services/delete.service');
const userActivateService = require('../services/activate.service');

/**
 * Controller: List Users
 *
 * Handles requests to list users, either paginated or unpaginated.
 * It uses `indexService` to extract pagination options and filters from the request,
 * and `listService` to fetch the corresponding user records from the database.
 *
 * If pagination is enabled (`pagination.enabled`), it returns a paginated response.
 * Otherwise, it returns the full list of users matching the filters.
 *
 * Success response:
 *   {
 *     success: true,
 *     data: [...],
 *     total: <number>, // if paginated
 *     page: <number>,  // if paginated
 *     limit: <number>  // if paginated
 *   }
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function for error handling
 */
const index = async (req, res, next) => {
  try {
    const pagination = indexService.getPaginationOptions(req);
    const filters = indexService.getFilters(req);

    let users = [];
    if (pagination.enabled) {
        const params = { ...pagination, filters: filters };
        users = await listService.listPaginatedUsers(params);
    } else {
        users = await listService.listUsers(filters);
    }

    return res.success(users, 'User list retrieved successfully', 200);
  } catch (err) {
    next(err); // Use centralized error handler
  }
};

/**
 * Show a single user by ID.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const show = async (req, res, next) => {
  try {
    // Find user by ID
    const userId = req.params.userId;
    const user = await listService.showUser(userId);
    if (!user) {
        return res.status(404).json({success: false, message: 'User not found'});
    }

    return res.success(user, 'User retrieved successfully', 200);
  } catch (err) {
    next(err); // Forward error to centralized error handler
  }
};


/**
 * Handles HTTP request to create a new user.
 * 
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
async function store(req, res, next) {
  try {
    const createdUser = await userCreateService.createUser(req.body);
    res.success(createdUser, 'User created successfully', 201);
  } catch (err) {
    next(err); // pass errors to centralized error handler
  }
}

/**
 * Handles HTTP request to update a user.
 * 
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
async function update(req, res, next) {
  try {
    const userId = req.params.userId;
    const data = req.body;

    const updatedUser = await userUpdateService.updateUser(userId, data);
    return res.success({ data: updatedUser }, 'User updated successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a user by ID.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
async function destroy(req, res, next) {
  try {
    const userId = req.params.userId;

    await userDeleteService.deleteUser(userId);

    return res.status(204).send(); // No content
  } catch (err) {
    next(err);
  }
}

/**
 * Activate a user by ID.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
async function activateUser(req, res, next) {
  try {
    const userId = req.params.userId;

    await userActivateService.activateUser(userId);

    return res.success({}, 'User activated successfully', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  index,
  show,
  store,
  update,
  destroy,
  activateUser
};