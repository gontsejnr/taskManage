const Activity = require("../models/Activity");

// activity logging
const logActivity = (action, entityType) => {
  return async (req, res, next) => {
    // store original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    // override response methods to log activity on success
    res.send = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivityAsync(req, action, entityType, data);
      }
      return originalSend.call(this, data);
    };

    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivityAsync(req, action, entityType, data);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// async activity logging function
const logActivityAsync = async (req, action, entityType, responseData) => {
  try {
    if (!req.user) return;

    let entityId, entityName, details, changes;

    // extract entity information based on response data and request
    if (responseData && typeof responseData === "object") {
      const data =
        typeof responseData === "string"
          ? JSON.parse(responseData)
          : responseData;

      if (data.data) {
        entityId = data.data._id || data.data.id;
        entityName = data.data.title || data.data.name || "Unknown";
      } else if (data._id) {
        entityId = data._id;
        entityName = data.title || data.name || "Unknown";
      }
    }

    // fallback to request parameters
    if (!entityId && req.params.id) {
      entityId = req.params.id;
    }

    // create activity log
    if (entityId) {
      const activity = new Activity({
        user: req.user._id,
        action,
        entityType,
        entityId,
        entityName,
        details: generateActivityDetails(action, entityType, req),
        changes: req.body,
      });

      await activity.save();
    }
  } catch (error) {
    console.error("Activity logging error:", error);
  }
};

// generate activity details
const generateActivityDetails = (action, entityType, req) => {
  const actionMap = {
    created: `created a new ${entityType}`,
    updated: `updated a ${entityType}`,
    deleted: `deleted a ${entityType}`,
    assigned: `assigned a ${entityType}`,
    completed: `completed a ${entityType}`,
    commented: `commented on a ${entityType}`,
  };

  return actionMap[action] || `performed ${action} on ${entityType}`;
};

module.exports = { logActivity };
